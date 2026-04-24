import { IsNumber, IsString, IsOptional, Min } from "class-validator";

export class CreatePaymentDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  bookingId?: string;

  @IsOptional()
  @IsString()
  rentCycleId?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
