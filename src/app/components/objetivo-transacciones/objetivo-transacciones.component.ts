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
  IonChip, 
  IonSpinner, 
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  closeOutline, 
  receiptOutline, 
  createOutline, 
  trashOutline, 
  checkmarkOutline, 
  closeCircleOutline, 
  cashOutline, 
  walletOutline,
  calendarOutline,
  pricetagOutline
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { TransaccionService } from '../../services/transaccion.service';
import { CategoryService } from '../../services/category.service';
import { AmountUnitService } from '../../services/amount-unit.service';
import { Objetivo } from '../../models/objetivo.model';
import { Transaccion } from '../../models/transaccion.model';
import { Category } from '../../models/category.model';
import { AmountUnit } from '../../models/amount-unit.model';

@Component({
  selector: 'app-objetivo-transacciones',
  templateUrl: './objetivo-transacciones.component.html',
  styleUrls: ['./objetivo-transacciones.component.scss'],
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
    IonChip,
    IonSpinner
  ]
})
export class ObjetivoTransaccionesComponent implements OnInit, OnDestroy {
  @Input() goal: Objetivo | null = null;
  @Output() close = new EventEmitter<void>();

  transacciones: Transaccion[] = [];
  categories: Category[] = [];
  unidadesMonto: AmountUnit[] = [];
  
  isLoading = true;
  editingTxId: string | null = null;
  editForm!: FormGroup;
  isSaving = false;

  private subscriptions = new Subscription();
  private transaccionService = inject(TransaccionService);
  private categoryService = inject(CategoryService);
  private amountUnitService = inject(AmountUnitService);
  private fb = inject(FormBuilder);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  constructor() {
    addIcons({
      closeOutline,
      receiptOutline,
      createOutline,
      trashOutline,
      checkmarkOutline,
      closeCircleOutline,
      cashOutline,
      walletOutline,
      calendarOutline,
      pricetagOutline
    });
  }

  ngOnInit() {
    this.initEditForm();
    this.loadData();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private initEditForm() {
    this.editForm = this.fb.group({
      description: ['', [Validators.required, Validators.maxLength(150)]],
      amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
      categoryId: ['', [Validators.required]],
      currency: ['USDT', [Validators.required]],
      mes: ['', [Validators.required]],
      fecha: ['', [Validators.required]]
    });
  }

  private loadData() {
    this.isLoading = true;

    // Cargar categorías
    this.subscriptions.add(
      this.categoryService.getCategories().subscribe({
        next: (cats) => this.categories = cats,
        error: (err) => console.error('Error al cargar categorías:', err)
      })
    );

    // Cargar unidades de monto
    this.subscriptions.add(
      this.amountUnitService.getAmountUnits().subscribe({
        next: (units) => this.unidadesMonto = units,
        error: (err) => console.error('Error al cargar unidades:', err)
      })
    );

    // Cargar transacciones filtradas por el objetivo
    this.subscriptions.add(
      this.transaccionService.getTransacciones().subscribe({
        next: (txs) => {
          if (this.goal?.id) {
            this.transacciones = txs.filter(tx => tx.objetivoId === this.goal?.id);
          } else {
            this.transacciones = txs;
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error al cargar transacciones:', err);
          this.isLoading = false;
        }
      })
    );
  }

  getCategory(categoryId: string): Category | undefined {
    return this.categories.find(c => c.id === categoryId);
  }

  formatDateForInput(date?: Date | number): string {
    if (!date) return '';
    const d = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();
    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  }

  startEditing(tx: Transaccion) {
    if (!tx.id) return;
    this.editingTxId = tx.id;
    
    const fechaFormatted = this.formatDateForInput(tx.fecha);
    const mesFormatted = tx.mes || (tx.fecha ? `${tx.fecha.getFullYear()}-${String(tx.fecha.getMonth() + 1).padStart(2, '0')}` : '');

    this.editForm.patchValue({
      description: tx.description,
      amount: tx.amount,
      categoryId: tx.categoryId,
      currency: tx.currency,
      mes: mesFormatted,
      fecha: fechaFormatted
    });
  }

  cancelEditing() {
    this.editingTxId = null;
    this.editForm.reset();
  }

  async saveEdit(tx: Transaccion) {
    if (!tx.id || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const formVal = this.editForm.value;

    const updatedData: Partial<Transaccion> = {
      description: formVal.description.trim(),
      amount: Number(formVal.amount),
      categoryId: formVal.categoryId,
      currency: formVal.currency.toUpperCase(),
      mes: formVal.mes,
      fecha: new Date(formVal.fecha + 'T00:00:00')
    };

    try {
      await this.transaccionService.updateTransaccion(tx.id, updatedData);
      this.editingTxId = null;
      this.showToast('Transacción actualizada con éxito.', 'success');
    } catch (err) {
      console.error('Error al actualizar transacción:', err);
      this.showToast('Error al actualizar la transacción.', 'danger');
    } finally {
      this.isSaving = false;
    }
  }

  async confirmDelete(tx: Transaccion) {
    if (!tx.id) return;

    const alert = await this.alertController.create({
      header: 'Eliminar Transacción',
      message: `¿Estás seguro de eliminar la transacción por ${tx.amount} ${tx.currency}?`,
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
              this.showToast('Transacción eliminada con éxito.', 'success');
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

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  cerrarModal() {
    this.close.emit();
  }
}

