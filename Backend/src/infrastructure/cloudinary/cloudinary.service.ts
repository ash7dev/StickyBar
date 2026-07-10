import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export interface UploadResult {
  url: string;
  publicId: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly config: ConfigService) {
    cloudinary.config({
      cloud_name: config.getOrThrow('CLOUDINARY_CLOUD_NAME'),
      api_key: config.getOrThrow('CLOUDINARY_API_KEY'),
      api_secret: config.getOrThrow('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadListingPhoto(buffer: Buffer, originalName: string): Promise<UploadResult> {
    const result = await this.uploadStream(buffer, {
      folder: 'immoloc/listings',
      transformation: [{ width: 1200, height: 800, crop: 'fill', format: 'webp', quality: 'auto' }],
      resource_type: 'image',
    });
    this.logger.debug(`Listing photo uploadée → ${result.public_id}`);
    return { url: result.secure_url, publicId: result.public_id };
  }

  async uploadKycDocument(buffer: Buffer, originalName: string): Promise<UploadResult> {
    const result = await this.uploadStream(buffer, {
      folder: 'immoloc/kyc',
      access_mode: 'authenticated',
      resource_type: 'image',
      type: 'authenticated',
    });
    this.logger.debug(`KYC document uploadé → ${result.public_id}`);
    return { url: result.secure_url, publicId: result.public_id };
  }

  async uploadCheckinPhoto(buffer: Buffer, reservationId: string): Promise<UploadResult> {
    const result = await this.uploadStream(buffer, {
      folder: `immoloc/checkin/${reservationId}`,
      tags: [reservationId],
      resource_type: 'image',
    });
    this.logger.debug(`Checkin photo uploadée → ${result.public_id}`);
    return { url: result.secure_url, publicId: result.public_id };
  }

  // Génère une URL signée expirante pour un document KYC (admin uniquement)
  generateSignedUrl(publicId: string, expiresInSeconds = 3600): string {
    return cloudinary.url(publicId, {
      type: 'authenticated',
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
    });
  }

  generateUploadSignature(folder: string): {
    timestamp: number;
    signature: string;
    apiKey: string;
    cloudName: string;
    folder: string;
    uploadUrl: string;
  } {
    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      this.config.getOrThrow('CLOUDINARY_API_SECRET'),
    );
    return {
      timestamp,
      signature,
      apiKey: this.config.getOrThrow('CLOUDINARY_API_KEY'),
      cloudName: this.config.getOrThrow('CLOUDINARY_CLOUD_NAME'),
      folder,
      uploadUrl: `https://api.cloudinary.com/v1_1/${this.config.getOrThrow('CLOUDINARY_CLOUD_NAME')}/image/upload`,
    };
  }

  async deleteFile(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { type: 'authenticated' });
  }

  private uploadStream(buffer: Buffer, options: Record<string, unknown>): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error || !result) return reject(error ?? new Error('Upload échoué'));
        resolve(result);
      });
      stream.end(buffer);
    });
  }
}
