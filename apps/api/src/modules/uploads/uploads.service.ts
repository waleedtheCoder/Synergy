import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

@Injectable()
export class UploadsService {
  static readonly UPLOAD_DIR = join(process.cwd(), 'uploads');

  constructor(private readonly configService: ConfigService) {}

  buildUrl(filename: string): string {
    const appUrl = this.configService.getOrThrow<string>('APP_URL');
    return `${appUrl}/uploads/${filename}`;
  }
}
