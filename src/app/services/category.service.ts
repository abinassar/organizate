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
import { Category } from '../models/category.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private collectionName = 'categories';

  constructor(private firebaseService: FirebaseService) {}

  private get db(): Firestore {
    const db = this.firebaseService.getDb();
    if (!db) {
      throw new Error('Firebase Firestore not initialized');
    }
    return db;
  }

  getCategories(): Observable<Category[]> {
    return new Observable<Category[]>((subscriber) => {
      try {
        const categoriesRef = collection(this.db, this.collectionName);
        const q = query(
          categoriesRef, 
          where('active', '==', true)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const categories: Category[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            categories.push({
              id: doc.id,
              name: data['name'],
              description: data['description'],
              color: data['color'],
              icon: data['icon'],
              active: data['active'],
              createdAt: data['createdAt']?.toDate(),
              updatedAt: data['updatedAt']?.toDate()
            });
          });
          
          // Client-side alphabetical sorting to avoid needing a Firestore composite index
          categories.sort((a, b) => a.name.localeCompare(b.name));
          subscriber.next(categories);
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

  async addCategory(category: Omit<Category, 'id' | 'active'>): Promise<string> {
    const categoriesRef = collection(this.db, this.collectionName);
    const newCategory = {
      ...category,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const docRef = await addDoc(categoriesRef, newCategory);
    return docRef.id;
  }

  async updateCategory(id: string, category: Partial<Omit<Category, 'id'>>): Promise<void> {
    const docRef = doc(this.db, this.collectionName, id);
    await updateDoc(docRef, {
      ...category,
      updatedAt: new Date()
    });
  }

  async deleteCategory(id: string): Promise<void> {
    const docRef = doc(this.db, this.collectionName, id);
    await updateDoc(docRef, {
      active: false,
      updatedAt: new Date()
    });
  }
}
