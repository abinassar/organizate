import { Injectable } from '@angular/core';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot,
  Firestore,
  getDocs
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { AmountUnit } from '../models/amount-unit.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AmountUnitService {
  private collectionName = 'unidades-monto';

  constructor(private firebaseService: FirebaseService) {}

  private get db(): Firestore {
    const db = this.firebaseService.getDb();
    if (!db) {
      throw new Error('Firebase Firestore not initialized');
    }
    return db;
  }

  getAmountUnits(): Observable<AmountUnit[]> {
    return new Observable<AmountUnit[]>((subscriber) => {
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

        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
          const units: AmountUnit[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            units.push({
              id: doc.id,
              name: data['name'],
              code: data['code'],
              active: data['active'],
              createdAt: toDateSafe(data['createdAt']),
              updatedAt: toDateSafe(data['updatedAt'])
            });
          });

          if (units.length === 0) {
            try {
              const allDocsSnap = await getDocs(collection(this.db, this.collectionName));
              if (allDocsSnap.empty) {
                await this.seedDefaultUnits();
              }
            } catch (e) {
              console.error('Error al inicializar unidades de monto:', e);
            }
          } else {
            // Verificar si falta la unidad de Bolívares (BS)
            const hasBs = units.some(u => u.name.toUpperCase() === 'BS');
            if (!hasBs) {
              try {
                const ref = collection(this.db, this.collectionName);
                await addDoc(ref, {
                  name: 'BS',
                  code: 'UNI-MON-0004',
                  active: true,
                  createdAt: new Date(),
                  updatedAt: new Date()
                });
                console.log('Unidad de monto BS autosembrada con éxito.');
              } catch (e) {
                console.error('Error al sembrar la unidad BS:', e);
              }
            }
          }
          
          // Ordenar por código (USD, USDT, EUR)
          units.sort((a, b) => a.code.localeCompare(b.code));
          subscriber.next(units);
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

  private async seedDefaultUnits(): Promise<void> {
    const defaults = [
      {
        name: 'USD',
        code: 'UNI-MON-0001',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'USDT',
        code: 'UNI-MON-0002',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'EUR',
        code: 'UNI-MON-0003',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'BS',
        code: 'UNI-MON-0004',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const ref = collection(this.db, this.collectionName);
    for (const u of defaults) {
      await addDoc(ref, u);
    }
    console.log('Unidades de monto autosembradas con éxito.');
  }
}
