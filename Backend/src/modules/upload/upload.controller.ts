import {
  Controller,
  Post,
  Get,
  Query,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';

const multerMemory = { storage: memoryStorage() };

const fileValidators = [
  new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
  new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png|webp)$/ }),
];

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('listing-photo')
  @ApiOperation({ summary: 'Upload photo annonce logement (webp 1200×800)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', multerMemory))
  async uploadListingPhoto(
    @UploadedFile(new ParseFilePipe({ validators: fileValidators })) file: Express.Multer.File,
  ) {
    return this.uploadService.uploadListingPhoto(file);
  }

  @Post('kyc-document')
  @ApiOperation({ summary: 'Upload document KYC CNI (dossier privé Cloudinary)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', multerMemory))
  async uploadKycDocument(
    @UploadedFile(new ParseFilePipe({ validators: fileValidators })) file: Express.Multer.File,
  ) {
    return this.uploadService.uploadKycDocument(file);
  }

  @Post('checkin-photo')
  @ApiOperation({ summary: 'Upload photo état des lieux (tagué par reservationId)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        reservationId: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', multerMemory))
  async uploadCheckinPhoto(
    @UploadedFile(new ParseFilePipe({ validators: fileValidators })) file: Express.Multer.File,
    @Body('reservationId') reservationId: string,
  ) {
    return this.uploadService.uploadCheckinPhoto(file, reservationId);
  }

  @Get('kyc-signed-url')
  @ApiOperation({ summary: 'URL signée expirante pour un document KYC (admin)' })
  getKycSignedUrl(@Query('publicId') publicId: string) {
    return this.uploadService.getKycSignedUrl(publicId);
  }
}
