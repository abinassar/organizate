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
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  swapHorizontal, 
  addOutline, 
  pencilOutline, 
  trashOutline, 
  closeOutline, 
  checkmarkOutline, 
  alertCircleOutline, 
  trendingUpOutline, 
  trendingDownOutline, 
  helpCircleOutline, 
  folderOpenOutline,
  informationCircleOutline
} from 'ionicons/icons';
import { Subscription, combineLatest } from 'rxjs';
import { ObjetivoService } from '../../services/objetivo.service';
import { EsquemaFinancieroService } from '../../services/esquema-financiero.service';
import { TransaccionService } from '../../services/transaccion.service';
import { AmountUnitService } from '../../services/amount-unit.service';
import { Objetivo } from '../../models/objetivo.model';
import { EsquemaFinanciero, EsquemaObjetivoConfig } from '../../models/esquema-financiero.model';
import { Transaccion } from '../../models/transaccion.model';
import { AmountUnit } from '../../models/amount-unit.model';

@Component({
  selector: 'app-esquemas-financieros',
  templateUrl: './esquemas-financieros.component.html',
  styleUrls: ['./esquemas-financieros.component.scss'],
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
    IonSelectOption
  ]
})
export class EsquemasFinancierosComponent implements OnInit, OnDestroy {
  esquemas: EsquemaFinanciero[] = [];
  objetivos: Objetivo[] = [];
  transacciones: Transaccion[] = [];
  unidadesMonto: AmountUnit[] = [];

  isLoading = true;
  isModalOpen = false;
  editingEsquema: EsquemaFinanciero | null = null;

  esquemaForm!: FormGroup;
  configForm!: FormGroup;

  tempConfigs: EsquemaObjetivoConfig[] = [];

  private subscriptions = new Subscription();

