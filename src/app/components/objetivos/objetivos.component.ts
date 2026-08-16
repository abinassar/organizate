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
  folderOpenOutline
} from 'ionicons/icons';
import { Subscription, forkJoin } from 'rxjs';
import { CategoryService } from '../../services/category.service';
import { TipoObjetivoService } from '../../services/tipo-objetivo.service';
import { ObjetivoService } from '../../services/objetivo.service';
import { Category } from '../../models/category.model';
import { TipoObjetivo } from '../../models/tipo-objetivo.model';
import { Objetivo, Aviso } from '../..//models/objetivo.model';

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
    IonSelectOption
  ]
})
export class ObjetivosComponent implements OnInit, OnDestroy {
  objetivos: Objetivo[] = [];
  categories: Category[] = [];
  tiposObjetivos: TipoObjetivo[] = [];
  
  isLoading = true;
  isModalOpen = false;
  editingObjetivo: Objetivo | null = null;
  
  objetivoForm!: FormGroup;
  avisoForm!: FormGroup;
  
  // Lista temporal de avisos del objetivo actual en edición/creación
  tempAlerts: Aviso[] = [];
  editingAvisoIndex: number | null = null;

  private subscriptions: Subscription = new Subscription();
  
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private tipoObjetivoService = inject(TipoObjetivoService);
  private objetivoService = inject(ObjetivoService);
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
      folderOpenOutline
    });
    
    this.initForms();
  }

  ngOnInit() {
    // Escuchar cambios de Firestore para Categorías, Tipos de Objetivos y Objetivos
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
      this.objetivoService.getObjetivos().subscribe({
        next: (objs) => {
          this.objetivos = objs;
          this.checkLoadingState();
        },
        error: (err) => console.error('Error al cargar objetivos:', err)
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private checkLoadingState() {
    // Dejar de mostrar spinner una vez cargadas las tres colecciones
    if (this.categories !== undefined && this.tiposObjetivos !== undefined && this.objetivos !== undefined) {
      // Pequeña espera para evitar parpadeos bruscos
      setTimeout(() => {
        this.isLoading = false;
      }, 300);
    }
  }

  private initForms() {
    this.objetivoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      description: ['', [Validators.required, Validators.maxLength(200)]],
      categoryId: ['', [Validators.required]],
      typeId: ['', [Validators.required]]
    });

    this.avisoForm = this.fb.group({
      avisoName: ['', [Validators.required, Validators.maxLength(50)]],
      avisoDescription: ['', [Validators.required, Validators.maxLength(150)]],
      avisoPercentage: [null as number | null, [Validators.required, Validators.min(1), Validators.max(100)]]
    });
  }

  // --- Mapeos Auxiliares para UI ---
  
  getCategory(id: string): Category | undefined {
    return this.categories.find(c => c.id === id);
  }

  getTipo(id: string): TipoObjetivo | undefined {
    return this.tiposObjetivos.find(t => t.id === id);
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
      percentage: formVal.avisoPercentage / 100 // Convertir a decimal antes de guardarlo
    };

    if (this.editingAvisoIndex !== null) {
      // Modo Edición
      this.tempAlerts[this.editingAvisoIndex] = nuevoAviso;
      this.editingAvisoIndex = null;
    } else {
      // Modo Creación
      this.tempAlerts.push(nuevoAviso);
    }

    // Resetear formulario de avisos
    this.avisoForm.reset();
  }

  editAviso(index: number) {
    this.editingAvisoIndex = index;
    const aviso = this.tempAlerts[index];
    this.avisoForm.setValue({
      avisoName: aviso.name,
      avisoDescription: aviso.description,
      avisoPercentage: Math.round(aviso.percentage * 100) // Convertir a 1-100 para UI
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
      typeId: ''
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
      typeId: obj.typeId
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
    if (this.objetivoForm.invalid) return;

    const formVal = this.objetivoForm.value;
    const objetivoData = {
      name: formVal.name.trim(),
      description: formVal.description.trim(),
      categoryId: formVal.categoryId,
      typeId: formVal.typeId,
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
    event.stopPropagation(); // Evitar abrir modal de edición
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
