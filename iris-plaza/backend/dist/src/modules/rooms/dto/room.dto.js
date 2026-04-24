"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateRoomDto = exports.CreateRoomDto = exports.RoomMediaDto = exports.RoomImageDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const room_type_enum_1 = require("../enums/room-type.enum");
const LEGACY_ROOM_TYPE_MAP = {
    STUDIO: room_type_enum_1.RoomType.ONE_BHK,
    SINGLE: room_type_enum_1.RoomType.ONE_BHK,
    DOUBLE: room_type_enum_1.RoomType.ONE_BHK,
    THREE_BHK: room_type_enum_1.RoomType.TWO_BHK,
    SUITE: room_type_enum_1.RoomType.PENTHOUSE,
    PENT_HOUSE: room_type_enum_1.RoomType.PENTHOUSE,
};
function normalizeRoomTypeValue(value) {
    if (!value)
        return value;
    const normalized = String(value).trim().replace(/\s+/g, "_").toUpperCase();
    return LEGACY_ROOM_TYPE_MAP[normalized] ?? normalized;
}
class RoomImageDto {
}
exports.RoomImageDto = RoomImageDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RoomImageDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RoomImageDto.prototype, "caption", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], RoomImageDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], RoomImageDto.prototype, "isPrimary", void 0);
class RoomMediaDto {
}
exports.RoomMediaDto = RoomMediaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ["image", "video", "unknown"] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsIn)(["image", "video", "unknown"]),
    __metadata("design:type", String)
], RoomMediaDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RoomMediaDto.prototype, "url", void 0);
class CreateRoomDto {
}
exports.CreateRoomDto = CreateRoomDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Room 101" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRoomDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: room_type_enum_1.RoomType,
    }),
    (0, class_transformer_1.Transform)(({ value }) => normalizeRoomTypeValue(value)),
    (0, class_validator_1.IsEnum)(room_type_enum_1.RoomType, {
        message: "Room type must be ONE_BHK, TWO_BHK, or PENTHOUSE",
    }),
    __metadata("design:type", String)
], CreateRoomDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoomDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoomDto.prototype, "videoUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Array of media items (image or video) with URLs",
        type: [Object],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RoomMediaDto),
    __metadata("design:type", Array)
], CreateRoomDto.prototype, "media", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ["No smoking", "No pets"] }),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (!value)
            return [];
        if (Array.isArray(value))
            return value;
        if (typeof value === "string") {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
            }
            catch {
                return [];
            }
        }
        return [];
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateRoomDto.prototype, "rules", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateRoomDto.prototype, "floor", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 250 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateRoomDto.prototype, "area", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 850 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateRoomDto.prototype, "rent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1700 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateRoomDto.prototype, "deposit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ["WiFi", "AC"] }),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (!value)
            return [];
        if (Array.isArray(value))
            return value;
        if (typeof value === "string") {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
            }
            catch {
                return [];
            }
        }
        return [];
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateRoomDto.prototype, "amenities", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ["AVAILABLE", "RESERVED", "OCCUPIED", "MAINTENANCE"],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["AVAILABLE", "RESERVED", "OCCUPIED", "MAINTENANCE"]),
    __metadata("design:type", String)
], CreateRoomDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RoomImageDto),
    __metadata("design:type", Array)
], CreateRoomDto.prototype, "images", void 0);
class UpdateRoomDto {
}
exports.UpdateRoomDto = UpdateRoomDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRoomDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateRoomDto.prototype, "isAvailable", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRoomDto.prototype, "occupiedUntil", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRoomDto.prototype, "tenantName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRoomDto.prototype, "tenantPhone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: room_type_enum_1.RoomType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => normalizeRoomTypeValue(value)),
    (0, class_validator_1.IsEnum)(room_type_enum_1.RoomType, {
        message: "Room type must be ONE_BHK, TWO_BHK, or PENTHOUSE",
    }),
    __metadata("design:type", String)
], UpdateRoomDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRoomDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRoomDto.prototype, "videoUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Array of media items (image or video) with URLs",
        type: [Object],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RoomMediaDto),
    __metadata("design:type", Array)
], UpdateRoomDto.prototype, "media", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (!value)
            return [];
        if (Array.isArray(value))
            return value;
        if (typeof value === "string") {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
            }
            catch {
                return [];
            }
        }
        return [];
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateRoomDto.prototype, "rules", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateRoomDto.prototype, "floor", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateRoomDto.prototype, "area", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateRoomDto.prototype, "rent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["WALK_IN", "BROKER"] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRoomDto.prototype, "bookingSource", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], UpdateRoomDto.prototype, "brokerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateRoomDto.prototype, "deposit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (!value)
            return [];
        if (Array.isArray(value))
            return value;
        if (typeof value === "string") {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
            }
            catch {
                return [];
            }
        }
        return [];
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateRoomDto.prototype, "amenities", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ["AVAILABLE", "RESERVED", "OCCUPIED", "MAINTENANCE"],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["AVAILABLE", "RESERVED", "OCCUPIED", "MAINTENANCE"]),
    __metadata("design:type", String)
], UpdateRoomDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RoomImageDto),
    __metadata("design:type", Array)
], UpdateRoomDto.prototype, "images", void 0);
//# sourceMappingURL=room.dto.js.map