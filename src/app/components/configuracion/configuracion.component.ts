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
  warningOutline 
} from 'ionicons/icons';
import { FirebaseService } from '../../services/firebase.service';

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

  private onlineListener!: () => void;
  private offlineListener!: () => void;

  constructor(private firebaseService: FirebaseService) {
    addIcons({
      refreshOutline,
      wifiOutline,
      cloudOutline,
      cloudOfflineOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      warningOutline
    });
  }

  ngOnInit() {
    this.firebaseInitialized = this.firebaseService.isInitialized();
    this.setupNetworkListeners();
    this.testConnection();
  }

  ngOnDestroy() {
    window.removeEventListener('online', this.onlineListener);
    window.removeEventListener('offline', this.offlineListener);
  }

  private setupNetworkListeners() {
    this.onlineListener = () => {
      this.isBrowserOnline = true;
      this.testConnection();
    };
    this.offlineListener = () => {
      this.isBrowserOnline = false;
      this.connectionStatus = 'disconnected';
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
}
