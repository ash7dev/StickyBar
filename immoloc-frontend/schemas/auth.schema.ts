import { z } from 'zod';

// E.164 international — pas limité au Sénégal (comme les grandes applis)
const phoneSchema = z
  .string()
  .min(1, 'Numéro de téléphone requis')
  .regex(/^\+[1-9]\d{6,14}$/, 'Format invalide. Exemple : +221771234567 ou +33612345678');

export const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(8, 'Mot de passe : 8 caractères minimum'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  prenom: z.string().min(1, 'Prénom requis').max(50),
  nom: z.string().min(1, 'Nom requis').max(50),
  telephone: phoneSchema,
  email: z.string().email('Adresse email invalide'),
  password: z
    .string()
    .min(8, 'Mot de passe : 8 caractères minimum')
    .max(72, 'Mot de passe trop long'),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const otpSchema = z.object({
  token: z
    .string()
    .length(6, 'Le code doit contenir 6 chiffres')
    .regex(/^\d{6}$/, 'Chiffres uniquement'),
});
export type OtpInput = z.infer<typeof otpSchema>;

export const completeProfileSchema = z.object({
  prenom: z.string().min(1, 'Prénom requis').max(50),
  nom: z.string().min(1, 'Nom requis').max(50),
  telephone: phoneSchema,
});
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
