import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiClient } from '../api/api-client';

export class PushNotificationsService {
  /**
   * Demande les permissions système et génère l'ExpoPushToken de l'appareil
   */
  static async registerForPushNotificationsAsync(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('[PushNotificationsService] Les notifications push physiques requièrent un appareil réel (ou Expo Go sur téléphone).');
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('[PushNotificationsService] Permission pour les notifications push refusée par l’utilisateur.');
        return null;
      }

      // Récupération du projectId EAS optionnel ou fallback Expo Go
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId;

      const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );

      const expoPushToken = tokenData.data;
      console.log('[PushNotificationsService] Expo Push Token obtenu :', expoPushToken);

      // Configuration spécifique du canal Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Paixi Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#004B3E',
        });
      }

      return expoPushToken;
    } catch (error) {
      console.warn('[PushNotificationsService] Erreur lors de la génération du Push Token :', error);
      return null;
    }
  }

  /**
   * Enregistre le token Expo Push auprès du backend NestJS (`POST /notifications/subscribe-expo`)
   */
  static async subscribeDevicePushToken(expoPushToken: string): Promise<boolean> {
    try {
      const deviceModel = `${Device.brand || ''} ${Device.modelName || ''}`.trim() || undefined;
      const platform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';

      const res = await apiClient.post('/notifications/subscribe-expo', {
        expoPushToken,
        platform,
        deviceType: deviceModel,
      });

      console.log('[PushNotificationsService] Jeton enregistré avec succès sur le backend NestJS :', res.data);
      return true;
    } catch (error: any) {
      console.warn('[PushNotificationsService] Échec d’enregistrement du token sur le backend :', error?.response?.data || error.message);
      return false;
    }
  }

  /**
   * Envoie une notification push de test instantanée via l'endpoint NestJS (`POST /notifications/test`)
   */
  static async sendTestPushNotification(): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await apiClient.post<any>('/notifications/test', {
        title: 'Paixi Mobile 🚀',
        message: 'Félicitations ! Vos notifications Push mobiles sont opérationnelles !',
        url: '/(tenant)/profile',
      });
      return { success: res.data?.success ?? true, message: res.data?.message };
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || 'Impossible d’envoyer la notification de test';
      return { success: false, message: errMsg };
    }
  }
}
