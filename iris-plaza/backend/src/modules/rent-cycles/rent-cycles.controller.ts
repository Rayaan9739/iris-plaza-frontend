import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { RentCyclesService } from "./rent-cycles.service";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";

@ApiTags("Rent")
@Controller("rent")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RentCyclesController {
  constructor(private rentCyclesService: RentCyclesService) {}

  @Get("me")
  @ApiOperation({ summary: "Get my rent cycles" })
  async getMyRentCycles(@Request() req: any) {
    return this.rentCyclesService.findMyRentCycles(req.user.userId);
  }

  @Get("current")
  @ApiOperation({ summary: "Get current month rent" })
  async getCurrentCycle(@Request() req: any) {
    return this.rentCyclesService.getCurrentCycle(req.user.userId);
  }

  @Post(":id/pay")
  @ApiOperation({ summary: "Mark rent as paid" })
  async payRent(@Param("id") id: string) {
    return this.rentCyclesService.markAsPaid(id);
  }

  @Get("admin/all")
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @ApiOperation({ summary: "Get all rent cycles (Admin)" })
  async findAll() {
    return this.rentCyclesService.findAll();
  }

  @Post("admin/generate")
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @ApiOperation({ summary: "Generate monthly rent cycles (Admin)" })
  async generateMonthlyRent() {
    return this.rentCyclesService.generateMonthlyRent();
  }
}
