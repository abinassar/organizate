import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonGrid, 
  IonRow, 
  IonCol, 
  IonCard, 
  IonCardContent, 
  IonCardHeader, 
  IonCardSubtitle, 
  IonCardTitle, 
  IonButton, 
  IonIcon, 
  IonLabel, 
  IonList, 
  IonItem, 
  IonBadge, 
  IonProgressBar, 
  IonModal, 
  IonSpinner,
  IonSelect,
  IonSelectOption,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  addOutline, 
  walletOutline, 
  trendingUpOutline, 
  alertCircleOutline, 
  checkmarkCircleOutline, 
  timeOutline, 
  cashOutline,
  trophyOutline,
  trashOutline,
  chevronForwardOutline,
  swapHorizontal,
  trendingDownOutline,
  calendarOutline
} from 'ionicons/icons';
import { Subscription, combineLatest } from 'rxjs';
import { ObjetivoService } from '../services/objetivo.service';
import { AmountUnitService } from '../services/amount-unit.service';
import { TransaccionService } from '../services/transaccion.service';
import { EsquemaFinancieroService } from '../services/esquema-financiero.service';
import { CategoryService } from '../services/category.service';
import { Objetivo, Aviso } from '../models/objetivo.model';
import { AmountUnit } from '../models/amount-unit.model';
import { Transaccion } from '../models/transaccion.model';
import { EsquemaFinanciero } from '../models/esquema-financiero.model';
import { Category } from '../models/category.model';
import { TransaccionesComponent } from '../components/transacciones/transacciones.component';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonGrid, 
    IonRow, 
    IonCol, 
    IonCard, 
    IonCardContent, 
    IonCardHeader, 
    IonCardSubtitle, 
    IonCardTitle, 
    IonButton, 
    IonIcon, 
    IonLabel, 
    IonList, 
    IonItem, 
    IonBadge, 
    IonProgressBar, 
    IonModal, 
    IonSpinner,
    IonSelect,
    IonSelectOption,
    TransaccionesComponent
  ],
})
export class Tab1Page implements OnInit, OnDestroy {
  objetivos: Objetivo[] = [];
  unidadesMonto: AmountUnit[] = [];
  transacciones: Transaccion[] = [];
  allTransacciones: Transaccion[] = [];
  recentTransacciones: Transaccion[] = [];
  esquemasFinancieros: EsquemaFinanciero[] = [];
  categories: Category[] = [];
  
  balances: { [key: string]: number } = { USDT: 0, EUR: 0, BS: 0 };
  isLoading = true;
  isTransaccionesModalOpen = false;

  availablePeriods: { value: string; label: string }[] = [];
  selectedPeriod = '';

  private subscriptions = new Subscription();
  
