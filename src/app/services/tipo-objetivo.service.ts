import { Injectable } from '@angular/core';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  onSnapshot,
  Firestore,
  getDocs
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { TipoObjetivo } from '../models/tipo-objetivo.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TipoObjetivoService {
  private collectionName = 'tipos-objetivos';

  constructor(private firebaseService: FirebaseService) {}

  private get db(): Firestore {
    const db = this.firebaseService.getDb();
    if (!db) {
      throw new Error('Firebase Firestore not initialized');
    }
    return db;
  }

  getTiposObjetivos(): Observable<TipoObjetivo[]> {
    return new Observable<TipoObjetivo[]>((subscriber) => {
      try {
        const typesRef = collection(this.db, this.collectionName);
        const q = query(
          typesRef, 
          where('active', '==', true)
        );

        const toDateSafe = (val: any): Date | undefined => {
          if (!val) return undefined;
          if (typeof val.toDate === 'function') return val.toDate();
          if (val instanceof Date) return val;
          if (val.seconds !== undefined) return new Date(val.seconds * 1000);
          return new Date(val);
        };

        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
          const types: TipoObjetivo[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            types.push({
              id: doc.id,
              name: data['name'],
              description: data['description'],
              code: data['code'],
              active: data['active'],
              createdAt: toDateSafe(data['createdAt']),
              updatedAt: toDateSafe(data['updatedAt'])
            });
          });

          if (types.length === 0) {
            try {
              const allDocsSnap = await getDocs(collection(this.db, this.collectionName));
              if (allDocsSnap.empty) {
                await this.seedDefaultTypes();
              }
            } catch (e) {
              console.error('Error al inicializar tipos de objetivos:', e);
            }
          }
          
          types.sort((a, b) => a.name.localeCompare(b.name));
          subscriber.next(types);
        }, (error) => {
          subscriber.error(error);
        });

        return () => unsubscribe();
      } catch (error) {
        subscriber.error(error);
        return;
      }
    });
  }

  private async seedDefaultTypes(): Promise<void> {
    const defaultTypes = [
      {
        name: 'Aumentar',
        description: 'En este tipo, cuanto mayores son los registros financieros es mejor',
        code: 'TIP-OBJ-0001',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Reducir',
        description: 'En este tipo, cuanto menores son los registros financieros es mejor',
        code: 'TIP-OBJ-0002',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const typesRef = collection(this.db, this.collectionName);
    for (const t of defaultTypes) {
      await addDoc(typesRef, t);
    }
    console.log('Tipos de objetivos por defecto insertados con éxito.');
  }

  async addTipoObjetivo(tipo: Omit<TipoObjetivo, 'id' | 'active'>): Promise<string> {
    const ref = collection(this.db, this.collectionName);
    const newTipo = {
      ...tipo,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const docRef = await addDoc(ref, newTipo);
    return docRef.id;
  }
}
