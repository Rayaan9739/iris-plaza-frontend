import re

with open(r'd:\manipal\backend\src\modules\admin\admin.service.ts', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = """  async updateTenant(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      updateRoomId?: string;
      newRoomId?: string;
      roomChangeDate?: string;
      extendOccupiedUntil?: string;
      bookingSource?: string;
      brokerName?: string;
    },
  ) {
    const requestedRoomId = String(
      data.updateRoomId ?? data.newRoomId ?? "",
    ).trim();
    const parsedRoomChangeDate = this.parseDateInput(
      data.roomChangeDate,
      "roomChangeDate",
    );
    const parsedExtendOccupiedUntil = this.parseDateInput(
      data.extendOccupiedUntil,
      "extendOccupiedUntil",
    );

    console.log("UPDATE TENANT INPUT:", {
      userId,
      ...data,
      requestedRoomId,
      parsedRoomChangeDate,
      parsedExtendOccupiedUntil,
    });

    try {
      const booking = await this.prisma.booking.findFirst({
        where: {
          userId,
          status: { in: this.activeTenantBookingStatuses },
        },
        include: {
          room: {
            select: {
              id: true,
              name: true,
              type: true,
              floor: true,
              area: true,
              rent: true,
              deposit: true,
              status: true,
              isAvailable: true,
              occupiedFrom: true,
              occupiedUntil: true,
              availableAt: true,
              videoUrl: true,
            },
          },
          user: true,
        },
        orderBy: { createdAt: "desc" },
      });

      if (!booking) {
        throw new NotFoundException("Active tenant booking not found");
      }

      const currentRoomId = booking.roomId;
      if (!currentRoomId) {
        throw new BadRequestException("Current booking has no room assigned");
      }

      const targetRoomId = requestedRoomId || undefined;
      const isRoomChangeRequested =
        !!targetRoomId && targetRoomId !== currentRoomId;
      const todayUtc = this.toStartOfUtcDay(new Date());

      if (isRoomChangeRequested && !parsedRoomChangeDate) {
        throw new BadRequestException(
          "roomChangeDate is required when assigning a different room",
        );
      }

      const transactionResult = await this.prisma.$transaction(async (tx) => {
        let bookingIdForResponse = booking.id;

        // STEP 1: Update user details
        if (
          data.firstName !== undefined ||
          data.lastName !== undefined ||
          data.phone !== undefined
        ) {
          const userUpdate: any = {};
          if (data.firstName !== undefined) userUpdate.firstName = data.firstName;
          if (data.lastName !== undefined) userUpdate.lastName = data.lastName;

          if (data.phone !== undefined) {
            const existingUser = await tx.user.findFirst({
              where: {
                phone: data.phone,
                NOT: { id: userId },
              },
            });

            if (existingUser) {
              throw new BadRequestException(
                "Phone number is already in use by another user",
              );
            }
            userUpdate.phone = data.phone;
          }

          await tx.user.update({
            where: { id: userId },
            data: userUpdate,
          });
        }

        // STEP 1B: Update booking source (broker/walkin)
        if (data.bookingSource !== undefined) {
          const normalizedSource = this.normalizeBookingSource(
            data.bookingSource as any || null
          );
          const normalizedBrokerName = this.normalizeBrokerName(
            normalizedSource,
            data.brokerName
          );
          
          await tx.booking.update({
            where: { id: booking.id },
            data: {
              bookingSource: normalizedSource,
              brokerName: normalizedBrokerName,
            },
          });
        }

        // STEP 2: Extend occupied-until date (optional)
        const currentOccupiedUntil =
          booking.moveOutDate ??
          booking.endDate ??
          booking.room?.occupiedUntil ??
          null;
        const newDate = parsedExtendOccupiedUntil ?? currentOccupiedUntil;
        let finalMoveOutDate = newDate;

        if (parsedExtendOccupiedUntil !== undefined) {
          await tx.booking.update({
            where: { id: booking.id },
            data: {
              moveOutDate: newDate ?? null,
              endDate: newDate ?? null,
            },
          });
          // Explicitly NOT updating the room table per new requirements
        }

        // STEP 3: Change room (immediate or scheduled)
        if (isRoomChangeRequested && targetRoomId && parsedRoomChangeDate) {
          const moveDateUtc = this.toStartOfUtcDay(parsedRoomChangeDate);
          if (moveDateUtc < todayUtc) {
            throw new BadRequestException("roomChangeDate cannot be in the past");
          }

          const targetRoom = await tx.room.findUnique({
            where: { id: targetRoomId },
            select: {
              id: true,
              name: true,
            },
          });

          if (!targetRoom) {
            throw new NotFoundException("Target room not found");
          }

          // Complete old booking immediately
          await tx.booking.update({
            where: { id: booking.id },
            data: {
              status: "COMPLETED",
              endDate: parsedRoomChangeDate,
              moveOutDate: parsedRoomChangeDate,
            },
          });

          const normalizedSource = this.normalizeBookingSource(
            (data.bookingSource as any) || booking.bookingSource
          );
          const brokerNameInput = data.bookingSource !== undefined ? data.brokerName : booking.brokerName;
          const normalizedBrokerName = this.normalizeBrokerName(
            normalizedSource,
            brokerNameInput
          );

          // Create new booking immediately
          const newBooking = await tx.booking.create({
            data: {
              userId,
              roomId: targetRoomId,
              status: "APPROVED",
              moveInDate: parsedRoomChangeDate,
              startDate: parsedRoomChangeDate,
              endDate: finalMoveOutDate,
              moveOutDate: finalMoveOutDate,
              bookingFee: booking.bookingFee,
              bookingFeePaid: booking.bookingFeePaid,
              bookingSource: normalizedSource,
              brokerName: normalizedBrokerName,
            },
          });

          bookingIdForResponse = newBooking.id;
        }

        return {
          bookingId: bookingIdForResponse,
        };
      }, {
        maxWait: 10000,
        timeout: 20000,
      });

      // Fetch response data after commit to keep transaction short and avoid timeout.
      const [updatedUser, updatedBooking] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
        }),
        this.prisma.booking.findUnique({
          where: { id: transactionResult.bookingId },
          include: {
            room: {
              select: {
                id: true,
                name: true,
                type: true,
                floor: true,
                area: true,
                rent: true,
                deposit: true,
                status: true,
                isAvailable: true,
                occupiedFrom: true,
                occupiedUntil: true,
                availableAt: true,
                videoUrl: true,
              },
            },
          },
        }),
      ]);

      return {
        success: true,
        user: updatedUser,
        room: updatedBooking?.room,
        booking: updatedBooking,
        message: "Tenant updated successfully",
      };
    } catch (error) {
      console.error("REAL UPDATE TENANT ERROR:", error);
      throw error;
    }
  }

  async getAdminPayments() {"""

# Find the start of updateTenant
match = re.search(r'async updateTenant\([\s\S]*?async getAdminPayments\(\) \{', content)
if match:
    new_content = content[:match.start()] + new_func + content[match.end():]
    with open(r'd:\manipal\backend\src\modules\admin\admin.service.ts', 'w', encoding='utf-8', newline='') as f:
        f.write(new_content)
    print("Successfully replaced updateTenant")
else:
    print("Could not find updateTenant")
