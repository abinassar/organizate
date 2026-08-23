import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonNote, 
  IonBadge, 
  IonIcon, 
  IonSpinner, 
  IonRefresher, 
  IonRefresherContent, 
  IonSearchbar, 
  IonSegment, 
  IonSegmentButton,
  IonCard,
  IonCardContent,
  IonButton,
  IonText,
  IonModal,
  ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  arrowDownOutline, 
  arrowUpOutline, 
  searchOutline, 
  warningOutline, 
  refreshOutline, 
  checkmarkCircleOutline, 
  closeCircleOutline,
  informationCircleOutline,
  ellipsisVerticalOutline
} from 'ionicons/icons';
import { BinanceService } from '../services/binance.service';
import { TransaccionesComponent } from '../components/transacciones/transacciones.component';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonBadge,
    IonIcon,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonCard,
    IonCardContent,
    IonButton,
    IonText,
    IonModal,
    TransaccionesComponent
  ]
})
export class Tab2Page implements OnInit {
  orders: any[] = [];
  filteredOrders: any[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  searchQuery: string = '';
  selectedSegment: string = 'all';
  binanceConfigured: boolean = false;

  // Propiedades para modal de transacciones
  isTransaccionesModalOpen: boolean = false;
  selectedOrder: any = null;

  private actionSheetController = inject(ActionSheetController);

  constructor(private binanceService: BinanceService) {
    addIcons({
      arrowDownOutline,
      arrowUpOutline,
      searchOutline,
      warningOutline,
      refreshOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      informationCircleOutline,
      ellipsisVerticalOutline
    });
  }

  ngOnInit() {
    this.binanceConfigured = this.binanceService.isConfigured();
    if (this.binanceConfigured) {
      this.loadOrders();
    }
  }

  ionViewWillEnter() {
    // Volver a verificar configuración por si cambió en la tab3
    this.binanceConfigured = this.binanceService.isConfigured();
    if (this.binanceConfigured && this.orders.length === 0) {
      this.loadOrders();
    }
  }

  async loadOrders(refresherEvent?: any) {
    if (!refresherEvent) {
      this.isLoading = true;
    }
    this.errorMessage = '';

    try {
      this.orders = await this.binanceService.getLast50P2POrders();
      this.applyFilters();
    } catch (error: any) {
      console.error('Error loading P2P orders in page:', error);
      
      // Manejar mensajes descriptivos
      if (error.message && error.message.includes('CORS')) {
        this.errorMessage = 'Restricción de CORS: No es posible firmar peticiones HTTPS directas desde el navegador local. Esta función estará completamente operativa en dispositivos móviles (Capacitor) o producción.';
      } else if (error.message && error.message.includes('API-key')) {
        this.errorMessage = 'Credenciales Inválidas: Verifica tus claves de API de Binance en environment.ts';
      } else {
        this.errorMessage = error.message || 'Error de conexión al servidor de Binance. Por favor, inténtalo de nuevo.';
      }
    } finally {
      this.isLoading = false;
      if (refresherEvent) {
        refresherEvent.target.complete();
      }
    }
  }

  applyFilters() {
    let tempOrders = [...this.orders];

    // 1. Filtrar por segmento (compra/venta)
    if (this.selectedSegment === 'buy') {
      tempOrders = tempOrders.filter(o => o.tradeType === 'BUY');
    } else if (this.selectedSegment === 'sell') {
      tempOrders = tempOrders.filter(o => o.tradeType === 'SELL');
    }

    // 2. Filtrar por texto de búsqueda (usuario contraparte o criptomoneda o fiat)
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase().trim();
      tempOrders = tempOrders.filter(o => 
        (o.counterPartNickName && o.counterPartNickName.toLowerCase().includes(query)) ||
        (o.asset && o.asset.toLowerCase().includes(query)) ||
        (o.fiat && o.fiat.toLowerCase().includes(query))
      );
    }

    this.filteredOrders = tempOrders;
  }

  onSearchChange(event: any) {
    this.searchQuery = event.detail.value;
    this.applyFilters();
  }

  onSegmentChange(event: any) {
    this.selectedSegment = event.detail.value;
    this.applyFilters();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
      case 'CANCELLED_BY_SYSTEM':
        return 'danger';
      case 'PENDING':
      case 'TRADING':
        return 'warning';
      case 'BUYER_PAYED':
      case 'DISTRIBUTING':
        return 'secondary';
      case 'IN_APPEAL':
        return 'tertiary';
      default:
        return 'medium';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'Completada';
      case 'CANCELLED':
        return 'Cancelada';
      case 'CANCELLED_BY_SYSTEM':
        return 'Cancelada (Sistema)';
      case 'PENDING':
        return 'Pendiente';
      case 'TRADING':
        return 'En Negociación';
      case 'BUYER_PAYED':
        return 'Pagado';
      case 'DISTRIBUTING':
        return 'Liberando';
      case 'IN_APPEAL':
        return 'En Apelación';
      default:
        return status;
    }
  }

  async abrirMenuOperacion(event: Event, order: any) {
    event.stopPropagation();
    
    const actionSheet = await this.actionSheetController.create({
      header: `Operación Nº ${order.orderNumber.substring(0, 10)}...`,
      buttons: [
        {
          text: 'Gestionar objetivos',
          icon: 'wallet-outline',
          handler: () => {
            this.abrirGestionarModal(order);
          }
        },
        {
          text: 'Cancelar',
          role: 'cancel',
          icon: 'close-outline'
        }
      ]
    });

    await actionSheet.present();
  }

  abrirGestionarModal(order: any) {
    this.selectedOrder = order;
    this.isTransaccionesModalOpen = true;
  }

  cerrarGestionarModal() {
    this.selectedOrder = null;
    this.isTransaccionesModalOpen = false;
  }
}
