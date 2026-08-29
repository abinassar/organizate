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
import { Transaccion } from '../models/transaccion.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TransaccionService {
  private collectionName = 'transacciones-financieras';

  constructor(private firebaseService: FirebaseService) {}

  private get db(): Firestore {
    const db = this.firebaseService.getDb();
    if (!db) {
      throw new Error('Firebase Firestore not initialized');
    }
    return db;
  }

  getTransacciones(): Observable<Transaccion[]> {
    return new Observable<Transaccion[]>((subscriber) => {
      try {
        const transRef = collection(this.db, this.collectionName);
        const q = query(
          transRef, 
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
          const transacciones: Transaccion[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            transacciones.push({
              id: doc.id,
              operationId: data['operationId'],
              objetivoId: data['objetivoId'],
              categoryId: data['categoryId'] || '',
              amount: data['amount'] || 0,
              currency: data['currency'] || '',
              description: data['description'] || '',
              active: data['active'],
              createdAt: toDateSafe(data['createdAt']),
              updatedAt: toDateSafe(data['updatedAt'])
            });
          });
          
          // Ordenar por fecha descendente
          transacciones.sort((a, b) => {
            const dateA = a.createdAt ? a.createdAt.getTime() : 0;
            const dateB = b.createdAt ? b.createdAt.getTime() : 0;
            return dateB - dateA;
          });
          
          subscriber.next(transacciones);
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

  async addTransaccion(transaccion: Omit<Transaccion, 'id' | 'active'>): Promise<string> {
    const ref = collection(this.db, this.collectionName);
    const newTrans = {
      ...transaccion,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const docRef = await addDoc(ref, newTrans);
    return docRef.id;
  }

  async updateTransaccion(id: string, transaccion: Partial<Omit<Transaccion, 'id'>>): Promise<void> {
    const docRef = doc(this.db, this.collectionName, id);
    await updateDoc(docRef, {
      ...transaccion,
      updatedAt: new Date()
    });
  }

  async deleteTransaccion(id: string): Promise<void> {
    const docRef = doc(this.db, this.collectionName, id);
    await updateDoc(docRef, {
      active: false,
      updatedAt: new Date()
    });
  }
}
