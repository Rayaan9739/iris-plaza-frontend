import { IsString, IsOptional, IsIn } from "class-validator";

export class CreateMaintenanceDto {
  @IsString()
  title: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(["LOW", "MEDIUM", "HIGH", "URGENT"])
  priority?: string;

  @IsOptional()
  @IsString()
  bookingId?: string;
}
