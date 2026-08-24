import { Injectable } from '@angular/core';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  onSnapshot,
  Firestore
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { EsquemaFinanciero } from '../models/esquema-financiero.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EsquemaFinancieroService {
  private collectionName = 'esquemas-financieros';

  constructor(private firebaseService: FirebaseService) {}

  private get db(): Firestore {
    const db = this.firebaseService.getDb();
    if (!db) {
      throw new Error('Firebase Firestore not initialized');
    }
    return db;
  }

  getEsquemasFinancieros(): Observable<EsquemaFinanciero[]> {
    return new Observable<EsquemaFinanciero[]>((subscriber) => {
      try {
        const ref = collection(this.db, this.collectionName);
        const q = query(
          ref, 
          where('active', '==', true)
        );

        const toDateSafe = (val: any): Date | undefined => {
          if (!val) return undefined;
          if (typeof val.toDate === 'function') return val.toDate();
          if (val instanceof Date) return val;
          if (val.seconds !== undefined) return new Date(val.seconds * 1000);
          return new Date(val);
        };

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const esquemas: EsquemaFinanciero[] = [];
          querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            esquemas.push({
              id: docSnapshot.id,
              name: data['name'],
              description: data['description'] || '',
              configs: data['configs'] || [],
              active: data['active'],
              createdAt: toDateSafe(data['createdAt']),
              updatedAt: toDateSafe(data['updatedAt'])
            });
          });
          
          esquemas.sort((a, b) => a.name.localeCompare(b.name));
          subscriber.next(esquemas);
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

  async addEsquemaFinanciero(esquema: Omit<EsquemaFinanciero, 'id' | 'active'>): Promise<string> {
    const ref = collection(this.db, this.collectionName);
    const newEsquema = {
      ...esquema,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const docRef = await addDoc(ref, newEsquema);
    return docRef.id;
  }

  async updateEsquemaFinanciero(id: string, esquema: Partial<Omit<EsquemaFinanciero, 'id'>>): Promise<void> {
    const docRef = doc(this.db, this.collectionName, id);
    await updateDoc(docRef, {
      ...esquema,
      updatedAt: new Date()
    });
  }

  async deleteEsquemaFinanciero(id: string): Promise<void> {
    const docRef = doc(this.db, this.collectionName, id);
    await updateDoc(docRef, {
      active: false,
      updatedAt: new Date()
    });
  }
}
