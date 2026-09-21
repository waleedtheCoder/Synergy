import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
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
  create(
    @Body() dto: CreateSkillDto,
    @CurrentUser('id') adminId: string,
    @Req() req: Request,
  ) {
    return this.adminSkillsService.create(dto, adminId, req.ip);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a skill' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Req() req: Request,
  ) {
    await this.adminSkillsService.remove(id, adminId, req.ip);
    return null;
  }
}
