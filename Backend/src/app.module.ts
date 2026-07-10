import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { CloudinaryModule } from './infrastructure/cloudinary/cloudinary.module';
import { SupabaseModule } from './shared/supabase/supabase.module';
import { UploadModule } from './modules/upload/upload.module';
import { AuthModule } from './modules/auth/auth.module';
import { LogementsModule } from './modules/logements/logements.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { ReservationJobsModule } from './infrastructure/queue/reservation-jobs.module';
import { AdminModule } from './modules/admin/admin.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { KycModule } from './modules/kyc/kyc.module';
import { UsersModule } from './modules/users/users.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { CalendrierModule } from './modules/calendrier/calendrier.module';
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';
import { RolesGuard } from './shared/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 secondes
        limit: 100, // 100 requêtes par minute par défaut
      },
    ]),
    PrismaModule,
    RedisModule,
    QueueModule,
    ReservationJobsModule,
    CloudinaryModule,
    SupabaseModule,
    UploadModule,
    AuthModule,
    LogementsModule,
    ReservationsModule,
    AdminModule,
    WalletModule,
    DashboardModule,
    KycModule,
    UsersModule,
    ReviewsModule,
    DisputesModule,
    CalendrierModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
