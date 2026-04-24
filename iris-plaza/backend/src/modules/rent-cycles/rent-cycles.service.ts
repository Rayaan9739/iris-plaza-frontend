import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { NotificationsService } from "@/modules/notifications/notifications.service";

@Injectable()
export class RentCyclesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async findMyRentCycles(userId: string) {
    return this.prisma.rentCycle.findMany({
      where: { userId },
      include: { booking: { include: { room: true } }, payments: true },
      orderBy: { year: "desc", month: "desc" },
    });
  }

  async getCurrentCycle(userId: string) {
    const now = new Date();
    return this.prisma.rentCycle.findFirst({
      where: { userId, year: now.getFullYear(), month: now.getMonth() + 1 },
      include: { booking: { include: { room: true } }, payments: true },
    });
  }

  async findAll() {
    return this.prisma.rentCycle.findMany({
      include: {
        user: true,
        booking: { include: { room: true } },
        payments: true,
      },
      orderBy: { year: "desc", month: "desc" },
    });
  }

  async generateMonthlyRent() {
    // Generate rent cycles for all active bookings
    const now = new Date();
    const bookings = await this.prisma.booking.findMany({
      where: { status: "APPROVED", endDate: null },
      include: { room: true },
    });

    for (const booking of bookings) {
      const existingCycle = await this.prisma.rentCycle.findFirst({
        where: {
          bookingId: booking.id,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        },
      });

      if (!existingCycle) {
        const moveInDate = booking.moveInDate ?? booking.startDate;
        const anchorDay = moveInDate ? moveInDate.getDate() : 1;
        const monthLastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const dueDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          Math.min(anchorDay, monthLastDay),
        );
        await this.prisma.rentCycle.create({
          data: {
            userId: booking.userId,
            bookingId: booking.id,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            amount: booking.room.rent,
            dueDate,
            status: "PENDING",
          },
        });

        await this.notificationsService.create(booking.userId, {
          type: "PUSH",
          title: "Monthly Rent Due",
          message: `Rent for ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")} is now due.`,
        });
      }
    }
  }

  async markAsPaid(id: string) {
    return this.prisma.rentCycle.update({
      where: { id },
      data: { status: "PAID", paidDate: new Date() },
    });
  }
}
