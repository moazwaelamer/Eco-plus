import { Controller, Get, Header, Param, Post, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator.js';
import { UploadsService } from './uploads.service.js';

@ApiTags('uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Roles('citizen', 'business', 'admin', 'employee')
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Upload a bag photo (JPEG or PNG). Returns the URL to put in a scan.' })
  upload(@UploadedFile() file: { buffer: Buffer } | undefined) {
    return this.uploads.saveImage(file);
  }

  @Get(':name')
  @Header('Cache-Control', 'private, max-age=3600')
  @Header('X-Content-Type-Options', 'nosniff')
  @ApiOperation({ summary: 'Download a photo (logged-in users only; file names are unguessable)' })
  async download(@Param('name') name: string) {
    const { stream, contentType } = await this.uploads.open(name);
    return new StreamableFile(stream, { type: contentType });
  }
}
