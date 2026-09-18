import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../../generated/prisma';
import { AdminSkillsService } from './admin-skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';

@ApiTags('admin')
@UseInterceptors(TransformInterceptor)
@Roles(Role.ADMIN)
@Controller('admin/skills')
export class AdminSkillsController {
  constructor(private readonly adminSkillsService: AdminSkillsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a skill' })
  create(@Body() dto: CreateSkillDto) {
    return this.adminSkillsService.create(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a skill' })
  async remove(@Param('id') id: string) {
    await this.adminSkillsService.remove(id);
    return null;
  }
}
