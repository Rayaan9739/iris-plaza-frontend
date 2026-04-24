import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { BookingsService } from "./bookings.service";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";

@ApiTags("Bookings")
@Controller("bookings")
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get my bookings" })
  async getMyBookings(@Request() req: any) {
    return this.bookingsService.findMyBookings(req.user.userId);
  }

  @Get("my")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get my approved booking with room details" })
  async getMyBookingsAlias(@Request() req: any) {
    return this.bookingsService.findMyApprovedBooking(req.user.userId);
  }

  @Get("my-active-booking")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get my active booking" })
  async getMyActiveBooking(@Request() req: any) {
    const booking = await this.bookingsService.findMyApprovedBooking(
      req.user.userId,
    );
    if (!booking) {
      return null;
    }
    return {
      id: booking.bookingId,
      roomId: booking.roomId,
      status: booking.status,
    };
  }

  @Get("my-room")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get my room (approved booking)" })
  async getMyRoom(@Request() req: any) {
    const booking = await this.bookingsService.findMyApprovedBooking(
      req.user.userId,
    );
    if (!booking) {
      return null;
    }
    return {
      bookingId: booking.bookingId,
      room: booking.room,
    };
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get booking by ID" })
  async findOne(@Param("id") id: string) {
    return this.bookingsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new booking" })
  async create(@Request() req: any, @Body() body: CreateBookingDto) {
    console.log("CREATE BOOKING REQUEST:", {
      userId: req.user.userId,
      body,
    });
    return this.bookingsService.create({
      userId: req.user.userId,
      roomId: body.roomId,
      moveInDate: body.moveInDate,
      moveOutDate: body.moveOutDate,
      source: body.source,
      bookingSource: body.bookingSource,
      brokerName: body.brokerName,
    });
  }

  @Patch(":id/cancel")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cancel a booking" })
  async cancel(@Param("id") id: string) {
    return this.bookingsService.cancel(id);
  }

  // Admin endpoints
  @Get("admin/all")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all bookings (Admin)" })
  async findAll() {
    return this.bookingsService.findAll();
  }

  @Get("admin/pending")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get pending bookings (Admin)" })
  async findPending() {
    return this.bookingsService.findPendingBookings();
  }

  @Patch("admin/:id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update booking status (Admin)" })
  async updateStatus(
    @Param("id") id: string,
    @Body() body: { status: string; comment?: string },
  ) {
    return this.bookingsService.updateStatus(id, body.status, body.comment);
  }

  @Patch(":id/approve")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Approve booking (Admin)" })
  async approve(@Param("id") id: string) {
    return this.bookingsService.approve(id);
  }

  @Patch(":id/reject")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Reject booking (Admin)" })
  async reject(@Param("id") id: string) {
    return this.bookingsService.reject(id);
  }

  // Extension Request endpoints
  @Post(":bookingId/extension-request")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create extension request for checkout date" })
  async createExtensionRequest(
    @Request() req: any,
    @Param("bookingId") bookingId: string,
    @Body() body: { requestedCheckoutDate?: string; newMoveOutDate?: string },
  ) {
    const requestedDate = body.newMoveOutDate || body.requestedCheckoutDate;
    if (!requestedDate) {
      throw new BadRequestException("newMoveOutDate is required");
    }
    return this.bookingsService.createExtensionRequest(
      req.user.userId,
      bookingId,
      requestedDate,
    );
  }

  @Get(":bookingId/extension-requests")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get extension requests for a booking" })
  async getExtensionRequests(@Param("bookingId") bookingId: string) {
    return this.bookingsService.getExtensionRequests(bookingId);
  }

  @Get("admin/extension-requests/pending")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get pending extension requests (Admin)" })
  async getPendingExtensionRequests() {
    return this.bookingsService.getPendingExtensionRequests();
  }

  @Patch("admin/extension-requests/:id/approve")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Approve extension request (Admin)" })
  async approveExtensionRequest(@Param("id") id: string) {
    return this.bookingsService.approveExtensionRequest(id);
  }

  @Patch("admin/extension-requests/:id/reject")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Reject extension request (Admin)" })
  async rejectExtensionRequest(
    @Param("id") id: string,
    @Body() body: { reason?: string },
  ) {
    return this.bookingsService.rejectExtensionRequest(id, body.reason);
  }

  @Post("admin/check-expired-checkouts")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Check and expire checkout dates (Admin)" })
  async checkExpiredCheckouts() {
    return this.bookingsService.checkExpiredCheckouts();
  }
}
