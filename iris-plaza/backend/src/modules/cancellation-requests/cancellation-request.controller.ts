import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  Param,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CancellationRequestService } from "./cancellation-request.service";
import { CancellationRequestDto } from "./dto/create-cancellation-request.dto";

@Controller("cancellation-request")
@UseGuards(JwtAuthGuard)
export class CancellationRequestController {
  constructor(private cancellationRequestService: CancellationRequestService) {}

  @Post()
  async createCancellationRequest(
    @Body() dto: CancellationRequestDto,
    @Request() req: any,
  ) {
    return this.cancellationRequestService.create(dto, req.user.userId);
  }

  @Get("my-request")
  async getMyRequest(@Request() req: any) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException("User not found in request");
    }

    const request = await this.cancellationRequestService.getMyRequest(userId);

    return {
      success: true,
      data: request,
    };
  }

  @Get("pending")
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  async getPendingRequests() {
    const requests = await this.cancellationRequestService.getPendingRequests();

    return {
      success: true,
      data: requests,
    };
  }

  @Patch(":id/approve")
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  async approveRequest(@Request() req: any, @Param("id") requestId: string) {
    const adminId = req.user?.userId;
    if (!adminId) {
      throw new BadRequestException("Admin user not found in request");
    }

    const updatedRequest = await this.cancellationRequestService.approveRequest(
      requestId,
      adminId,
    );

    return {
      success: true,
      message: "Cancellation request approved",
      data: updatedRequest,
    };
  }

  @Patch(":id/reject")
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  async rejectRequest(
    @Request() req: any,
    @Param("id") requestId: string,
    @Body() body: { rejectionReason?: string },
  ) {
    const adminId = req.user?.userId;
    if (!adminId) {
      throw new BadRequestException("Admin user not found in request");
    }

    const updatedRequest = await this.cancellationRequestService.rejectRequest(
      requestId,
      adminId,
      body.rejectionReason || "",
    );

    return {
      success: true,
      message: "Cancellation request rejected",
      data: updatedRequest,
    };
  }
}
