import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons, 
  IonButton, 
  IonIcon, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonInput, 
  IonSelect, 
  IonSelectOption, 
  IonNote, 
  IonChip, 
  IonSpinner, 
  IonTextarea,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  closeOutline, 
  cashOutline, 
  trashOutline, 
  addOutline, 
  documentTextOutline, 
  walletOutline, 
  alertCircleOutline, 
  checkmarkCircleOutline,
  arrowDownOutline,
  arrowUpOutline,
  informationCircleOutline
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { ObjetivoService } from '../../services/objetivo.service';
import { AmountUnitService } from '../../services/amount-unit.service';
import { TransaccionService } from '../../services/transaccion.service';
import { Objetivo } from '../../models/objetivo.model';
import { AmountUnit } from '../../models/amount-unit.model';
import { Transaccion } from '../../models/transaccion.model';

@Component({
  selector: 'app-transacciones',
  templateUrl: './transacciones.component.html',
  styleUrls: ['./transacciones.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonNote,
    IonChip,
    IonSpinner,
    IonTextarea
  ]
})
export class TransaccionesComponent implements OnInit, OnDestroy {
  @Input() operation: any = null; // Operation object from Tab 2, if any
  @Output() close = new EventEmitter<void>();

  objetivos: Objetivo[] = [];
  unidadesMonto: AmountUnit[] = [];
  transaccionesAsociadas: Transaccion[] = [];
  
  isLoading = true;
  isSaving = false;
  transaccionForm!: FormGroup;

  private subscriptions: Subscription = new Subscription();
  
