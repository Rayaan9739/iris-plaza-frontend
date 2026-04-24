import {
  Controller,
  Get,
  Put,
  Patch,
  Body,
  UseGuards,
  Request,
  Param,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { UpdateProfileDto } from "./dto/user.dto";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";

@ApiTags("Users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get("me")
  @ApiOperation({ summary: "Get current user profile" })
  async getProfile(@Request() req: any) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Put("me")
  @ApiOperation({ summary: "Update current user profile" })
  async updateProfile(
    @Request() req: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.userId, updateProfileDto);
  }

  @Patch("me")
  @ApiOperation({ summary: "Update current user profile (partial)" })
  async patchProfile(
    @Request() req: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.userId, updateProfileDto);
  }

  @Get("tenants/:id")
  @ApiOperation({ summary: "Get tenant by ID (Admin)" })
  async getTenant(@Param("id") id: string) {
    return this.usersService.getTenantById(id);
  }
}
