import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
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
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  pricetagsOutline, 
  addOutline, 
  pencilOutline, 
  trashOutline, 
  colorPaletteOutline,
  closeOutline,
  checkmarkOutline,
  pricetagOutline,
  cartOutline,
  fastFoodOutline,
  carOutline,
  homeOutline,
  walletOutline,
  cashOutline,
  bookOutline,
  heartOutline,
  barbellOutline,
  briefcaseOutline,
  filmOutline,
  giftOutline,
  schoolOutline,
  airplaneOutline,
  buildOutline,
  gameControllerOutline,
  pawOutline,
  cafeOutline,
  shirtOutline
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/category.model';

@Component({
  selector: 'app-categorias',
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.scss'],
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
    IonNote
  ]
})
export class CategoriasComponent implements OnInit, OnDestroy {
  categories: Category[] = [];
  isLoading = true;
  isModalOpen = false;
  editingCategory: Category | null = null;
  categoryForm!: FormGroup;
  
  presetColors: string[] = [
    '#10b981', // Emerald Green
    '#3b82f6', // Blue
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#ef4444', // Red/Coral
    '#f59e0b', // Amber/Orange
    '#14b8a6', // Teal
    '#6366f1', // Indigo
    '#64748b'  // Slate Grey
  ];

  presetIcons: string[] = [
    'pricetag-outline',
    'cart-outline',
    'fast-food-outline',
    'car-outline',
    'home-outline',
    'wallet-outline',
    'cash-outline',
    'book-outline',
    'heart-outline',
    'barbell-outline',
    'briefcase-outline',
    'film-outline',
    'gift-outline',
    'school-outline',
    'airplane-outline',
    'build-outline',
    'game-controller-outline',
    'paw-outline',
    'cafe-outline',
    'shirt-outline'
  ];

  selectedColor = '#10b981';
  selectedIcon = 'pricetag-outline';

  private subscription!: Subscription;
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private alertController = inject(AlertController);

  constructor() {
    addIcons({
      pricetagsOutline,
      addOutline,
      pencilOutline,
      trashOutline,
      colorPaletteOutline,
      closeOutline,
      checkmarkOutline,
      pricetagOutline,
      cartOutline,
      fastFoodOutline,
      carOutline,
      homeOutline,
      walletOutline,
      cashOutline,
      bookOutline,
      heartOutline,
      barbellOutline,
      briefcaseOutline,
      filmOutline,
      giftOutline,
      schoolOutline,
      airplaneOutline,
      buildOutline,
      gameControllerOutline,
      pawOutline,
      cafeOutline,
      shirtOutline
    });
    
    this.initForm();
  }

  ngOnInit() {
    this.subscription = this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private initForm() {
    this.categoryForm = this.fb.group({
      name: ['', [
        Validators.required, 
        Validators.minLength(2), 
        Validators.maxLength(30),
        this.duplicateNameValidator()
      ]],
      description: ['', [Validators.maxLength(100)]]
    });
  }

  duplicateNameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const name = control.value.trim().toLowerCase();
      
      // Validar si existe duplicado entre las categorías cargadas en memoria, omitiendo la que se edita
      const isDuplicate = this.categories.some(cat => 
        cat.name.trim().toLowerCase() === name && 
        (!this.editingCategory || cat.id !== this.editingCategory.id)
      );
      
      return isDuplicate ? { duplicateName: true } : null;
    };
  }

  openAddModal() {
    this.editingCategory = null;
    this.selectedColor = this.presetColors[0];
    this.selectedIcon = this.presetIcons[0];
    this.categoryForm.reset({
      name: '',
      description: ''
    });
    this.isModalOpen = true;
  }

  openEditModal(category: Category) {
    this.editingCategory = category;
    this.selectedColor = category.color;
    this.selectedIcon = category.icon;
    this.categoryForm.setValue({
      name: category.name,
      description: category.description || ''
    });
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  onModalDismiss() {
    this.isModalOpen = false;
  }

  selectColor(color: string) {
    this.selectedColor = color;
  }

  onCustomColorChange(event: any) {
    if (event.target && event.target.value) {
      this.selectedColor = event.target.value;
    }
  }

  selectIcon(icon: string) {
    this.selectedIcon = icon;
  }

  async saveCategory() {
    if (this.categoryForm.invalid) return;

    const formVal = this.categoryForm.value;
    const categoryData = {
      name: formVal.name.trim(),
      description: formVal.description ? formVal.description.trim() : '',
      color: this.selectedColor,
      icon: this.selectedIcon
    };

    try {
      if (this.editingCategory && this.editingCategory.id) {
        await this.categoryService.updateCategory(this.editingCategory.id, categoryData);
      } else {
        await this.categoryService.addCategory(categoryData);
      }
      this.closeModal();
    } catch (err) {
      console.error('Error al guardar la categoría:', err);
    }
  }

  async confirmDelete(event: Event, category: Category) {
    event.stopPropagation(); // Evitar abrir el modal de edición
    
    if (!category.id) return;

    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de que deseas eliminar la categoría "${category.name}"?`,
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
              await this.categoryService.deleteCategory(category.id!);
            } catch (err) {
              console.error('Error al eliminar la categoría:', err);
            }
          }
        }
      ]
    });

    await alert.present();
  }
}
