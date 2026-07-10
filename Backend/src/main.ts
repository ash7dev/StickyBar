import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Sécurité
  app.use(helmet());

  // CORS — liste d'origines séparées par des virgules (FRONTEND_URL en prod)
  const rawOrigins = config.get<string>('CORS_ORIGINS', 'http://localhost:3000');
  const allowedOrigins = rawOrigins.split(',').map((o) => o.trim()).filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origin (ex: Swagger, curl, mobile natif)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS bloqué pour l'origine : ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Active-Role'],
    credentials: true,
  });

  // Validation globale — whitelist élimine les champs non déclarés dans les DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Prefix global
  app.setGlobalPrefix('api/v1');

  // Swagger (désactivé en production)
  if (config.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('ImmoLoc API')
      .setDescription('API de la marketplace de location ImmoLoc')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);
  console.log(`ImmoLoc API démarrée sur http://localhost:${port}/api/v1`);
}

bootstrap();
