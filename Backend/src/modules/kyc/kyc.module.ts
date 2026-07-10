import { Module } from '@nestjs/common';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { KycAdminController } from './kyc-admin.controller';
import { CloudinaryModule } from '../../infrastructure/cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [KycController, KycAdminController],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}