  private fb = inject(FormBuilder);
  private objetivoService = inject(ObjetivoService);
  private amountUnitService = inject(AmountUnitService);
  private transaccionService = inject(TransaccionService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  constructor() {
    addIcons({
      closeOutline,
      cashOutline,
      trashOutline,
      addOutline,
      documentTextOutline,
      walletOutline,
      alertCircleOutline,
      checkmarkCircleOutline,
      arrowDownOutline,
      arrowUpOutline,
      informationCircleOutline
    });
  }

  ngOnInit() {
    this.initForm();
    this.loadData();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private initForm() {
    this.transaccionForm = this.fb.group({
      objetivoId: ['', [Validators.required]],
      amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
      currency: ['USDT'], // Default currency
      description: ['', [Validators.required, Validators.maxLength(150)]]
    });

    // En modo de operación, la moneda se determina automáticamente por el objetivo
    if (this.operation) {
      this.transaccionForm.get('currency')?.clearValidators();
      this.transaccionForm.get('currency')?.updateValueAndValidity();
      
      // Intentar rellenar una descripción por defecto basada en la operación
      const tradeTypeLabel = this.operation.tradeType === 'BUY' ? 'Compra' : 'Venta';
      const userNick = this.operation.counterPartNickName || 'Binance';
      this.transaccionForm.patchValue({
        description: `${tradeTypeLabel} P2P con ${userNick}`
      });
    }
  }

  private loadData() {
    // 1. Cargar objetivos
    this.subscriptions.add(
      this.objetivoService.getObjetivos().subscribe({
        next: (objs) => {
          this.objetivos = objs;
          this.checkLoadingState();
        },
        error: (err) => {
          console.error('Error al cargar objetivos:', err);
          this.checkLoadingState();
        }
      })
    );

    // 2. Cargar unidades de monto (monedas)
    this.subscriptions.add(
      this.amountUnitService.getAmountUnits().subscribe({
        next: (units) => {
          this.unidadesMonto = units;
          this.checkLoadingState();
        },
        error: (err) => {
          console.error('Error al cargar unidades de monto:', err);
          this.checkLoadingState();
        }
      })
    );

    // 3. Cargar transacciones
    this.subscriptions.add(
      this.transaccionService.getTransacciones().subscribe({
        next: (txs) => {
          if (this.operation) {
            // Filtrar transacciones asociadas a esta operación específica
            this.transaccionesAsociadas = txs.filter(
              tx => tx.operationId === this.operation.orderNumber
            );
          } else {
            this.transaccionesAsociadas = txs;
          }
          this.checkLoadingState();
        },
        error: (err) => {
          console.error('Error al cargar transacciones:', err);
          this.checkLoadingState();
        }
      })
    );
  }

  private checkLoadingState() {
    if (this.objetivos !== undefined && this.unidadesMonto !== undefined && this.transaccionesAsociadas !== undefined) {
      this.isLoading = false;
    }
  }

  // --- Helpers de Moneda y Objetivo ---

  getUnitName(unitId: string): string {
    const unit = this.unidadesMonto.find(u => u.id === unitId);
    return unit ? unit.name : '';
  }

  getObjetivoName(objetivoId: string): string {
    const obj = this.objetivos.find(o => o.id === objetivoId);
    return obj ? obj.name : 'Desconocido';
  }

  getObjetivoCurrency(objetivoId: string): string {
    const obj = this.objetivos.find(o => o.id === objetivoId);
    if (!obj) return '';
    return this.getUnitName(obj.unitId);
  }

  // Compara si la moneda seleccionada coincide con la del objetivo financiero
  areCurrenciesMatching(txCurrency: string, goalUnitName: string): boolean {
    const normTx = txCurrency.toUpperCase().trim();
    const normGoal = goalUnitName.toUpperCase().trim();
    
    if (normTx === normGoal) return true;
    
    // Equivalencias
    if ((normTx === 'USDT' || normTx === 'USD') && (normGoal === 'USDT' || normGoal === 'USD')) return true;
    if ((normTx === 'BS' || normTx === 'VES') && (normGoal === 'BS' || normGoal === 'VES')) return true;
    
    return false;
  }

  // Copia el monto correspondiente de la operación al formulario
  copiarMonto(monto: number) {
    this.transaccionForm.patchValue({ amount: monto });
  }

  // --- Guardar Transacción ---

  async saveTransaccion() {
    if (this.transaccionForm.invalid) {
      this.transaccionForm.markAllAsTouched();
      return;
    }

    const formVal = this.transaccionForm.value;
    const selectedGoal = this.objetivos.find(o => o.id === formVal.objetivoId);

    if (!selectedGoal) {
      this.showToast('El objetivo financiero seleccionado no es válido.', 'danger');
      return;
    }

    const goalCurrency = this.getUnitName(selectedGoal.unitId);
    let txCurrency = '';

    if (this.operation) {
      // En modo operación, la moneda de la transacción es automáticamente la del objetivo
      txCurrency = goalCurrency;
    } else {
      // En modo manual, la ingresa el usuario
      txCurrency = formVal.currency;
    }

    // Validar coincidencia de monedas
    if (!this.areCurrenciesMatching(txCurrency, goalCurrency)) {
      await this.showWarningAlert();
      return;
    }

    this.isSaving = true;

    const newTx: Omit<Transaccion, 'id' | 'active'> = {
      objetivoId: formVal.objetivoId,
      amount: Number(formVal.amount),
      currency: txCurrency.toUpperCase(),
      description: formVal.description.trim(),
      ...(this.operation && { operationId: this.operation.orderNumber })
    };

    try {
      await this.transaccionService.addTransaccion(newTx);
      this.showToast('Transacción asociada exitosamente.', 'success');
      
      // Resetear formulario manteniendo la descripción por defecto si es modo operación
      if (this.operation) {
        const tradeTypeLabel = this.operation.tradeType === 'BUY' ? 'Compra' : 'Venta';
        const userNick = this.operation.counterPartNickName || 'Binance';
        this.transaccionForm.reset({
          objetivoId: '',
          amount: null,
          description: `${tradeTypeLabel} P2P con ${userNick}`
        });
      } else {
        this.transaccionForm.reset({
          objetivoId: '',
          amount: null,
          currency: 'USDT',
          description: ''
        });
      }
    } catch (err) {
      console.error('Error al guardar transacción:', err);
      this.showToast('Error al guardar la transacción. Inténtalo de nuevo.', 'danger');
    } finally {
      this.isSaving = false;
    }
  }

  // --- Eliminar Transacción ---

  async confirmDelete(tx: Transaccion) {
    if (!tx.id) return;

    const alert = await this.alertController.create({
      header: 'Eliminar Asociación',
      message: '¿Estás seguro de que deseas eliminar esta transacción?',
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
              this.showToast('Asociación eliminada con éxito.', 'success');
            } catch (err) {
              console.error('Error al eliminar transacción:', err);
              this.showToast('No se pudo eliminar la transacción.', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // --- Utilidades de UI ---

  private async showWarningAlert() {
    const alert = await this.alertController.create({
      header: 'Moneda Incompatible',
      message: 'La transacción debe estar en la misma moneda que el objetivo financiero al que se va a asociar',
      buttons: ['Entendido']
    });
    await alert.present();
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  cerrarModal() {
    this.close.emit();
  }
}
