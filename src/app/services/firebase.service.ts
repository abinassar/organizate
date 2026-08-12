import { Injectable } from '@angular/core';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  Firestore, 
  enableNetwork, 
  disableNetwork, 
  doc, 
  getDocFromServer 
} from 'firebase/firestore';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private firestore!: Firestore;
  private isFirebaseInitialized = false;

  constructor() {
    this.initFirebase();
  }

  private initFirebase() {
    try {
      // Verificar si las variables de entorno para Firebase están configuradas correctamente
      if (!environment.firebase || environment.firebase.apiKey === 'YOUR_API_KEY') {
        console.warn('Firebase: Las variables de entorno no están configuradas. Por favor agrega tus credenciales en environment.ts');
        return;
      }

      let app;
      if (!getApps().length) {
        app = initializeApp(environment.firebase);
      } else {
        app = getApp();
      }

      // Inicializar Firestore con soporte para persistencia multi-pestaña
      this.firestore = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });

      this.isFirebaseInitialized = true;
      console.log('Firebase y Firestore inicializados correctamente con soporte offline.');
    } catch (error) {
      console.error('Error al inicializar Firebase:', error);
    }
  }

  /**
   * Obtiene la instancia activa de Firestore.
   */
  getDb(): Firestore | null {
    return this.isFirebaseInitialized ? this.firestore : null;
  }

  /**
   * Verifica si la conexión con los servidores de Firebase está activa.
   * Intenta forzar una consulta al servidor para una ruta de prueba.
   */
  async checkConnection(): Promise<boolean> {
    if (!this.isFirebaseInitialized) {
      return false;
    }

    if (!navigator.onLine) {
      return false;
    }

    try {
      // Intentamos consultar un documento ficticio forzando el servidor
      const testDocRef = doc(this.firestore, '_firebase_connection_test_/ping');
      await getDocFromServer(testDocRef);
      // Si la llamada no lanza error, significa que hubo comunicación
      return true;
    } catch (error: any) {
      // Si el error es 'permission-denied' o 'not-found', significa que el servidor de Firebase
      // respondió (por lo tanto, hay conexión).
      // Si es 'unavailable' o error de red, no se pudo establecer conexión.
      if (error && (error.code === 'permission-denied' || error.code === 'not-found')) {
        return true;
      }
      console.warn('Error al verificar conexión con Firebase:', error);
      return false;
    }
  }

  /**
   * Simula desconexión de red en el SDK de Firebase (deshabilita sincronización con el servidor).
   */
  async disableNetwork(): Promise<void> {
    if (this.isFirebaseInitialized && this.firestore) {
      await disableNetwork(this.firestore);
      console.log('Red de Firestore desactivada (Modo Offline simulado).');
    }
  }

  /**
   * Restablece la red en el SDK de Firebase.
   */
  async enableNetwork(): Promise<void> {
    if (this.isFirebaseInitialized && this.firestore) {
      await enableNetwork(this.firestore);
      console.log('Red de Firestore reactivada.');
    }
  }

  /**
   * Retorna si Firebase fue inicializado correctamente.
   */
  isInitialized(): boolean {
    return this.isFirebaseInitialized;
  }
}
