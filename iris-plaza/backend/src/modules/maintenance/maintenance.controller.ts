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
import { MaintenanceService } from "./maintenance.service";
import { CreateMaintenanceDto } from "./dto/create-maintenance.dto";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";

@ApiTags("Maintenance")
@Controller(["tickets", "maintenance"])
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MaintenanceController {
  constructor(private maintenanceService: MaintenanceService) {}

  @Get("me")
  @ApiOperation({ summary: "Get my maintenance tickets" })
  async getMyTickets(@Request() req: any) {
    return this.maintenanceService.findMyTickets(req.user.userId);
  }

  @Get("my")
  @ApiOperation({ summary: "Get my maintenance tickets (alias)" })
  async getMyTicketsAlias(@Request() req: any) {
    return this.maintenanceService.findMyTickets(req.user.userId);
  }

  @Post()
  @ApiOperation({ summary: "Create a maintenance ticket" })
  async create(@Request() req: any, @Body() dto: CreateMaintenanceDto) {
    if (!dto || !dto.category) {
      throw new BadRequestException(
        "Invalid maintenance request data: category is required",
      );
    }
    return this.maintenanceService.create(req.user.userId, dto);
  }

  @Post("request")
  @ApiOperation({ summary: "Create a maintenance request (alias)" })
  async createRequestAlias(
    @Request() req: any,
    @Body() dto: CreateMaintenanceDto,
  ) {
    if (!dto || !dto.category) {
      throw new BadRequestException(
        "Invalid maintenance request data: category is required",
      );
    }
    return this.maintenanceService.create(req.user.userId, dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get ticket by ID" })
  async findOne(@Param("id") id: string) {
    return this.maintenanceService.findOne(id);
  }

  @Get("admin/all")
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @ApiOperation({ summary: "Get all tickets (Admin)" })
  async findAll() {
    return this.maintenanceService.findAll();
  }

  @Patch("admin/:id/status")
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @ApiOperation({ summary: "Update ticket status (Admin)" })
  async updateStatus(
    @Param("id") id: string,
    @Body() body: { status: string; resolution?: string },
  ) {
    return this.maintenanceService.updateStatus(
      id,
      body.status,
      body.resolution,
    );
  }
}
