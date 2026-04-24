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
exports.SetDobDto = exports.RefreshTokenDto = exports.SignInDto = exports.SignUpDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class SignUpDto {
}
exports.SignUpDto = SignUpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "+1234567890" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SignUpDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "user@example.com" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SignUpDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "John" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], SignUpDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Doe" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], SignUpDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: "2001-08-15",
        description: "Date of birth in ISO format (YYYY-MM-DD)",
    }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], SignUpDto.prototype, "dob", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "John Smith" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], SignUpDto.prototype, "fatherName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "S/O" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10),
    __metadata("design:type", String)
], SignUpDto.prototype, "relation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "1234 5678 9012" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], SignUpDto.prototype, "aadhaarNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "Male" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10),
    __metadata("design:type", String)
], SignUpDto.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "Bangalore" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], SignUpDto.prototype, "tenantAddress", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "Manipal University" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], SignUpDto.prototype, "collegeName", void 0);
class SignInDto {
}
exports.SignInDto = SignInDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "+1234567890" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SignInDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: "2001-08-15",
        description: "Date of birth in ISO format (YYYY-MM-DD)",
    }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], SignInDto.prototype, "dob", void 0);
class RefreshTokenDto {
}
exports.RefreshTokenDto = RefreshTokenDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RefreshTokenDto.prototype, "refreshToken", void 0);
class SetDobDto {
}
exports.SetDobDto = SetDobDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "+1234567890" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SetDobDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: "2001-08-15",
        description: "Date of birth in ISO format (YYYY-MM-DD)",
    }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], SetDobDto.prototype, "dob", void 0);
//# sourceMappingURL=auth.dto.js.map