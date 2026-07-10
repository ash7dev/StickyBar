import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly phoneNumberId: string;
  private readonly accessToken: string;

  constructor(private readonly config: ConfigService) {
    this.phoneNumberId = config.get<string>('WHATSAPP_PHONE_NUMBER_ID', '');
    this.accessToken   = config.get<string>('WHATSAPP_ACCESS_TOKEN', '');
  }

  async sendText(to: string, message: string): Promise<boolean> {
    if (!this.phoneNumberId || !this.accessToken) {
      this.logger.warn(`[WhatsApp] Clés manquantes — message non envoyé à ${to}`);
      return false;
    }

    try {
      const url = `https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { preview_url: false, body: message },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        this.logger.error(`[WhatsApp] Erreur ${res.status} pour ${to}: ${JSON.stringify(err)}`);
        return false;
      }

      this.logger.log(`[WhatsApp] Message envoyé à ${to}`);
      return true;
    } catch (e) {
      this.logger.error(`[WhatsApp] Exception pour ${to}: ${(e as Error).message}`);
      return false;
    }
  }
}