  private fb = inject(FormBuilder);
  private esquemaService = inject(EsquemaFinancieroService);
  private objetivoService = inject(ObjetivoService);
  private transaccionService = inject(TransaccionService);
  private amountUnitService = inject(AmountUnitService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  constructor() {
    addIcons({
      swapHorizontal,
      addOutline,
      pencilOutline,
      trashOutline,
      closeOutline,
      checkmarkOutline,
      alertCircleOutline,
      trendingUpOutline,
      trendingDownOutline,
      helpCircleOutline,
      folderOpenOutline,
      informationCircleOutline
    });

    this.initForms();
  }

  ngOnInit() {
    this.subscriptions.add(
      combineLatest([
        this.esquemaService.getEsquemasFinancieros(),
        this.objetivoService.getObjetivos(),
        this.transaccionService.getTransacciones(),
        this.amountUnitService.getAmountUnits()
      ]).subscribe({
        next: ([esq, objs, txs, units]) => {
          this.esquemas = esq;
          this.objetivos = objs;
          this.transacciones = txs;
          this.unidadesMonto = units;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error al cargar datos en Esquemas Financieros:', err);
          this.isLoading = false;
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private initForms() {
    this.esquemaForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      description: ['', [Validators.required, Validators.maxLength(200)]]
    });

    this.configForm = this.fb.group({
      objetivoId: ['', [Validators.required]],
      operator: ['sum', [Validators.required]]
    });
  }

  // --- Helpers de UI ---

  getObjetivoName(objetivoId: string): string {
    const obj = this.objetivos.find(o => o.id === objetivoId);
    return obj ? obj.name : 'Desconocido';
  }

  getUnitName(unitId: string): string {
    const unit = this.unidadesMonto.find(u => u.id === unitId);
    return unit ? unit.name : '';
  }

  getObjetivoUnitName(objetivoId: string): string {
    const obj = this.objetivos.find(o => o.id === objetivoId);
    return obj ? this.getUnitName(obj.unitId) : '';
  }

  getEsquemaCurrency(configs: EsquemaObjetivoConfig[]): string {
    if (!configs || configs.length === 0) return 'Sin moneda';
    const firstConfig = configs[0];
    return this.getObjetivoUnitName(firstConfig.objetivoId);
  }

  // --- Configuración de Objetivos Temporales (Modal) ---

  async addConfigItem() {
    if (this.configForm.invalid) return;

    const { objetivoId, operator } = this.configForm.value;

    // 1. Validar que no esté duplicado
    if (this.tempConfigs.some(c => c.objetivoId === objetivoId)) {
      this.showToast('Este objetivo financiero ya está en la lista del esquema.', 'warning');
      return;
    }

    const selectedObj = this.objetivos.find(o => o.id === objetivoId);
    if (!selectedObj) return;

    // 2. Validar que comparta la misma moneda que los demás objetivos del esquema
    if (this.tempConfigs.length > 0) {
      const firstConfig = this.tempConfigs[0];
      const firstObj = this.objetivos.find(o => o.id === firstConfig.objetivoId);

      if (firstObj && selectedObj.unitId !== firstObj.unitId) {
        const expectedCurrency = this.getUnitName(firstObj.unitId);
        const actualCurrency = this.getUnitName(selectedObj.unitId);
        this.showToast(
          `No se puede agregar. El objetivo seleccionado usa ${actualCurrency}, pero el esquema está configurado en ${expectedCurrency}. Todos los objetivos deben usar la misma moneda.`,
          'danger'
        );
        return;
      }
    }

    // 3. Agregar
    this.tempConfigs.push({ objetivoId, operator });
    this.configForm.reset({ objetivoId: '', operator: 'sum' });
  }

  removeConfigItem(index: number) {
    this.tempConfigs.splice(index, 1);
  }

  // --- Modal ---

  openAddModal() {
    this.editingEsquema = null;
    this.tempConfigs = [];
    this.esquemaForm.reset({
      name: '',
      description: ''
    });
    this.configForm.reset({
      objetivoId: '',
      operator: 'sum'
    });
    this.isModalOpen = true;
  }

  openEditModal(esquema: EsquemaFinanciero) {
    this.editingEsquema = esquema;
    this.tempConfigs = [...esquema.configs];
    this.esquemaForm.setValue({
      name: esquema.name,
      description: esquema.description
    });
    this.configForm.reset({
      objetivoId: '',
      operator: 'sum'
    });
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  // --- Guardar Esquema ---

  async saveEsquema() {
    if (this.esquemaForm.invalid) return;

    if (this.tempConfigs.length === 0) {
      this.showToast('Debes asociar al menos un objetivo financiero en el esquema.', 'warning');
      return;
    }

    const formVal = this.esquemaForm.value;
    const esquemaData: Omit<EsquemaFinanciero, 'id' | 'active'> = {
      name: formVal.name.trim(),
      description: formVal.description.trim(),
      configs: this.tempConfigs
    };

    try {
      if (this.editingEsquema && this.editingEsquema.id) {
        await this.esquemaService.updateEsquemaFinanciero(this.editingEsquema.id, esquemaData);
        this.showToast('Esquema financiero actualizado con éxito.', 'success');
      } else {
        await this.esquemaService.addEsquemaFinanciero(esquemaData);
        this.showToast('Esquema financiero creado con éxito.', 'success');
      }
      this.closeModal();
    } catch (err) {
      console.error('Error al guardar esquema financiero:', err);
      this.showToast('Ocurrió un error al guardar el esquema financiero.', 'danger');
    }
  }

  // --- Eliminar Esquema con Validación ---

  async confirmDelete(event: Event, esquema: EsquemaFinanciero) {
    event.stopPropagation();
    if (!esquema.id) return;

    // VALIDACIÓN: No permitir eliminar si alguno de los objetivos asociados tiene transacciones
    const idsObjetivosAsociados = esquema.configs.map(c => c.objetivoId);
    const tieneTransacciones = this.transacciones.some(tx => 
      tx.active && idsObjetivosAsociados.includes(tx.objetivoId)
    );

    if (tieneTransacciones) {
      const alertError = await this.alertController.create({
        header: 'Acción Bloqueada',
        message: 'No puedes eliminar este esquema financiero porque tiene transacciones registradas en sus objetivos asociados. Elimina las transacciones primero.',
        buttons: ['Entendido']
      });
      await alertError.present();
      return;
    }

    // Si pasa la validación, confirmar eliminación
    const alertConfirm = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de que deseas eliminar el esquema financiero "${esquema.name}"?`,
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
              await this.esquemaService.deleteEsquemaFinanciero(esquema.id!);
              this.showToast('Esquema financiero eliminado con éxito.', 'success');
            } catch (err) {
              console.error('Error al eliminar esquema financiero:', err);
              this.showToast('Error al eliminar el esquema financiero.', 'danger');
            }
          }
        }
      ]
    });

    await alertConfirm.present();
  }

  // --- Notificación Toast ---

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 3500,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
