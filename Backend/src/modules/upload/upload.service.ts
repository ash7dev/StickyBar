import { Injectable, BadRequestException } from '@nestjs/common';
import { CloudinaryService, UploadResult } from '@infrastructure/cloudinary/cloudinary.service';

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

@Injectable()
export class UploadService {
  constructor(private readonly cloudinary: CloudinaryService) {}

  async uploadListingPhoto(file: Express.Multer.File): Promise<UploadResult> {
    this.validateFile(file);
    return this.cloudinary.uploadListingPhoto(file.buffer, file.originalname);
  }

  async uploadKycDocument(file: Express.Multer.File): Promise<UploadResult> {
    this.validateFile(file);
    return this.cloudinary.uploadKycDocument(file.buffer, file.originalname);
  }

  async uploadKycSelfie(file: Express.Multer.File): Promise<UploadResult & { faceDetected: boolean }> {
    this.validateFile(file);
    return this.cloudinary.uploadKycSelfie(file.buffer, file.originalname);
  }

  async uploadCheckinPhoto(file: Express.Multer.File, reservationId: string): Promise<UploadResult> {
    this.validateFile(file);
    return this.cloudinary.uploadCheckinPhoto(file.buffer, reservationId);
  }

  getKycSignedUrl(publicId: string): { url: string } {
    return { url: this.cloudinary.generateSignedUrl(publicId) };
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) throw new BadRequestException('Fichier manquant');
    if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
      throw new BadRequestException('Format non autorisé. Formats acceptés : jpg, jpeg, png, webp');
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException('Fichier trop volumineux. Taille max : 5 MB');
    }
  }
}
