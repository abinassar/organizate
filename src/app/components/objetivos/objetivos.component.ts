import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { 
  IonCard, 
  IonCardContent, 
  IonButton, 
  IonIcon, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonBadge, 
  IonSpinner, 
  IonModal, 
  IonButtons, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonInput, 
  IonTextarea,
  IonNote,
  IonSelect,
  IonSelectOption,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  trophyOutline, 
  addOutline, 
  pencilOutline, 
  trashOutline, 
  closeOutline, 
  checkmarkOutline, 
  alertCircleOutline, 
  trendingUpOutline, 
  trendingDownOutline, 
  notificationsOutline, 
  listOutline,
  warningOutline,
  folderOpenOutline,
  calendarOutline,
  cashOutline
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { CategoryService } from '../../services/category.service';
import { TipoObjetivoService } from '../../services/tipo-objetivo.service';
import { PeriodicityService } from '../../services/periodicity.service';
import { AmountUnitService } from '../../services/amount-unit.service';
import { ObjetivoService } from '../../services/objetivo.service';
import { Category } from '../../models/category.model';
import { TipoObjetivo } from '../../models/tipo-objetivo.model';
import { Periodicity } from '../../models/periodicity.model';
import { AmountUnit } from '../../models/amount-unit.model';
import { Objetivo, Aviso } from '../../models/objetivo.model';
import { Transaccion } from '../../models/transaccion.model';
import { TransaccionService } from '../../services/transaccion.service';
import { IonProgressBar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-objetivos',
  templateUrl: './objetivos.component.html',
  styleUrls: ['./objetivos.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonCard,
    IonCardContent,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonSpinner,
    IonModal,
    IonButtons,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonInput,
    IonTextarea,
    IonNote,
    IonSelect,
    IonSelectOption,
    IonProgressBar
  ]
})
export class ObjetivosComponent implements OnInit, OnDestroy {
  objetivos: Objetivo[] = [];
  categories: Category[] = [];
  tiposObjetivos: TipoObjetivo[] = [];
  periodicidades: Periodicity[] = [];
  unidadesMonto: AmountUnit[] = [];
  transacciones: Transaccion[] = [];
  
  isLoading = true;
  isModalOpen = false;
  editingObjetivo: Objetivo | null = null;
  
  objetivoForm!: FormGroup;
  avisoForm!: FormGroup;
  
  tempAlerts: Aviso[] = [];
  editingAvisoIndex: number | null = null;

  private subscriptions: Subscription = new Subscription();
  
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private tipoObjetivoService = inject(TipoObjetivoService);
  private periodicityService = inject(PeriodicityService);
  private amountUnitService = inject(AmountUnitService);
  private objetivoService = inject(ObjetivoService);
  private transaccionService = inject(TransaccionService);
  private alertController = inject(AlertController);

  constructor() {
    addIcons({
      trophyOutline,
      addOutline,
      pencilOutline,
      trashOutline,
      closeOutline,
      checkmarkOutline,
      alertCircleOutline,
      trendingUpOutline,
      trendingDownOutline,
      notificationsOutline,
      listOutline,
      warningOutline,
      folderOpenOutline,
      calendarOutline,
      cashOutline
    });
    
    this.initForms();
  }

