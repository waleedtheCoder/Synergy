import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaymentMethod, SubscriptionPlan } from '../../../../generated/prisma';

export class CreateSubscriptionPaymentDto {
  @ApiProperty({
    enum: [
      SubscriptionPlan.PROFESSIONAL,
      SubscriptionPlan.BUSINESS,
      SubscriptionPlan.ENTERPRISE,
    ],
  })
  @IsEnum([
    SubscriptionPlan.PROFESSIONAL,
    SubscriptionPlan.BUSINESS,
    SubscriptionPlan.ENTERPRISE,
  ])
  plan: SubscriptionPlan;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reference?: string;
}
