import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { UploadsService } from './uploads.service';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

@ApiTags('uploads')
@UseInterceptors(TransformInterceptor)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an image or PDF, get back its URL' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        // Declared-type check happens here for a fast client-facing error
        // message; the service re-derives the real type from file content
        // and is the actual source of truth, since this declared MIME type
        // is fully attacker-controlled.
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          callback(
            new BadRequestException(
              'Only JPEG, PNG, WEBP, GIF, or PDF files are allowed',
            ),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const url = await this.uploadsService.upload(randomUUID(), file.buffer);
    return { url };
  }
}
