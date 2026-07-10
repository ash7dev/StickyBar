import { Module } from '@nestjs/common';
import { EnregistrerFauteUseCase } from './use-cases/enregistrer-faute.use-case';
import { VerifierSeuilSuspensionUseCase } from './use-cases/verifier-seuil-suspension.use-case';
import { ReinitialiserCompteursUseCase } from './use-cases/reinitialiser-compteurs.use-case';

const USE_CASES = [
  EnregistrerFauteUseCase,
  VerifierSeuilSuspensionUseCase,
  ReinitialiserCompteursUseCase,
];

@Module({
  providers: [...USE_CASES],
  exports: [...USE_CASES],
})
export class FautesDomainModule {}
