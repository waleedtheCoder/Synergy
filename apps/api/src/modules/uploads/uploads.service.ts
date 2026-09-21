import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { detectFileType } from '../../common/utils/file-signature.util';

const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
};

@Injectable()
export class UploadsService {
  private readonly client: ReturnType<typeof createClient>;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.client = createClient(
      this.configService.getOrThrow<string>('SUPABASE_URL'),
      this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
    this.bucket = this.configService.get<string>(
      'SUPABASE_STORAGE_BUCKET',
      'uploads',
    );
  }

  async upload(fileId: string, buffer: Buffer): Promise<string> {
    // The client-declared MIME type/extension is never trusted on its own —
    // a file renamed to look like an allowed type would otherwise sail
    // through. The actual bytes have to match a real signature for one of
    // the types this endpoint allows, and the extension we store it under
    // is derived from that real type, not whatever the client claimed.
    const realType = detectFileType(buffer);
    if (!realType) {
      throw new BadRequestException(
        "This file's content doesn't match a supported file type",
      );
    }

    const processedBuffer = realType.startsWith('image/')
      ? await this.stripImageMetadata(buffer, realType)
      : buffer;

    const filename = `${fileId}${EXTENSION_BY_TYPE[realType]}`;
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(filename, processedBuffer, { contentType: realType });

    if (error) {
      throw error;
    }

    return this.client.storage.from(this.bucket).getPublicUrl(filename).data
      .publicUrl;
  }

  /**
   * Re-encodes the image through sharp, which drops EXIF/IPTC/XMP metadata
   * (including GPS location) by default unless `.withMetadata()` is called —
   * so simply piping the image through is enough to strip it.
   */
  private async stripImageMetadata(
    buffer: Buffer,
    type: string,
  ): Promise<Buffer> {
    const image = sharp(buffer).rotate(); // auto-orient before dropping EXIF
    switch (type) {
      case 'image/jpeg':
        return image.jpeg().toBuffer();
      case 'image/png':
        return image.png().toBuffer();
      case 'image/webp':
        return image.webp().toBuffer();
      case 'image/gif':
        // sharp only outputs the first frame for animated GIFs — re-encoding
        // would break multi-frame uploads, so GIFs are passed through as-is.
        return buffer;
      default:
        return buffer;
    }
  }
}
