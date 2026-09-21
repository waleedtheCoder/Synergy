import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { StripHtml } from '../../../common/decorators/strip-html.decorator';

export class CreateCommentDto {
  @ApiProperty({ minLength: 1, maxLength: 1000 })
  @StripHtml()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content: string;
}
