import { BadRequestException, Controller, Get, Param, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import type { Request, Response } from 'express';
import { AuthGuard, AdminGuard } from '../db/auth.guard.js';
import { bindControllerMethods } from '../common/bind-controller-methods.js';

const IMAGE_UPLOAD_TYPES = ['product'] as const;
const ALLOWED_MIME_TYPES = ['image/webp', 'image/jpeg', 'image/png'];
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

interface UploadedImageFile {
  buffer?: Buffer;
  mimetype?: string;
  size: number;
}

function uploadRoot() {
  return path.resolve(process.env.UPLOAD_DIR || 'uploads');
}

function apiPrefix() {
  return process.env.API_PREFIX || 'api';
}

function requestOrigin(request: Request) {
  const forwardedProto = request.headers['x-forwarded-proto'];
  const protocol = typeof forwardedProto === 'string' ? forwardedProto.split(',')[0].trim() : request.protocol;
  return `${protocol}://${request.get('host')}`;
}

function validateUploadType(value: string) {
  if (!IMAGE_UPLOAD_TYPES.includes(value as typeof IMAGE_UPLOAD_TYPES[number])) {
    throw new BadRequestException('Invalid upload type');
  }
  return value;
}

function safeFilename(value: string) {
  const filename = path.basename(value);
  if (!/^[a-z0-9-]+\.(webp|jpg|jpeg|png)$/i.test(filename)) {
    throw new BadRequestException('Invalid image filename');
  }
  return filename;
}

@Controller('uploads')
export class UploadsController {
  constructor() {
    bindControllerMethods(this, ['uploadImage', 'getImage']);
  }

  @Post('images/:type')
  @UseGuards(AuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('type') type: string,
    @UploadedFile() file: UploadedImageFile | undefined,
    @Req() request: Request,
  ) {
    const uploadType = validateUploadType(type);
    if (!file?.buffer || !file.mimetype) {
      throw new BadRequestException('Image file is required');
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Only WebP, JPEG, and PNG images are supported');
    }
    if (file.size > MAX_IMAGE_SIZE) {
      throw new BadRequestException('Image must be 8MB or smaller');
    }

    const extension = file.mimetype === 'image/png'
      ? 'png'
      : file.mimetype === 'image/jpeg'
        ? 'jpg'
        : 'webp';
    const now = new Date();
    const datePrefix = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const hash = crypto.createHash('sha256').update(file.buffer).update(String(Date.now())).digest('hex').slice(0, 16);
    const filename = `${datePrefix}-${hash}.${extension}`;
    const directory = path.join(uploadRoot(), 'images', uploadType);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, filename), file.buffer);

    const pathUrl = `/${apiPrefix()}/uploads/images/${uploadType}/${filename}`;
    return {
      data: {
        url: `${requestOrigin(request)}${pathUrl}`,
        path: pathUrl,
        filename,
        mime: file.mimetype,
        size: file.size,
      },
    };
  }

  @Get('images/:type/:filename')
  async getImage(@Param('type') type: string, @Param('filename') filename: string, @Res() response: Response) {
    const uploadType = validateUploadType(type);
    const safeName = safeFilename(filename);
    const filePath = path.join(uploadRoot(), 'images', uploadType, safeName);
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return response.sendFile(filePath);
  }
}
