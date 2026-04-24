import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
  Min,
  IsIn,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { RoomType } from "../enums/room-type.enum";

const LEGACY_ROOM_TYPE_MAP: Record<string, RoomType> = {
  STUDIO: RoomType.ONE_BHK,
  SINGLE: RoomType.ONE_BHK,
  DOUBLE: RoomType.ONE_BHK,
  THREE_BHK: RoomType.TWO_BHK,
  SUITE: RoomType.PENTHOUSE,
  PENT_HOUSE: RoomType.PENTHOUSE,
};

function normalizeRoomTypeValue(value: unknown) {
  if (!value) return value;
  const normalized = String(value).trim().replace(/\s+/g, "_").toUpperCase();
  return LEGACY_ROOM_TYPE_MAP[normalized] ?? normalized;
}

export class RoomImageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class RoomMediaDto {
  @ApiProperty({ enum: ["image", "video", "unknown"] })
  @IsString()
  @IsNotEmpty()
  @IsIn(["image", "video", "unknown"])
  type: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  url: string;
}

export class CreateRoomDto {
  @ApiProperty({ example: "Room 101" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    enum: RoomType,
  })
  @Transform(({ value }) => normalizeRoomTypeValue(value))
  @IsEnum(RoomType, {
    message: "Room type must be ONE_BHK, TWO_BHK, or PENTHOUSE",
  })
  type: RoomType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({
    description: "Array of media items (image or video) with URLs",
    type: [Object],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomMediaDto)
  media?: RoomMediaDto[];

  @ApiPropertyOptional({ example: ["No smoking", "No pets"] })
  @Transform(({ value }) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rules?: string[];

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  floor: number;

  @ApiProperty({ example: 250 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  area: number;

  @ApiProperty({ example: 850 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  rent: number;

  @ApiProperty({ example: 1700 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deposit: number;

  @ApiPropertyOptional({ example: ["WiFi", "AC"] })
  @Transform(({ value }) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({
    enum: ["AVAILABLE", "RESERVED", "OCCUPIED", "MAINTENANCE"],
  })
  @IsOptional()
  @IsIn(["AVAILABLE", "RESERVED", "OCCUPIED", "MAINTENANCE"])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomImageDto)
  images?: RoomImageDto[];
}

export class UpdateRoomDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  occupiedUntil?: string;

  // Tenant info for Mark Occupied flow
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tenantName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tenantPhone?: string;

  @ApiPropertyOptional({ enum: RoomType })
  @IsOptional()
  @Transform(({ value }) => normalizeRoomTypeValue(value))
  @IsEnum(RoomType, {
    message: "Room type must be ONE_BHK, TWO_BHK, or PENTHOUSE",
  })
  type?: RoomType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({
    description: "Array of media items (image or video) with URLs",
    type: [Object],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomMediaDto)
  media?: RoomMediaDto[];

  @ApiPropertyOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rules?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  floor?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  area?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  rent?: number;

  @ApiPropertyOptional({ enum: ["WALK_IN", "BROKER"] })
  @IsOptional()
  @IsString()
  bookingSource?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brokerName?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deposit?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({
    enum: ["AVAILABLE", "RESERVED", "OCCUPIED", "MAINTENANCE"],
  })
  @IsOptional()
  @IsIn(["AVAILABLE", "RESERVED", "OCCUPIED", "MAINTENANCE"])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomImageDto)
  images?: RoomImageDto[];
}

