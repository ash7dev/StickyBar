import { Injectable, Logger } from '@nestjs/common';

export interface PayDunyaSetupResponse {
  token: string;
  url: string;
  success: boolean;
}

@Injectable()
export class PayDunyaProvider {
  private readonly logger = new Logger(PayDunyaProvider.name);

  async createCheckout(data: {
    amount: number;
    description: string;
    cancel_url: string;
    return_url: string;
    custom_data: Record<string, any>;
  }): Promise<PayDunyaSetupResponse> {
    // Simulation d'appel PayDunya pour le moment
    // Dans une vraie implémentation, on utiliserait axios ou l'SDK PayDunya
    this.logger.log(`Initialisation paiement PayDunya: ${data.amount} FCFA pour ${data.description}`);
    
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      token: `tok_${Math.random().toString(36).substring(7)}`,
      url: `https://paydunya.com/checkout/step1/${Math.random().toString(36).substring(7)}`,
      success: true,
    };
  }
}
