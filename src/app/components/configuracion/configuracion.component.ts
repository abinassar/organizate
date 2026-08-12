import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonCard, 
  IonCardContent, 
  IonButton, 
  IonIcon, 
  IonBadge, 
  IonSpinner, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonToggle 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  refreshOutline, 
  wifiOutline, 
  cloudOutline, 
  cloudOfflineOutline, 
  checkmarkCircleOutline, 
  closeCircleOutline, 
  warningOutline,
  keyOutline,
  shieldCheckmarkOutline,
  serverOutline,
  linkOutline
} from 'ionicons/icons';
import { FirebaseService } from '../../services/firebase.service';
import { BinanceService } from '../../services/binance.service';

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardContent,
    IonButton,
    IonIcon,
    IonBadge,
    IonSpinner,
    IonList,
    IonItem,
    IonLabel,
    IonToggle
  ]
})
export class ConfiguracionComponent implements OnInit, OnDestroy {
  connectionStatus: 'connected' | 'disconnected' | 'testing' | 'unconfigured' = 'testing';
  isBrowserOnline: boolean = navigator.onLine;
  isOfflineSimulated: boolean = false;
  lastChecked: Date | null = null;
  firebaseInitialized: boolean = false;

  binanceStatus: 'connected' | 'disconnected' | 'testing' | 'unconfigured' = 'testing';
  binanceAuthStatus: 'valid' | 'invalid' | 'testing' | 'unchecked' = 'unchecked';
  binanceInitialized: boolean = false;
  binanceLastChecked: Date | null = null;
  binanceErrorMessage: string = '';

  private onlineListener!: () => void;
  private offlineListener!: () => void;

  constructor(
    private firebaseService: FirebaseService,
    private binanceService: BinanceService
  ) {
    addIcons({
      refreshOutline,
      wifiOutline,
      cloudOutline,
      cloudOfflineOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      warningOutline,
      keyOutline,
      shieldCheckmarkOutline,
      serverOutline,
      linkOutline
    });
  }

  ngOnInit() {
    this.firebaseInitialized = this.firebaseService.isInitialized();
    this.binanceInitialized = this.binanceService.isConfigured();
    this.setupNetworkListeners();
    this.testConnection();
    this.testBinanceConnection();
  }

  ngOnDestroy() {
    window.removeEventListener('online', this.onlineListener);
    window.removeEventListener('offline', this.offlineListener);
  }

  private setupNetworkListeners() {
    this.onlineListener = () => {
      this.isBrowserOnline = true;
      this.testConnection();
      this.testBinanceConnection();
    };
    this.offlineListener = () => {
      this.isBrowserOnline = false;
      this.connectionStatus = 'disconnected';
      this.binanceStatus = 'disconnected';
      this.binanceAuthStatus = 'unchecked';
    };

    window.addEventListener('online', this.onlineListener);
    window.addEventListener('offline', this.offlineListener);
  }

  async testConnection() {
    if (!this.firebaseInitialized) {
      this.connectionStatus = 'unconfigured';
      this.lastChecked = new Date();
      return;
    }

    this.connectionStatus = 'testing';
    
    // Si el navegador está completamente offline, no intentamos consultar
    if (!this.isBrowserOnline || this.isOfflineSimulated) {
      setTimeout(() => {
        this.connectionStatus = 'disconnected';
        this.lastChecked = new Date();
      }, 800);
      return;
    }

    try {
      const isConnected = await this.firebaseService.checkConnection();
      this.connectionStatus = isConnected ? 'connected' : 'disconnected';
    } catch (e) {
      this.connectionStatus = 'disconnected';
    } finally {
      this.lastChecked = new Date();
    }
  }

  async toggleOfflineSimulation(event: any) {
    this.isOfflineSimulated = event.detail.checked;
    
    if (this.isOfflineSimulated) {
      await this.firebaseService.disableNetwork();
    } else {
      await this.firebaseService.enableNetwork();
    }
    
    // Volver a probar conexión tras cambiar estado
    this.testConnection();
  }

  async testBinanceConnection() {
    if (!this.binanceInitialized) {
      this.binanceStatus = 'unconfigured';
      this.binanceAuthStatus = 'unchecked';
      this.binanceLastChecked = new Date();
      return;
    }

    this.binanceStatus = 'testing';
    this.binanceAuthStatus = 'testing';
    this.binanceErrorMessage = '';

    if (!this.isBrowserOnline) {
      setTimeout(() => {
        this.binanceStatus = 'disconnected';
        this.binanceAuthStatus = 'unchecked';
        this.binanceLastChecked = new Date();
      }, 800);
      return;
    }

    try {
      // 1. Probar ping público
      const isPublicOk = await this.binanceService.testPublicConnection();
      if (!isPublicOk) {
        this.binanceStatus = 'disconnected';
        this.binanceAuthStatus = 'unchecked';
        this.binanceErrorMessage = 'No se pudo establecer comunicación con el servidor público de Binance (Ping fallido).';
        return;
      }

      // 2. Si el ping funciona, la conexión de red con Binance está activa. Procedemos a verificar firma/credenciales.
      const privateResult = await this.binanceService.testPrivateConnection();
      
      if (privateResult.success) {
        this.binanceStatus = 'connected';
        this.binanceAuthStatus = 'valid';
      } else {
        if (privateResult.errorType === 'cors') {
          // El ping fue exitoso, por lo que hay conexión, pero el navegador bloqueó la firma por CORS
          this.binanceStatus = 'connected';
          this.binanceAuthStatus = 'unchecked'; // No se puede verificar por el navegador
          this.binanceErrorMessage = privateResult.message || '';
        } else {
          this.binanceStatus = 'disconnected';
          this.binanceAuthStatus = 'invalid';
          this.binanceErrorMessage = privateResult.message || 'Error en las credenciales de la API.';
        }
      }
    } catch (e: any) {
      this.binanceStatus = 'disconnected';
      this.binanceAuthStatus = 'unchecked';
      this.binanceErrorMessage = e.message || 'Ocurrió un error inesperado al probar la API.';
    } finally {
      this.binanceLastChecked = new Date();
    }
  }
}
