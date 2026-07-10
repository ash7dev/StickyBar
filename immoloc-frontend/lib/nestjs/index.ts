// ── lib/nestjs — Point d'entrée unique ───────────────────────────────────────
// Importer depuis '@/lib/nestjs' suffit pour tout avoir.

export { nestFetch, ApiError } from './api-client';
export { NEST_API } from './endpoints';
export { authApi } from './auth.api';
export { listingsApi } from './listings.api';
export { walletApi } from './wallet.api';
export { dashboardApi } from './dashboard.api';
export type {
  // Primitives
  UserRole,
  ListingStatus,
  ListingType,
  PhotoCategorie,
  // Auth
  AuthUser,
  AuthTokensResponse,
  RefreshResponse,
  MeResponse,
  LoginEmailPayload,
  RegisterPayload,
  SendOtpPayload,
  VerifyOtpPayload,
  CompleteProfilePayload,
  RefreshPayload,
  SwitchRolePayload,
  // Listings
  Listing,
  Equipement,
  ListingPhoto,
  PhotoUploadParams,
  CreateListingPayload,
  UpdateListingPayload,
  SearchListingsParams,
  SearchListingsResponse,
  AddPhotoPayload,
  SetEquipementsPayload,
  TarifPersonne,
  TarifNuit,
  SetTarifsPersonnesPayload,
  SetTarifsNuitsPayload,
  PricePreviewResponse,
  // Wallet
  TransactionType,
  TransactionSens,
  MethodeRetrait,
  StatutRetrait,
  WalletTransaction,
  WalletData,
  WithdrawalPayload,
  RetraitResponse,
} from './types';
