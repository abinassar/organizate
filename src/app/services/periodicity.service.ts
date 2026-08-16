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
import { Periodicity } from '../models/periodicity.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PeriodicityService {
  private collectionName = 'periodicidades-objetivos';

  constructor(private firebaseService: FirebaseService) {}

  private get db(): Firestore {
    const db = this.firebaseService.getDb();
    if (!db) {
      throw new Error('Firebase Firestore not initialized');
    }
    return db;
  }

  getPeriodicities(): Observable<Periodicity[]> {
    return new Observable<Periodicity[]>((subscriber) => {
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
          const periodicities: Periodicity[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            periodicities.push({
              id: doc.id,
              name: data['name'],
              code: data['code'],
              active: data['active'],
              createdAt: toDateSafe(data['createdAt']),
              updatedAt: toDateSafe(data['updatedAt'])
            });
          });

          if (periodicities.length === 0) {
            try {
              const allDocsSnap = await getDocs(collection(this.db, this.collectionName));
              if (allDocsSnap.empty) {
                await this.seedDefaultPeriodicities();
              }
            } catch (e) {
              console.error('Error al inicializar periodicidades:', e);
            }
          }
          
          // Ordenar por código para mantener un orden consistente (Mensual, Anual, Rango)
          periodicities.sort((a, b) => a.code.localeCompare(b.code));
          subscriber.next(periodicities);
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

  private async seedDefaultPeriodicities(): Promise<void> {
    const defaults = [
      {
        name: 'Mensual',
        code: 'PER-OBJ-0001',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Anual',
        code: 'PER-OBJ-0002',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Rango de fechas',
        code: 'PER-OBJ-0003',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const ref = collection(this.db, this.collectionName);
    for (const p of defaults) {
      await addDoc(ref, p);
    }
    console.log('Periodicidades de objetivos autosembradas con éxito.');
  }
}
