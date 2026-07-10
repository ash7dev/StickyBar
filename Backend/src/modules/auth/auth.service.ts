/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { RedisService } from '@infrastructure/redis/redis.service';
import { SupabaseService } from '@shared/supabase/supabase.service';
import { Role } from '@shared/types/jwt-payload.type';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginEmailDto } from './dto/login.dto';
import { PhoneSendOtpDto, PhoneVerifyOtpDto } from './dto/login-phone.dto';
import { RefreshDto } from './dto/refresh.dto';
import { SwitchRoleDto } from './dto/switch-role.dto';
import { CompleteGoogleProfileDto } from './dto/complete-google-profile.dto';
import { BecomeHostDto } from './dto/become-host.dto';
import { VerifyCurrentPhoneConfirmDto, VerifyCurrentPhoneSendDto } from './dto/verify-current-phone.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
    private readonly redis: RedisService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private isFakeOtpEnabled() {
    return this.configService.get<string>('AUTH_FAKE_OTP_ENABLED', 'false') === 'true';
  }

  // ── Génération des tokens souverains ───────────────────────────────────────

  private async generateTokens(user: {
    id: string;
    userId: string;
    email: string;
    telephone: string;
    estProprietaire: boolean;
    activeRole?: Role;
  }) {
    const sessionId = randomUUID();
    const activeRole = user.activeRole ?? (user.estProprietaire ? Role.PROPRIETAIRE : Role.LOCATAIRE);
    const payload = {
      sub: user.id,
      supabaseUserId: user.userId,
      email: user.email,
      phone: user.telephone,
      session_id: sessionId,
      activeRole,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = randomUUID();
    
    // Stockage du refresh token dans Redis
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    // Convertir '7d' ou '15m' en secondes pour Redis (approximation simple)
    let ttl = 7 * 24 * 60 * 60;
    if (refreshExpiresIn.endsWith('d')) ttl = parseInt(refreshExpiresIn) * 24 * 3600;
    else if (refreshExpiresIn.endsWith('h')) ttl = parseInt(refreshExpiresIn) * 3600;
    else if (refreshExpiresIn.endsWith('m')) ttl = parseInt(refreshExpiresIn) * 60;

    await this.redis.set(`auth:refresh:${refreshToken}`, JSON.stringify(payload), ttl);

    const jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m');
    let expiresInSeconds = 900;
    if (jwtExpiresIn.endsWith('m')) expiresInSeconds = parseInt(jwtExpiresIn, 10) * 60;
    else if (jwtExpiresIn.endsWith('h')) expiresInSeconds = parseInt(jwtExpiresIn, 10) * 3600;
    else if (jwtExpiresIn.endsWith('s')) expiresInSeconds = parseInt(jwtExpiresIn, 10);
    else if (!isNaN(Number(jwtExpiresIn))) expiresInSeconds = parseInt(jwtExpiresIn, 10);

    return {
      accessToken,
      refreshToken,
      expiresIn: expiresInSeconds,
    };
  }

  // ── Inscription email+password ─────────────────────────────────────────────

  async register(dto: RegisterDto) {
    // Vérifier unicité email et téléphone en base avant d'appeler Supabase
    const [existingEmail, existingPhone] = await Promise.all([
      this.prisma.utilisateur.findUnique({ where: { email: dto.email }, select: { id: true } }),
      this.prisma.utilisateur.findUnique({ where: { telephone: dto.telephone }, select: { id: true } }),
    ]);
    if (existingEmail) throw new ConflictException('Email déjà utilisé');
    if (existingPhone) throw new ConflictException('Numéro de téléphone déjà utilisé');

    // Créer l'utilisateur Supabase (envoie automatiquement l'email de confirmation)
    const { data, error } = await this.supabase.getAnon().auth.signUp({
      email: dto.email,
      password: dto.password,
      options: {
        data: { prenom: dto.prenom, nom: dto.nom },
      },
    });

    if (error || !data.user) {
      this.logger.error(`Supabase signUp error: ${error?.message}`);
      throw new BadRequestException(error?.message ?? 'Erreur lors de la création du compte');
    }

    const supabaseUserId = data.user.id;

    // Créer Profile + Utilisateur en transaction
    await this.prisma.$transaction([
      this.prisma.profile.create({
        data: {
          userId: supabaseUserId,
          email: dto.email,
          phone: dto.telephone,
        },
      }),
      this.prisma.utilisateur.create({
        data: {
          userId: supabaseUserId,
          email: dto.email,
          telephone: dto.telephone,
          prenom: dto.prenom,
          nom: dto.nom,
        },
      }),
    ]);

    this.logger.log(`Nouvel utilisateur inscrit : ${dto.email}`);
    return { message: 'Compte créé. Vérifiez votre email pour confirmer votre inscription.' };
  }

  // ── Connexion email+password ───────────────────────────────────────────────

  async loginEmail(dto: LoginEmailDto) {
    const { data, error } = await this.supabase.getAnon().auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error || !data.session) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const user = await this.prisma.utilisateur.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        userId: true,
        email: true,
        telephone: true,
        prenom: true,
        nom: true,
        estProprietaire: true,
        actif: true,
        profileCompleted: true,
        phoneVerified: true,
        statutKyc: true,
      },
    });

    if (!user || !user.actif) throw new UnauthorizedException('Compte désactivé');

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      supabaseAccessToken: data.session.access_token,
      supabaseRefreshToken: data.session.refresh_token,
      user: {
        id: user.id,
        prenom: user.prenom,
        nom: user.nom,
        activeRole: user.estProprietaire ? Role.PROPRIETAIRE : Role.LOCATAIRE,
        profileCompleted: user.profileCompleted,
        phoneVerified: user.phoneVerified,
        statutKyc: user.statutKyc,
      },
    };
  }

  // ── Connexion par téléphone — étape 1 : envoi OTP ─────────────────────────

  async sendPhoneOtp(dto: PhoneSendOtpDto) {
    // Vérifier que le numéro est enregistré
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { telephone: dto.phone },
      select: { id: true, actif: true },
    });
    if (!utilisateur) throw new NotFoundException('Aucun compte associé à ce numéro');
    if (!utilisateur.actif) throw new UnauthorizedException('Compte désactivé');

    // Rate limiting : max 3 SMS OTP par minute par numéro
    const rlKey = `auth:otp:rl:${dto.phone}`;
    const current = await this.redis.get(rlKey);
    const count = current ? parseInt(current, 10) : 0;
    if (count >= 3) {
      throw new HttpException('Trop de tentatives. Réessayez dans quelques minutes.', HttpStatus.TOO_MANY_REQUESTS);
    }
    await this.redis.set(rlKey, String(count + 1), 60);

    const { error } = await this.supabase.getAnon().auth.signInWithOtp({ phone: dto.phone });
    if (error) {
      this.logger.error(`OTP SMS error: ${error.message}`);
      throw new BadRequestException("Impossible d'envoyer le SMS. Réessayez dans quelques instants.");
    }

    return { message: 'Code OTP envoyé par SMS' };
  }

  // ── Connexion par téléphone — étape 2 : vérification OTP ─────────────────

  async verifyPhoneOtp(dto: PhoneVerifyOtpDto) {
    const { data, error } = await this.supabase.getAnon().auth.verifyOtp({
      phone: dto.phone,
      token: dto.token,
      type: 'sms',
    });

    if (error || !data.session) {
      throw new UnauthorizedException('Code OTP invalide ou expiré');
    }

    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { telephone: dto.phone },
      select: {
        id: true,
        prenom: true,
        nom: true,
        estProprietaire: true,
        phoneVerified: true,
        actif: true,
        profileCompleted: true,
        statutKyc: true,
      },
    });

    if (!utilisateur) throw new NotFoundException('Utilisateur introuvable');
    if (!utilisateur.actif) throw new UnauthorizedException('Compte désactivé');

    // Marquer le téléphone comme vérifié si ce n'est pas encore fait
    if (!utilisateur.phoneVerified) {
      await this.prisma.utilisateur.update({
        where: { id: utilisateur.id },
        data: { phoneVerified: true },
      });
    }

    const tokens = await this.generateTokens({
      id: utilisateur.id,
      userId: data.session.user.id,
      email: data.session.user.email ?? '',
      telephone: dto.phone,
      estProprietaire: utilisateur.estProprietaire,
    });

    return {
      ...tokens,
      supabaseAccessToken: data.session.access_token,
      supabaseRefreshToken: data.session.refresh_token,
      user: {
        id: utilisateur.id,
        prenom: utilisateur.prenom,
        nom: utilisateur.nom,
        activeRole: utilisateur.estProprietaire ? Role.PROPRIETAIRE : Role.LOCATAIRE,
        profileCompleted: utilisateur.profileCompleted,
        phoneVerified: utilisateur.phoneVerified,
        statutKyc: utilisateur.statutKyc,
      },
    };
  }

  async sendCurrentPhoneOtp(userId: string, supabaseUserId: string, dto: VerifyCurrentPhoneSendDto) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
      select: { id: true, telephone: true, actif: true },
    });
    if (!utilisateur) throw new NotFoundException('Utilisateur introuvable');
    if (!utilisateur.actif) throw new UnauthorizedException('Compte désactivé');

    const existingPhone = await this.prisma.utilisateur.findUnique({
      where: { telephone: dto.phone },
      select: { id: true },
    });

    if (existingPhone && existingPhone.id !== userId) {
      throw new ConflictException('Numéro de téléphone déjà utilisé');
    }

    if (this.isFakeOtpEnabled()) {
      this.logger.log(`OTP mock activé pour ${userId} (${dto.phone})`);
      return { message: 'Code OTP simulé prêt à être validé', mocked: true };
    }

    const rlKey = `auth:verify-phone:rl:${userId}`;
    const current = await this.redis.get(rlKey);
    const count = current ? parseInt(current, 10) : 0;
    if (count >= 3) {
      throw new HttpException('Trop de tentatives. Réessayez dans quelques minutes.', HttpStatus.TOO_MANY_REQUESTS);
    }
    await this.redis.set(rlKey, String(count + 1), 60);

    const { error } = await this.supabase.getAnon().auth.signInWithOtp({ phone: dto.phone });
    if (error) {
      this.logger.error(`Current phone OTP SMS error: ${error.message}`);
      throw new BadRequestException("Impossible d'envoyer le SMS. Réessayez dans quelques instants.");
    }

    return { message: 'Code OTP envoyé par SMS', mocked: false };
  }

  async verifyCurrentPhoneOtp(userId: string, supabaseUserId: string, dto: VerifyCurrentPhoneConfirmDto) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
      select: { id: true, userId: true, telephone: true, actif: true },
    });
    if (!utilisateur) throw new NotFoundException('Utilisateur introuvable');
    if (!utilisateur.actif) throw new UnauthorizedException('Compte désactivé');

    const existingPhone = await this.prisma.utilisateur.findUnique({
      where: { telephone: dto.phone },
      select: { id: true },
    });
    if (existingPhone && existingPhone.id !== userId) {
      throw new ConflictException('Numéro de téléphone déjà utilisé');
    }

    if (!this.isFakeOtpEnabled()) {
      const { data, error } = await this.supabase.getAnon().auth.verifyOtp({
        phone: dto.phone,
        token: dto.token,
        type: 'sms',
      });

      if (error || !data.session || data.session.user.id !== supabaseUserId) {
        throw new UnauthorizedException('Code OTP invalide ou expiré');
      }
    }

    await this.prisma.$transaction([
      this.prisma.utilisateur.update({
        where: { id: userId },
        data: {
          telephone: dto.phone,
          phoneVerified: true,
        },
      }),
      this.prisma.profile.upsert({
        where: { userId: utilisateur.userId },
        create: {
          userId: utilisateur.userId,
          email: '',
          phone: dto.phone,
        },
        update: {
          phone: dto.phone,
        },
      }),
    ]);

    return {
      telephone: dto.phone,
      phoneVerified: true,
    };
  }

  async completeOnboarding(supabaseToken: string, dto: CompleteOnboardingDto) {
    const { data: { user }, error } = await this.supabase.getAnon().auth.getUser(supabaseToken);

    if (error || !user) {
      throw new UnauthorizedException('Token Supabase invalide ou expiré');
    }

    if (!this.isFakeOtpEnabled()) {
      const { data, error: otpError } = await this.supabase.getAnon().auth.verifyOtp({
        phone: dto.phone,
        token: dto.token,
        type: 'sms',
      });

      if (otpError || !data.session || data.session.user.id !== user.id) {
        throw new UnauthorizedException('Code OTP invalide ou expiré');
      }
    }

    const email = user.email?.trim();
    if (!email) {
      throw new BadRequestException('Email manquant dans le compte Supabase');
    }

    const phone = dto.phone.trim();

    const [existingUserByEmail, existingUserByPhone, existingProfileByPhone] = await Promise.all([
      this.prisma.utilisateur.findUnique({
        where: { email },
        select: { id: true, userId: true },
      }),
      this.prisma.utilisateur.findUnique({
        where: { telephone: phone },
        select: { id: true, userId: true },
      }),
      this.prisma.profile.findUnique({
        where: { phone },
        select: { id: true, userId: true },
      }),
    ]);

    if (existingUserByEmail && existingUserByEmail.userId !== user.id) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    if (existingUserByPhone && existingUserByPhone.userId !== user.id) {
      throw new ConflictException('Un compte existe déjà avec ce numéro de téléphone');
    }

    if (existingProfileByPhone && existingProfileByPhone.userId !== user.id) {
      throw new ConflictException('Un profil existe déjà avec ce numéro de téléphone');
    }

    const [, utilisateur] = await this.prisma.$transaction([
      this.prisma.profile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          email,
          phone,
        },
        update: {
          email,
          phone,
        },
      }),
      this.prisma.utilisateur.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          email,
          telephone: phone,
          prenom: dto.prenom.trim(),
          nom: dto.nom.trim(),
          dateNaissance: new Date(dto.dateNaissance),
          phoneVerified: true,
          profileCompleted: true,
          actif: true,
          estProprietaire: false,
        },
        update: {
          email,
          telephone: phone,
          prenom: dto.prenom.trim(),
          nom: dto.nom.trim(),
          dateNaissance: new Date(dto.dateNaissance),
          phoneVerified: true,
          profileCompleted: true,
        },
        select: {
          id: true,
          userId: true,
          email: true,
          telephone: true,
          prenom: true,
          nom: true,
          dateNaissance: true,
          estProprietaire: true,
          actif: true,
          profileCompleted: true,
          phoneVerified: true,
          statutKyc: true,
          logements: {
            where: { statut: 'PUBLISHED', archiveLe: null },
            select: { id: true },
          },
        },
      }),
    ]);

    const activeRole = utilisateur.estProprietaire ? Role.PROPRIETAIRE : Role.LOCATAIRE;
    const tokens = await this.generateTokens({
      id: utilisateur.id,
      userId: utilisateur.userId,
      email: utilisateur.email,
      telephone: utilisateur.telephone,
      estProprietaire: utilisateur.estProprietaire,
      activeRole,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: utilisateur.id,
        prenom: utilisateur.prenom,
        nom: utilisateur.nom,
        email: utilisateur.email,
        telephone: utilisateur.telephone,
        dateNaissance: utilisateur.dateNaissance?.toISOString() ?? null,
        activeRole,
        estProprietaire: utilisateur.estProprietaire,
        hasAnnonce: utilisateur.logements.length > 0,
        profileCompleted: utilisateur.profileCompleted,
        phoneVerified: utilisateur.phoneVerified,
        statutKyc: utilisateur.statutKyc,
      },
    };
  }

  // ── Connexion Google — complétion du profil si premier accès ─────────────

  async completeGoogleProfile(supabaseUserId: string, dto: CompleteGoogleProfileDto) {
    const existing = await this.prisma.utilisateur.findUnique({
      where: { userId: supabaseUserId },
      select: { id: true, prenom: true, nom: true, estProprietaire: true },
    });

    if (existing) {
      // Profil déjà complet — retourner sans modifier
      return { message: 'Profil déjà configuré', alreadyComplete: true };
    }

    const supabaseUser = await this.supabase.getAdmin().auth.admin.getUserById(supabaseUserId);
    if (!supabaseUser.data.user) throw new UnauthorizedException('Utilisateur Supabase introuvable');

    const email = supabaseUser.data.user.email;
    if (!email) throw new BadRequestException('Email manquant dans le compte Google');

    const existingPhone = await this.prisma.utilisateur.findUnique({
      where: { telephone: dto.telephone },
      select: { id: true },
    });
    if (existingPhone) throw new ConflictException('Numéro de téléphone déjà utilisé');

    await this.prisma.$transaction([
      this.prisma.profile.upsert({
        where: { userId: supabaseUserId },
        create: { userId: supabaseUserId, email, phone: dto.telephone },
        update: { phone: dto.telephone },
      }),
      this.prisma.utilisateur.create({
        data: {
          userId: supabaseUserId,
          email,
          telephone: dto.telephone,
          prenom: dto.prenom,
          nom: dto.nom,
        },
      }),
    ]);

    return { message: 'Profil complété avec succès' };
  }

  // ── Rafraîchissement de session ───────────────────────────────────────────

  async refresh(dto: RefreshDto) {
    const redisKey = `auth:refresh:${dto.refreshToken}`;
    const payloadStr = await this.redis.get(redisKey);
    
    if (!payloadStr) {
      throw new UnauthorizedException('Session expirée ou refresh token invalide');
    }

    const payload = JSON.parse(payloadStr);
    
    // Vérifier que l'utilisateur existe toujours et est actif
    const user = await this.prisma.utilisateur.findUnique({
      where: { id: payload.sub },
      select: { id: true, userId: true, email: true, telephone: true, estProprietaire: true, actif: true },
    });

    if (!user || !user.actif) {
      await this.redis.del(redisKey);
      throw new UnauthorizedException('Compte désactivé');
    }

    // Rotation du refresh token : on supprime l'ancien
    await this.redis.del(redisKey);

    return this.generateTokens({ ...user, activeRole: payload.activeRole as Role | undefined });
  }

  // ── Déconnexion ───────────────────────────────────────────────────────────

  async logout(accessToken: string) {
    // Mettre en blacklist Redis pour rendre le JWT invalide immédiatement
    try {
      const decoded = this.jwtService.decode(accessToken) as any;
      if (decoded?.exp && decoded.exp > Math.floor(Date.now() / 1000)) {
        const key = `auth:blacklist:${decoded.session_id}`;
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        await this.redis.set(key, '1', ttl);
      }
    } catch (e) {
      this.logger.warn('Échec du décodage du token lors du logout');
    }
    
    return { message: 'Déconnecté avec succès' };
  }

  // ── Activation mode Hôte ─────────────────────────────────────────────────

  async becomeHost(userId: string, dto: BecomeHostDto) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
      select: {
        id: true,
        userId: true,
        email: true,
        telephone: true,
        estProprietaire: true,
        wallet: { select: { id: true } },
        logements: { where: { statut: 'PUBLISHED', archiveLe: null }, select: { id: true } },
      },
    });
    if (!utilisateur) throw new NotFoundException('Utilisateur introuvable');

    // Mise à jour Profile + Utilisateur + création Wallet en transaction
    await this.prisma.$transaction([
      this.prisma.profile.update({
        where: { userId: utilisateur.userId },
        data: {
          typeHote: dto.typeHote,
          ...(dto.ninea !== undefined && { ninea: dto.ninea }),
        },
      }),
      this.prisma.utilisateur.update({
        where: { id: userId },
        data: { estProprietaire: true },
      }),
      // Créer le Wallet seulement s'il n'existe pas
      ...(!utilisateur.wallet
        ? [this.prisma.wallet.create({ data: { utilisateurId: userId } })]
        : []),
    ]);

    this.logger.log(`Utilisateur ${userId} activé comme hôte (${dto.typeHote})`);

    // Émettre de nouveaux tokens avec rôle PROPRIETAIRE intégré
    const tokens = await this.generateTokens({
      id: utilisateur.id,
      userId: utilisateur.userId,
      email: utilisateur.email,
      telephone: utilisateur.telephone,
      estProprietaire: true,
      activeRole: Role.PROPRIETAIRE,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: utilisateur.id,
        activeRole: Role.PROPRIETAIRE,
        estProprietaire: true,
        hasAnnonce: utilisateur.logements.length > 0,
      },
    };
  }

  // ── Changement de rôle actif ──────────────────────────────────────────────

  async switchRole(userId: string, _supabaseUserId: string, dto: SwitchRoleDto) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
      select: { id: true, userId: true, email: true, telephone: true, estProprietaire: true },
    });
    if (!utilisateur) throw new NotFoundException('Utilisateur introuvable');

    if (dto.role === Role.PROPRIETAIRE && !utilisateur.estProprietaire) {
      throw new BadRequestException("Vous n'êtes pas encore enregistré comme propriétaire");
    }

    const tokens = await this.generateTokens({ ...utilisateur, activeRole: dto.role as Role });
    return { ...tokens, activeRole: dto.role };
  }

  // ── Validation token Supabase et génération tokens NestJS ────────────────────────

  async validateSupabaseTokenAndGenerateTokens(supabaseToken: string) {
    // Valider le token Supabase
    const { data: { user }, error } = await this.supabase.getAnon().auth.getUser(supabaseToken);
    
    if (error || !user) {
      this.logger.warn(`Token Supabase invalide: ${error?.message}`);
      throw new UnauthorizedException('Token Supabase invalide ou expiré');
    }

    this.logger.log(`Validation token Supabase pour utilisateur: ${user.id}, email: ${user.email}`);

    // Récupérer l'utilisateur correspondant dans la base de données
    let utilisateur = await this.prisma.utilisateur.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        userId: true,
        email: true,
        telephone: true,
        prenom: true,
        nom: true,
        dateNaissance: true,
        estProprietaire: true,
        actif: true,
        profileCompleted: true,
        phoneVerified: true,
        statutKyc: true,
        logements: {
          where: { statut: 'PUBLISHED', archiveLe: null },
          select: { id: true },
        },
      },
    });

    if (!utilisateur) {
      const email = user.email?.trim() || null;
      const phone = user.phone?.trim() || null;

      const [existingProfileByEmail, existingProfileByPhone] = await Promise.all([
        email
          ? this.prisma.profile.findUnique({
              where: { email },
              select: { id: true, userId: true },
            })
          : null,
        phone
          ? this.prisma.profile.findUnique({
              where: { phone },
              select: { id: true, userId: true },
            })
          : null,
      ]);

      if (existingProfileByEmail && existingProfileByEmail.userId !== user.id) {
        throw new ConflictException('Un profil existe déjà avec cet email');
      }

      if (existingProfileByPhone && existingProfileByPhone.userId !== user.id) {
        throw new ConflictException('Un profil existe déjà avec ce numéro de téléphone');
      }

      await this.prisma.profile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          email,
          phone,
        },
        update: {
          email,
          phone,
        },
      });

      return {
        onboardingRequired: true,
        profile: {
          email,
          phone,
        },
      };
    }

    if (!utilisateur.actif) {
      throw new UnauthorizedException('Compte désactivé');
    }

    // Générer les tokens NestJS avec le rôle intégré
    const activeRole = utilisateur.estProprietaire ? Role.PROPRIETAIRE : Role.LOCATAIRE;
    const tokens = await this.generateTokens({
      id: utilisateur.id,
      userId: utilisateur.userId,
      email: utilisateur.email,
      telephone: utilisateur.telephone,
      estProprietaire: utilisateur.estProprietaire,
      activeRole,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: utilisateur.id,
        activeRole,
        estProprietaire: utilisateur.estProprietaire,
        hasAnnonce: utilisateur.logements.length > 0,
        profileCompleted: utilisateur.profileCompleted,
        phoneVerified: utilisateur.phoneVerified,
        statutKyc: utilisateur.statutKyc,
        dateNaissance: utilisateur.dateNaissance?.toISOString() ?? null,
      },
    };
  }
}
