import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class BinanceService {
  private isBinanceConfigured = false;
  private apiKey = '';
  private secretKey = '';
  private baseUrl = 'https://api.binance.com';

  constructor() {
    this.initBinance();
  }

  private initBinance() {
    const config = (environment as any).binance;
    if (config && config.apiKey && config.secretKey && 
        config.apiKey !== 'YOUR_API_KEY' && config.secretKey !== 'YOUR_SECRET_KEY') {
      this.apiKey = config.apiKey;
      this.secretKey = config.secretKey;
      this.isBinanceConfigured = true;
    } else {
      console.warn('Binance API credentials are not fully configured in environment.ts');
    }

    // Configurar base URL dinámica para evitar CORS:
    // En plataformas nativas (Capacitor) no hay restricción de CORS al usar peticiones directas.
    // En navegador web (local serve), usamos la ruta proxy '/binance-api'.
    if (Capacitor.isNativePlatform()) {
      this.baseUrl = 'https://api.binance.com';
    } else {
      this.baseUrl = '/binance-api';
    }
  }

  /**
   * Returns if the Binance API keys are configured.
   */
  isConfigured(): boolean {
    return this.isBinanceConfigured;
  }

  /**
   * Gets the API key.
   */
  getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Performs a public connectivity check (Ping) to the Binance API.
   * Resolves to true if successful, false otherwise.
   */
  async testPublicConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v3/ping`, {
        method: 'GET',
        mode: 'cors'
      });
      return response.ok;
    } catch (error) {
      console.error('Error in Binance public connection check:', error);
      return false;
    }
  }

  /**
   * Synchronizes with Binance server time to prevent clock desync errors.
   */
  async getServerTime(): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v3/time`, {
        method: 'GET',
        mode: 'cors'
      });
      if (response.ok) {
        const data = await response.json();
        return data.serverTime;
      }
    } catch (error) {
      console.warn('Could not sync time with Binance server, using local time:', error);
    }
    return Date.now();
  }

  /**
   * Performs an authenticated connectivity check by calling the /api/v3/account endpoint.
   * Returns an object indicating success, authentication state, and error message if any.
   */
  async testPrivateConnection(): Promise<{ 
    success: boolean; 
    authValid: boolean; 
    errorType?: 'cors' | 'auth' | 'network' | 'unknown'; 
    message?: string;
  }> {
    if (!this.isBinanceConfigured) {
      return { 
        success: false, 
        authValid: false, 
        errorType: 'unknown', 
        message: 'Credentials are not configured.' 
      };
    }

    try {
      // 1. Get synchronized server time
      const serverTime = await this.getServerTime();

      // 2. Prepare query parameters
      const timestamp = serverTime.toString();
      const queryString = `timestamp=${timestamp}`;

      // 3. Compute HMAC-SHA256 signature
      const signature = await this.computeHmacSha256(this.secretKey, queryString);

      // 4. Construct final URL
      const url = `${this.baseUrl}/api/v3/account?${queryString}&signature=${signature}`;

      // 5. Send authenticated request
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'X-MBX-APIKEY': this.apiKey
        }
      });

      if (response.ok) {
        return { success: true, authValid: true };
      } else {
        const status = response.status;
        let errorMessage = `HTTP Error ${status}`;
        try {
          const errData = await response.json();
          if (errData && errData.msg) {
            errorMessage = errData.msg;
          }
        } catch (_) {}

        if (status === 401 || status === 403) {
          return { 
            success: false, 
            authValid: false, 
            errorType: 'auth', 
            message: errorMessage 
          };
        }

        return { 
          success: false, 
          authValid: false, 
          errorType: 'unknown', 
          message: errorMessage 
        };
      }
    } catch (error: any) {
      console.error('Error in Binance private connection check:', error);
      
      // If a browser throws a network error during fetch and no response headers are received, 
      // it's highly likely a CORS block (since Binance does not allow localhost in origin headers for signed requests in browser).
      const isTypeError = error instanceof TypeError;
      const isNetworkOffline = !navigator.onLine;

      if (isTypeError && !isNetworkOffline) {
        return {
          success: false,
          authValid: false,
          errorType: 'cors',
          message: 'Error de CORS / Red: Binance restringe el acceso directo desde navegadores por seguridad. En dispositivos móviles (Capacitor) o producción funcionará sin restricciones de CORS.'
        };
      }

      return {
        success: false,
        authValid: false,
        errorType: isNetworkOffline ? 'network' : 'unknown',
        message: error.message || 'Error de red desconocido'
      };
    }
  }

  /**
   * Helper to compute HMAC-SHA256 using the native Web Crypto API.
   */
  private async computeHmacSha256(key: string, message: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const messageData = encoder.encode(message);

    // Import the secret key
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Sign the message data
    const signatureBuffer = await window.crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      messageData
    );

    // Convert the buffer to a hex string
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
