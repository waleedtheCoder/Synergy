import { Body, Controller, Get, Patch, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../../generated/prisma';
import { ProfessionalProfileService } from './professional-profile.service';
import { UpdateProfessionalProfileDto } from './dto/update-professional-profile.dto';

@ApiTags('professional-profile')
@UseInterceptors(TransformInterceptor)
@Roles(Role.PROFESSIONAL)
@Controller('professional-profile')
export class ProfessionalProfileController {
  constructor(
    private readonly professionalProfileService: ProfessionalProfileService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my professional profile' })
  findMe(@CurrentUser('id') userId: string) {
    return this.professionalProfileService.findMe(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update my professional profile' })
  updateMe(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfessionalProfileDto,
  ) {
    return this.professionalProfileService.updateMe(userId, dto);
  }
}
