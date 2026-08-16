import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { ConfiguracionComponent } from '../components/configuracion/configuracion.component';
import { CategoriasComponent } from '../components/categorias/categorias.component';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, ConfiguracionComponent, CategoriasComponent],
})
export class Tab3Page {
  constructor() {}
}

