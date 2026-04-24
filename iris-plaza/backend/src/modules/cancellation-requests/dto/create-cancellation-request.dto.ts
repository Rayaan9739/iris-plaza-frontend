import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CancellationRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  bookingId: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  reason?: string;
}
