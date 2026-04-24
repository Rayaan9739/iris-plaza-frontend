import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { RoomsService } from "./rooms.service";
import { CreateRoomDto, UpdateRoomDto } from "./dto/room.dto";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";

@ApiTags("Rooms")
@Controller("rooms")
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  @ApiOperation({ summary: "Get all rooms" })
  async findAll() {
    return this.roomsService.findAll();
  }

  @Get("available")
  @ApiOperation({ summary: "Get available rooms" })
  async getAvailableRooms(@Query("month") month?: string) {
    return this.roomsService.getAvailableRooms(month);
  }

  @Get("occupied")
  @ApiOperation({ summary: "Get occupied rooms" })
  async findOccupiedRooms() {
    return this.roomsService.findOccupiedRooms();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get room by ID" })
  async findOne(@Param("id") id: string) {
    return this.roomsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new room (Admin only)" })
  async create(@Body() body: any) {
    // coerce numbers
    body.floor = Number(body.floor);
    body.area = Number(body.area);
    body.rent = Number(body.rent);
    body.deposit = Number(body.deposit);

    // Helper to parse JSON string fields safely
    const parseJsonField = (field: any, defaultValue: any = null): any => {
      if (field === undefined || field === null || field === "") {
        return defaultValue;
      }
      if (typeof field === "object") {
        return field;
      }
      try {
        return JSON.parse(field);
      } catch {
        return defaultValue;
      }
    };

    // normalize arrays keys if necessary
    if (body["amenities[]"]) {
      body.amenities = Array.isArray(body["amenities[]"])
        ? body["amenities[]"]
        : [body["amenities[]"]];
    }
    if (body["rules[]"]) {
      body.rules = Array.isArray(body["rules[]"])
        ? body["rules[]"]
        : [body["rules[]"]];
    }

    // Handle JSON string amenities and rules
    if (body.amenities && typeof body.amenities === "string") {
      const parsed = parseJsonField(body.amenities, []);
      if (Array.isArray(parsed)) {
        body.amenities = parsed;
        console.log("[CREATE ROOM] Parsed amenities:", body.amenities);
      }
    }
    if (body.rules && typeof body.rules === "string") {
      const parsed = parseJsonField(body.rules, []);
      if (Array.isArray(parsed)) {
        body.rules = parsed;
        console.log("[CREATE ROOM] Parsed rules:", body.rules);
      }
    }

    return this.roomsService.create(body as CreateRoomDto);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a room (Admin only)" })
  async update(@Param("id") id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomsService.update(id, updateRoomDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a room (Admin only)" })
  async remove(@Param("id") id: string) {
    return this.roomsService.remove(id);
  }
}
