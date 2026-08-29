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
import { Objetivo } from '../models/objetivo.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ObjetivoService {
  private collectionName = 'objetivos-financieros';

  constructor(private firebaseService: FirebaseService) {}

  private get db(): Firestore {
    const db = this.firebaseService.getDb();
    if (!db) {
      throw new Error('Firebase Firestore not initialized');
    }
    return db;
  }

  getObjetivos(): Observable<Objetivo[]> {
    return new Observable<Objetivo[]>((subscriber) => {
      try {
        const objetivosRef = collection(this.db, this.collectionName);
        const q = query(
          objetivosRef, 
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
          const objetivos: Objetivo[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            objetivos.push({
              id: doc.id,
              name: data['name'],
              description: data['description'],
              typeId: data['typeId'],
              periodicityId: data['periodicityId'] || '',
              amount: data['amount'] || 0,
              unitId: data['unitId'] || '',
              startDate: toDateSafe(data['startDate']),
              endDate: toDateSafe(data['endDate']),
              alerts: data['alerts'] || [],
              active: data['active'],
              createdAt: toDateSafe(data['createdAt']),
              updatedAt: toDateSafe(data['updatedAt'])
            });
          });
          
          objetivos.sort((a, b) => a.name.localeCompare(b.name));
          subscriber.next(objetivos);
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

  async addObjetivo(objetivo: Omit<Objetivo, 'id' | 'active'>): Promise<string> {
    const ref = collection(this.db, this.collectionName);
    const newObjetivo = {
      ...objetivo,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const docRef = await addDoc(ref, newObjetivo);
    return docRef.id;
  }

  async updateObjetivo(id: string, objetivo: Partial<Omit<Objetivo, 'id'>>): Promise<void> {
    const docRef = doc(this.db, this.collectionName, id);
    await updateDoc(docRef, {
      ...objetivo,
      updatedAt: new Date()
    });
  }

  async deleteObjetivo(id: string): Promise<void> {
    const docRef = doc(this.db, this.collectionName, id);
    await updateDoc(docRef, {
      active: false,
      updatedAt: new Date()
    });
  }
}
