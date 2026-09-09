import { Controller, Get, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { SubscribePushDto } from './dto/subscribe-push.dto';
import { SubscribeExpoPushDto } from './dto/subscribe-expo-push.dto';
import { SendTestPushDto } from './dto/send-test-push.dto';
import { Public } from '@shared/decorators/public.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { AuthUser } from '@shared/types/jwt-payload.type';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';

@ApiTags('Notifications Push (Web & Mobile)')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('vapid-public-key')
  @Public()
  @ApiOperation({ summary: 'Obtenir la clé publique VAPID pour l\'inscription Push du navigateur' })
  getVapidPublicKey() {
    return this.notificationsService.getVapidPublicKey();
  }

  @Post('subscribe')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enregistrer un abonnement Web Push PWA pour cet appareil' })
  subscribe(@Body() dto: SubscribePushDto, @CurrentUser() user?: AuthUser) {
    return this.notificationsService.subscribe(dto, user?.id || user?.userId);
  }

  @Post('subscribe-expo')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enregistrer un abonnement Mobile Expo Push pour cette application nativité' })
  subscribeExpo(@Body() dto: SubscribeExpoPushDto, @CurrentUser() user?: AuthUser) {
    return this.notificationsService.subscribeExpo(dto, user?.id || user?.userId);
  }

  @Post('unsubscribe')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Désabonner cet appareil des notifications Push' })
  unsubscribe(@Body('endpoint') endpoint: string) {
    return this.notificationsService.unsubscribe(endpoint);
  }

  @Post('test')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Envoyer une notification Push de démonstration instantanée' })
  sendTest(@Body() dto: SendTestPushDto, @CurrentUser() user?: AuthUser) {
    return this.notificationsService.sendTestNotification(dto, user?.id || user?.userId);
  }
}
