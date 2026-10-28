import { randomBytes } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.js';

const NAME_PATTERN = /^[a-f0-9]{32}\.(jpg|png)$/;

/** The file type is decided by the first bytes of the file, never by its name or declared type. */
function detectType(buf: Buffer): 'jpg' | 'png' | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  return null;
}

@Injectable()
export class UploadsService {
  private readonly dir: string;

  constructor(config: ConfigService<Env, true>) {
    this.dir = resolve(config.get('UPLOAD_DIR', { infer: true }));
  }

  async saveImage(file: { buffer: Buffer } | undefined): Promise<{ url: string }> {
    if (!file) throw new UnprocessableEntityException({ code: 'file_required', message: 'Send the photo in a "file" field.' });
    const type = detectType(file.buffer);
    if (!type) {
      throw new UnprocessableEntityException({ code: 'unsupported_file', message: 'Only JPEG and PNG photos are accepted.' });
    }
    await mkdir(this.dir, { recursive: true });
    // Random name: the original file name is never used.
    const name = `${randomBytes(16).toString('hex')}.${type}`;
    await writeFile(join(this.dir, name), file.buffer, { flag: 'wx' });
    return { url: `/uploads/${name}` };
  }

  /** True when the value is a URL this service handed out (used to validate scan.imageUrl). */
  static isUploadUrl(url: string): boolean {
    return url.startsWith('/uploads/') && NAME_PATTERN.test(url.slice('/uploads/'.length));
  }

  async open(name: string) {
    if (!NAME_PATTERN.test(name)) throw new NotFoundException('Photo not found.');
    const path = join(this.dir, name);
    try {
      await stat(path);
    } catch {
      throw new NotFoundException('Photo not found.');
    }
    return { stream: createReadStream(path), contentType: name.endsWith('.png') ? 'image/png' : 'image/jpeg' };
  }
}
