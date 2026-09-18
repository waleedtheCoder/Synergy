import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AdPlacement } from '../../../../generated/prisma';

export class ServeAdQueryDto {
  @ApiProperty({ enum: AdPlacement })
  @IsEnum(AdPlacement)
  placement: AdPlacement;
}
