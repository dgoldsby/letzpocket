import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { firestore, storage } from './firebase';

export class FirebaseService {
  /**
   * Add a document to a collection
   */
  async addDocument<T>(collectionName: string, data: Omit<T, 'id'>): Promise<{ id: string }> {
    const docRef = await addDoc(collection(firestore, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { id: docRef.id };
  }

  /**
   * Get a single document by ID
   */
  async getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
    const docRef = doc(firestore, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as T;
  }

  /**
   * Get documents from a collection with optional queries
   */
  async getDocuments<T>(
    collectionName: string,
    queries?: Array<[string, '==' | 'in' | '>', '<', any]>,
    orderByClause?: [string, 'asc' | 'desc']
  ): Promise<T[]> {
    let q = collection(firestore, collectionName);
    
    // Apply queries
    if (queries) {
      queries.forEach(([field, operator, value]) => {
        q = query(q, where(field, operator, value));
      });
    }
    
    // Apply ordering
    if (orderByClause) {
      q = query(q, orderBy(orderByClause[0], orderByClause[1]));
    }
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as T));
  }

  /**
   * Update a document
   */
  async updateDocument<T>(collectionName: string, docId: string, data: Partial<T>): Promise<void> {
    const docRef = doc(firestore, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Delete a document
   */
  async deleteDocument(collectionName: string, docId: string): Promise<void> {
    const docRef = doc(firestore, collectionName, docId);
    await deleteDoc(docRef);
  }

  /**
   * Upload a file to Firebase Storage
   */
  async uploadFile(filePath: string, file: File): Promise<string> {
    const storageRef = ref(storage, filePath);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  }

  /**
   * Delete a file from Firebase Storage
   */
  async deleteFile(filePath: string): Promise<void> {
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
  }

  /**
   * Query documents with complex conditions
   */
  async queryDocuments<T>(
    collectionName: string,
    conditions: Array<{
      field: string;
      operator: '==' | 'in' | '>' | '<' | '>=' | '<=';
      value: any;
    }>,
    orderByClause?: [string, 'asc' | 'desc'],
    limit?: number
  ): Promise<T[]> {
    let q = query(collection(firestore, collectionName));
    
    // Apply conditions
    conditions.forEach(condition => {
      q = query(q, where(condition.field, condition.operator, condition.value));
    });
    
    // Apply ordering
    if (orderByClause) {
      q = query(q, orderBy(orderByClause[0], orderByClause[1]));
    }
    
    // Apply limit
    if (limit) {
      q = query(q, limit);
    }
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as T));
  }

  /**
   * Batch write operations
   */
  async batchWrite(operations: Array<{
    type: 'add' | 'update' | 'delete';
    collectionName: string;
    data?: any;
    docId?: string;
  }>): Promise<void> {
    // Note: This would need to be implemented with Firestore batch writes
    // For now, we'll execute operations sequentially
    for (const operation of operations) {
      switch (operation.type) {
        case 'add':
          if (operation.data) {
            await this.addDocument(operation.collectionName, operation.data);
          }
          break;
        case 'update':
          if (operation.docId && operation.data) {
            await this.updateDocument(operation.collectionName, operation.docId, operation.data);
          }
          break;
        case 'delete':
          if (operation.docId) {
            await this.deleteDocument(operation.collectionName, operation.docId);
          }
          break;
      }
    }
  }

  /**
   * Convert Firestore Timestamp to Date
   */
  timestampToDate(timestamp: Timestamp | undefined): Date {
    if (!timestamp) return new Date();
    return timestamp.toDate();
  }

  /**
   * Check if document exists
   */
  async documentExists(collectionName: string, docId: string): Promise<boolean> {
    const docSnap = await getDoc(doc(firestore, collectionName, docId));
    return docSnap.exists();
  }

  /**
   * Get collection size (document count)
   */
  async getCollectionSize(collectionName: string): Promise<number> {
    const snapshot = await getDocs(collection(firestore, collectionName));
    return snapshot.size;
  }
}

// Singleton instance
export const firebaseService = new FirebaseService();