  ngOnInit() {
    this.subscriptions.add(
      this.categoryService.getCategories().subscribe({
        next: (cats) => {
          this.categories = cats;
          this.checkLoadingState();
        },
        error: (err) => console.error('Error al cargar categorías:', err)
      })
    );

    this.subscriptions.add(
      this.tipoObjetivoService.getTiposObjetivos().subscribe({
        next: (tipos) => {
          this.tiposObjetivos = tipos;
          this.checkLoadingState();
        },
        error: (err) => console.error('Error al cargar tipos de objetivos:', err)
      })
    );

    this.subscriptions.add(
      this.periodicityService.getPeriodicities().subscribe({
        next: (periods) => {
          this.periodicidades = periods;
          this.checkLoadingState();
        },
        error: (err) => console.error('Error al cargar periodicidades:', err)
      })
    );

    this.subscriptions.add(
      this.amountUnitService.getAmountUnits().subscribe({
        next: (units) => {
          this.unidadesMonto = units;
          this.checkLoadingState();
        },
        error: (err) => console.error('Error al cargar unidades de monto:', err)
      })
    );

    this.subscriptions.add(
      this.objetivoService.getObjetivos().subscribe({
        next: (objs) => {
          this.objetivos = objs;
          this.checkLoadingState();
        },
        error: (err) => console.error('Error al cargar objetivos:', err)
      })
    );

    this.subscriptions.add(
      this.transaccionService.getTransacciones().subscribe({
        next: (txs) => {
          this.transacciones = txs;
          this.checkLoadingState();
        },
        error: (err) => console.error('Error al cargar transacciones:', err)
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private checkLoadingState() {
    if (
      this.categories !== undefined && 
      this.tiposObjetivos !== undefined && 
      this.periodicidades !== undefined && 
      this.unidadesMonto !== undefined && 
      this.objetivos !== undefined &&
      this.transacciones !== undefined
    ) {
      setTimeout(() => {
        this.isLoading = false;
      }, 300);
    }
  }

  // --- Progreso de Objetivos ---

  getGoalProgress(goal: Objetivo): number {
    if (!goal.id) return 0;
    return this.transacciones
      .filter(tx => tx.objetivoId === goal.id)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }

  getGoalPercentage(goal: Objetivo): number {
    if (goal.amount <= 0) return 0;
    return this.getGoalProgress(goal) / goal.amount;
  }

  getGoalPercentageLabel(goal: Objetivo): string {
    const pct = this.getGoalPercentage(goal) * 100;
    return `${Math.round(pct)}%`;
  }

  private initForms() {
    this.objetivoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      description: ['', [Validators.required, Validators.maxLength(200)]],
      categoryId: ['', [Validators.required]],
      typeId: ['', [Validators.required]],
      periodicityId: ['', [Validators.required]],
      amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
      unitId: ['', [Validators.required]],
      startDate: [''],
      endDate: ['']
    });

    // Escuchar el cambio en la periodicidad para ajustar dinámicamente las validaciones de fecha
    this.subscriptions.add(
      this.objetivoForm.get('periodicityId')?.valueChanges.subscribe(value => {
        this.onPeriodicityChange(value);
      })
    );

    this.avisoForm = this.fb.group({
      avisoName: ['', [Validators.required, Validators.maxLength(50)]],
      avisoDescription: ['', [Validators.required, Validators.maxLength(150)]],
      avisoPercentage: [null as number | null, [Validators.required, Validators.min(1), Validators.max(100)]]
    });
  }

  private onPeriodicityChange(periodicityId: string) {
    const periodicity = this.getPeriodicity(periodicityId);
    const startCtrl = this.objetivoForm.get('startDate');
    const endCtrl = this.objetivoForm.get('endDate');

    if (periodicity?.code === 'PER-OBJ-0003') { // Rango de fechas
      startCtrl?.setValidators([Validators.required]);
      endCtrl?.setValidators([Validators.required]);
    } else {
      startCtrl?.clearValidators();
      endCtrl?.clearValidators();
      startCtrl?.setValue('');
      endCtrl?.setValue('');
    }

    startCtrl?.updateValueAndValidity();
    endCtrl?.updateValueAndValidity();
  }

  // --- Mapeos Auxiliares para UI ---
  
  getCategory(id: string): Category | undefined {
    return this.categories.find(c => c.id === id);
  }

  getTipo(id: string): TipoObjetivo | undefined {
    return this.tiposObjetivos.find(t => t.id === id);
  }

  getPeriodicity(id: string): Periodicity | undefined {
    return this.periodicidades.find(p => p.id === id);
  }

  getUnit(id: string): AmountUnit | undefined {
    return this.unidadesMonto.find(u => u.id === id);
  }

  // Formateador de fechas para inputs de HTML
  formatDateForInput(date?: Date): string {
    if (!date) return '';
    const d = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();
    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  }

  isDateRangeInvalid(): boolean {
    const periodicity = this.getPeriodicity(this.objetivoForm.get('periodicityId')?.value);
    if (periodicity?.code !== 'PER-OBJ-0003') return false;

    const startVal = this.objetivoForm.get('startDate')?.value;
    const endVal = this.objetivoForm.get('endDate')?.value;
    if (!startVal || !endVal) return false;

    const start = new Date(startVal + 'T00:00:00');
    const end = new Date(endVal + 'T00:00:00');
    return end < start;
  }

  // --- Gestión de Avisos Temporales ---

  isAvisoNameDuplicate(): boolean {
    const name = this.avisoForm.get('avisoName')?.value;
    if (!name) return false;
    const cleanName = name.trim().toLowerCase();
    return this.tempAlerts.some((a, idx) => 
      a.name.trim().toLowerCase() === cleanName && 
      (this.editingAvisoIndex === null || idx !== this.editingAvisoIndex)
    );
  }

  isAvisoPercentageDuplicate(): boolean {
    const percentage = this.avisoForm.get('avisoPercentage')?.value;
    if (percentage === null || percentage === undefined) return false;
    const decimalPct = percentage / 100;
    return this.tempAlerts.some((a, idx) => 
      Math.abs(a.percentage - decimalPct) < 0.0001 && 
      (this.editingAvisoIndex === null || idx !== this.editingAvisoIndex)
    );
  }

  addOrUpdateAviso() {
    if (this.avisoForm.invalid || this.isAvisoNameDuplicate() || this.isAvisoPercentageDuplicate()) {
      return;
    }

    const formVal = this.avisoForm.value;
    const nuevoAviso: Aviso = {
      name: formVal.avisoName.trim(),
      description: formVal.avisoDescription.trim(),
      percentage: formVal.avisoPercentage / 100
    };

    if (this.editingAvisoIndex !== null) {
      this.tempAlerts[this.editingAvisoIndex] = nuevoAviso;
      this.editingAvisoIndex = null;
    } else {
      this.tempAlerts.push(nuevoAviso);
    }

    this.avisoForm.reset();
  }

  editAviso(index: number) {
    this.editingAvisoIndex = index;
    const aviso = this.tempAlerts[index];
    this.avisoForm.setValue({
      avisoName: aviso.name,
      avisoDescription: aviso.description,
      avisoPercentage: Math.round(aviso.percentage * 100)
    });
  }

  cancelEditAviso() {
    this.editingAvisoIndex = null;
    this.avisoForm.reset();
  }

  deleteAviso(index: number) {
    this.tempAlerts.splice(index, 1);
    if (this.editingAvisoIndex === index) {
      this.cancelEditAviso();
    } else if (this.editingAvisoIndex !== null && this.editingAvisoIndex > index) {
      this.editingAvisoIndex--;
    }
  }

  // --- Modal Principal de Objetivos ---

  openAddModal() {
    this.editingObjetivo = null;
    this.tempAlerts = [];
    this.editingAvisoIndex = null;
    this.objetivoForm.reset({
      name: '',
      description: '',
      categoryId: '',
      typeId: '',
      periodicityId: '',
      amount: null,
      unitId: '',
      startDate: '',
      endDate: ''
    });
    this.avisoForm.reset();
    this.isModalOpen = true;
  }

  openEditModal(obj: Objetivo) {
    this.editingObjetivo = obj;
    this.tempAlerts = [...obj.alerts];
    this.editingAvisoIndex = null;
    this.objetivoForm.setValue({
      name: obj.name,
      description: obj.description,
      categoryId: obj.categoryId,
      typeId: obj.typeId,
      periodicityId: obj.periodicityId,
      amount: obj.amount,
      unitId: obj.unitId,
      startDate: this.formatDateForInput(obj.startDate),
      endDate: this.formatDateForInput(obj.endDate)
    });
    this.avisoForm.reset();
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  onModalDismiss() {
    this.isModalOpen = false;
  }

  // --- Guardar Objetivo ---

  async saveObjetivo() {
    if (this.objetivoForm.invalid || this.isDateRangeInvalid()) return;

    const formVal = this.objetivoForm.value;
    const periodicity = this.getPeriodicity(formVal.periodicityId);
    
    // Preparar fechas según periodicidad
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    if (periodicity?.code === 'PER-OBJ-0003') {
      startDate = new Date(formVal.startDate + 'T00:00:00');
      endDate = new Date(formVal.endDate + 'T00:00:00');
    }

    const objetivoData: Omit<Objetivo, 'id' | 'active'> = {
      name: formVal.name.trim(),
      description: formVal.description.trim(),
      categoryId: formVal.categoryId,
      typeId: formVal.typeId,
      periodicityId: formVal.periodicityId,
      amount: Number(formVal.amount),
      unitId: formVal.unitId,
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      alerts: this.tempAlerts
    };

    try {
      if (this.editingObjetivo && this.editingObjetivo.id) {
        await this.objetivoService.updateObjetivo(this.editingObjetivo.id, objetivoData);
      } else {
        await this.objetivoService.addObjetivo(objetivoData);
      }
      this.closeModal();
    } catch (err) {
      console.error('Error al guardar el objetivo:', err);
    }
  }

  // --- Confirmar Eliminación ---

  async confirmDelete(event: Event, obj: Objetivo) {
    event.stopPropagation();
    if (!obj.id) return;

    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de que deseas eliminar el objetivo financiero "${obj.name}"?`,
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
              await this.objetivoService.deleteObjetivo(obj.id!);
            } catch (err) {
              console.error('Error al eliminar el objetivo:', err);
            }
          }
        }
      ]
    });

    await alert.present();
  }
}