  private objetivoService = inject(ObjetivoService);
  private amountUnitService = inject(AmountUnitService);
  private transaccionService = inject(TransaccionService);
  private esquemaFinancieroService = inject(EsquemaFinancieroService);
  private categoryService = inject(CategoryService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  constructor() {
    addIcons({
      addOutline,
      walletOutline,
      trendingUpOutline,
      alertCircleOutline,
      checkmarkCircleOutline,
      timeOutline,
      cashOutline,
      trophyOutline,
      trashOutline,
      chevronForwardOutline,
      swapHorizontal,
      trendingDownOutline,
      calendarOutline
    });
  }

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  loadData() {
    this.isLoading = true;

    // Combinar los 5 flujos en tiempo real para evitar desincronizaciones de datos
    this.subscriptions.add(
      combineLatest([
        this.objetivoService.getObjetivos(),
        this.amountUnitService.getAmountUnits(),
        this.transaccionService.getTransacciones(),
        this.esquemaFinancieroService.getEsquemasFinancieros(),
        this.categoryService.getCategories()
      ]).subscribe({
        next: ([objs, units, txs, schemes, cats]) => {
          this.objetivos = objs;
          this.unidadesMonto = units;
          this.allTransacciones = txs;
          this.esquemasFinancieros = schemes;
          this.categories = cats;
          
          this.updateAvailablePeriods();
          
          if (!this.selectedPeriod) {
            this.selectedPeriod = this.getCurrentPeriodString();
          }
          
          this.filterTransacciones();
          
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error al cargar datos en Tab 1:', err);
          this.isLoading = false;
        }
      })
    );
  }

  private calculateBalances() {
    // Resetear
    this.balances = { USDT: 0, EUR: 0, BS: 0 };
    
    // Sumar montos agrupados por moneda
    this.transacciones.forEach(tx => {
      const curr = tx.currency.toUpperCase();
      const amount = tx.amount;
      
      // Mapear equivalencias para visualización
      let targetKey = curr;
      if (curr === 'USD') targetKey = 'USDT';
      if (curr === 'VES') targetKey = 'BS';

      if (this.balances[targetKey] !== undefined) {
        this.balances[targetKey] += amount;
      } else {
        // Moneda extra
        this.balances[targetKey] = amount;
      }
    });
  }

  private loadRecentTransactions() {
    this.recentTransacciones = this.transacciones.slice(0, 5);
  }

  // --- Helpers de Objetivo y Progreso ---

  getUnitName(unitId: string): string {
    const unit = this.unidadesMonto.find(u => u.id === unitId);
    return unit ? unit.name : '';
  }

  getCategory(categoryId: string): Category | undefined {
    return this.categories.find(c => c.id === categoryId);
  }

  getObjetivoName(objetivoId: string): string {
    const obj = this.objetivos.find(o => o.id === objetivoId);
    return obj ? obj.name : 'Desconocido';
  }

  getGoalProgress(goal: Objetivo): number {
    if (!goal.id) return 0;
    
    // Sumar transacciones de este objetivo
    return this.transacciones
      .filter(tx => tx.objetivoId === goal.id)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }

  getGoalPercentage(goal: Objetivo): number {
    if (goal.amount <= 0) return 0;
    const progress = this.getGoalProgress(goal);
    return progress / goal.amount;
  }

  getGoalPercentageLabel(goal: Objetivo): string {
    const pct = this.getGoalPercentage(goal) * 100;
    return `${Math.round(pct)}%`;
  }

  // Retorna los avisos (alertas) configurados que ya se han alcanzado
  getTriggeredAlerts(goal: Objetivo): Aviso[] {
    if (!goal.alerts || goal.alerts.length === 0) return [];
    
    const currentPercentage = this.getGoalPercentage(goal);
    // Filtrar avisos cuyo porcentaje sea menor o igual al progreso actual
    return goal.alerts.filter(alert => currentPercentage >= alert.percentage);
  }

  // --- Gestión de Modal ---

  abrirNuevaTransaccionModal() {
    this.isTransaccionesModalOpen = true;
  }

  cerrarNuevaTransaccionModal() {
    this.isTransaccionesModalOpen = false;
  }

  // --- Eliminar Transacción ---

  async confirmDeleteTransaccion(event: Event, tx: Transaccion) {
    event.stopPropagation();
    if (!tx.id) return;

    const alert = await this.alertController.create({
      header: 'Eliminar Transacción',
      message: `¿Estás seguro de que deseas eliminar la transacción por ${tx.amount} ${tx.currency}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.transaccionService.deleteTransaccion(tx.id!);
              const toast = await this.toastController.create({
                message: 'Transacción eliminada con éxito.',
                duration: 2000,
                color: 'success'
              });
              await toast.present();
            } catch (err) {
              console.error('Error al eliminar transacción:', err);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // --- Métodos de Esquema Financiero ---

  getEsquemaTotals(scheme: EsquemaFinanciero): { amount: number, unitName: string }[] {
    const totalsMap: { [unitName: string]: number } = {};
    
    scheme.configs.forEach(config => {
      const goal = this.objetivos.find(o => o.id === config.objetivoId);
      if (!goal) return;
      
      const unitName = this.getUnitName(goal.unitId) || 'USD';
      const progress = this.getGoalProgress(goal);
      
      if (totalsMap[unitName] === undefined) {
        totalsMap[unitName] = 0;
      }
      
      if (config.operator === 'sum') {
        totalsMap[unitName] += progress;
      } else if (config.operator === 'subtract') {
        totalsMap[unitName] -= progress;
      }
    });
    
    return Object.keys(totalsMap).map(unitName => ({
      amount: totalsMap[unitName],
      unitName
    }));
  }

  getEsquemaEstimados(scheme: EsquemaFinanciero): { amount: number, unitName: string }[] {
    const totalsMap: { [unitName: string]: number } = {};
    
    scheme.configs.forEach(config => {
      const goal = this.objetivos.find(o => o.id === config.objetivoId);
      if (!goal) return;
      
      const unitName = this.getUnitName(goal.unitId) || 'USD';
      const targetAmount = goal.amount;
      
      if (totalsMap[unitName] === undefined) {
        totalsMap[unitName] = 0;
      }
      
      if (config.operator === 'sum') {
        totalsMap[unitName] += targetAmount;
      } else if (config.operator === 'subtract') {
        totalsMap[unitName] -= targetAmount;
      }
    });
    
    return Object.keys(totalsMap).map(unitName => ({
      amount: totalsMap[unitName],
      unitName
    }));
  }

  getGoalProgressById(objetivoId: string): number {
    const goal = this.objetivos.find(o => o.id === objetivoId);
    return goal ? this.getGoalProgress(goal) : 0;
  }

  getObjetivoUnitName(objetivoId: string): string {
    const goal = this.objetivos.find(o => o.id === objetivoId);
    return goal ? this.getUnitName(goal.unitId) : '';
  }

  getCurrentPeriodString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  formatPeriodLabel(period: string): string {
    if (!period || period === 'all') return 'Todo el Historial';
    const [year, monthStr] = period.split('-');
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const monthIdx = parseInt(monthStr, 10) - 1;
    const monthName = months[monthIdx] || monthStr;
    return `${monthName} ${year}`;
  }

  updateAvailablePeriods() {
    const periodsSet = new Set<string>();
    
    // Add current period to options so there's always at least the current month
    const currentPeriod = this.getCurrentPeriodString();
    periodsSet.add(currentPeriod);

    this.allTransacciones.forEach(tx => {
      if (tx.mes) {
        periodsSet.add(tx.mes);
      }
    });

    const sortedPeriods = Array.from(periodsSet).sort((a, b) => b.localeCompare(a));

    this.availablePeriods = sortedPeriods.map(p => ({
      value: p,
      label: this.formatPeriodLabel(p)
    }));
  }

  filterTransacciones() {
    if (this.selectedPeriod === 'all') {
      this.transacciones = [...this.allTransacciones];
    } else {
      this.transacciones = this.allTransacciones.filter(tx => tx.mes === this.selectedPeriod);
    }
    
    this.calculateBalances();
    this.loadRecentTransactions();
  }
}
