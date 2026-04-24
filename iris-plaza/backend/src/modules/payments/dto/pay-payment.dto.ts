import {
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
  IsUrl,
  Min,
} from "class-validator";

export enum PaymentMethodType {
  ONLINE = "ONLINE",
  CASH = "CASH",
  UPI = "UPI",
  BANK_TRANSFER = "BANK_TRANSFER",
}

export class PayPaymentDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(PaymentMethodType)
  paymentMethod: PaymentMethodType;
}

export class OnlinePaymentDto extends PayPaymentDto {
  @IsString()
  transactionId: string;

  @IsString()
  @IsUrl()
  screenshotUrl: string;

  @IsOptional()
  @IsString()
  transactionDate?: string;
}

export class CashPaymentDto extends PayPaymentDto {
  @IsOptional()
  @IsString()
  description?: string;
}
