import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginEmailDto } from './dto/login.dto';
import { PhoneSendOtpDto, PhoneVerifyOtpDto } from './dto/login-phone.dto';
import { RefreshDto } from './dto/refresh.dto';
import { SwitchRoleDto } from './dto/switch-role.dto';
import { CompleteGoogleProfileDto } from './dto/complete-google-profile.dto';
import { BecomeHostDto } from './dto/become-host.dto';
import { VerifyCurrentPhoneConfirmDto, VerifyCurrentPhoneSendDto } from './dto/verify-current-phone.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { Public } from '@shared/decorators/public.decorator';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { AuthUser } from '@shared/types/jwt-payload.type';

@ApiTags('Auth')
@UseGuards(JwtAuthGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── Inscription ────────────────────────────────────────────────────────────

  @Post('register')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 3 } }) // 3 inscriptions par minute par IP
  @ApiOperation({ summary: 'Inscription email+password (envoie OTP email)' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ── Connexion email+password ───────────────────────────────────────────────

  @Post('login/email')
  @Public()
  @Throttle({ default: { ttl: 900000, limit: 5 } }) // 5 tentatives de login par 15 minutes par IP
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion par email + mot de passe' })
  loginEmail(@Body() dto: LoginEmailDto) {
    return this.authService.loginEmail(dto);
  }

  // ── Connexion téléphone — envoi OTP ───────────────────────────────────────

  @Post('login/phone/send')
  @Public()
  @Throttle({ default: { ttl: 3600000, limit: 3 } }) // 3 OTP par heure par IP
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Envoi OTP SMS (vérifie existence du numéro)' })
  sendPhoneOtp(@Body() dto: PhoneSendOtpDto) {
    return this.authService.sendPhoneOtp(dto);
  }

  // ── Connexion téléphone — vérification OTP ────────────────────────────────

  @Post('login/phone/verify')
  @Public()
  @Throttle({ default: { ttl: 3600000, limit: 20 } }) // 20 vérifications OTP par heure par IP
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vérification OTP SMS → retourne session' })
  verifyPhoneOtp(@Body() dto: PhoneVerifyOtpDto) {
    return this.authService.verifyPhoneOtp(dto);
  }

  @Post('onboarding/complete')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Finaliser l’onboarding Supabase et créer le compte applicatif' })
  completeOnboarding(
    @Headers('authorization') authHeader: string,
    @Body() dto: CompleteOnboardingDto,
  ) {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token Supabase manquant');
    }

    return this.authService.completeOnboarding(authHeader.substring(7), dto);
  }

  @Post('verify-phone/send')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Envoyer un code OTP pour vérifier le téléphone du compte courant' })
  sendCurrentPhoneOtp(@CurrentUser() user: AuthUser, @Body() dto: VerifyCurrentPhoneSendDto) {
    return this.authService.sendCurrentPhoneOtp(user.id, user.userId, dto);
  }

  @Post('verify-phone/confirm')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmer le téléphone du compte courant' })
  verifyCurrentPhoneOtp(@CurrentUser() user: AuthUser, @Body() dto: VerifyCurrentPhoneConfirmDto) {
    return this.authService.verifyCurrentPhoneOtp(user.id, user.userId, dto);
  }

  // ── Google — complétion profil premier accès ──────────────────────────────

  @Post('google/complete-profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Compléter le profil après connexion Google (1ère fois)' })
  completeGoogleProfile(@CurrentUser() user: AuthUser, @Body() dto: CompleteGoogleProfileDto) {
    return this.authService.completeGoogleProfile(user.userId, dto);
  }

  // ── Rafraîchissement token ─────────────────────────────────────────────────

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rafraîchir les tokens de session' })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }

  // ── Déconnexion ───────────────────────────────────────────────────────────

  @Post('logout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Déconnexion (invalide la session Supabase)' })
  logout(@Req() req: Request) {
    const token = (req.headers.authorization ?? '').replace('Bearer ', '');
    return this.authService.logout(token);
  }

  // ── Activation mode Hôte ─────────────────────────────────────────────────

  @Post('become-host')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activer le mode hôte (PARTICULIER ou AGENCE)' })
  becomeHost(@CurrentUser() user: AuthUser, @Body() dto: BecomeHostDto) {
    return this.authService.becomeHost(user.id, dto);
  }

  // ── Changement de rôle actif ─────────────────────────────────────────────

  @Post('switch-role')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Basculer entre rôle LOCATAIRE et PROPRIÉTAIRE' })
  switchRole(@CurrentUser() user: AuthUser, @Body() dto: SwitchRoleDto) {
    return this.authService.switchRole(user.id, user.userId, dto);
  }

  // ── Profil courant ────────────────────────────────────────────────────────

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Profil de l'utilisateur connecté" })
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  // ── Validation token Supabase ───────────────────────────────────────────────────

  @Get('me/supabase')
  @Public()
  @ApiOperation({ summary: 'Validation du token Supabase et génération tokens NestJS' })
  async meWithSupabase(@Headers('authorization') authHeader: string) {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token Supabase manquant');
    }

    const supabaseToken = authHeader.substring(7);
    return this.authService.validateSupabaseTokenAndGenerateTokens(supabaseToken);
  }
}
