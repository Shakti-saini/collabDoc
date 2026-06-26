import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'collabdocs';
const DB_VERSION = 1;

export interface LocalDocument {
  id: string;
  title: string;
  content: Record<string, unknown>;
  yjsState?: Uint8Array;
  version: number;
  updatedAt: string;
  isDirty: boolean;
  lastSyncedVersion: number;
}

export interface PendingOperation {
  id: string;
  documentId: string;
  operation: Record<string, unknown>;
  vectorClock: Record<string, number>;
  createdAt: string;
  retries: number;
}

let dbInstance: IDBPDatabase | null = null;

export async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('documents')) {
        const docStore = db.createObjectStore('documents', { keyPath: 'id' });
        docStore.createIndex('updatedAt', 'updatedAt');
        docStore.createIndex('isDirty', 'isDirty');
      }
      if (!db.objectStoreNames.contains('pendingOps')) {
        const opStore = db.createObjectStore('pendingOps', { keyPath: 'id' });
        opStore.createIndex('documentId', 'documentId');
        opStore.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains('versions')) {
        const versionStore = db.createObjectStore('versions', { keyPath: 'id' });
        versionStore.createIndex('documentId', 'documentId');
      }
    },
  });
  return dbInstance;
}

export async function saveDocumentLocally(doc: LocalDocument): Promise<void> {
  const db = await getDB();
  await db.put('documents', doc);
}

export async function getLocalDocument(id: string): Promise<LocalDocument | undefined> {
  const db = await getDB();
  return db.get('documents', id);
}

export async function getAllLocalDocuments(): Promise<LocalDocument[]> {
  const db = await getDB();
  return db.getAll('documents');
}

export async function getDirtyDocuments(): Promise<LocalDocument[]> {
  const db = await getDB();
  return db.getAllFromIndex('documents', 'isDirty', IDBKeyRange.only(1));
}

export async function addPendingOperation(op: PendingOperation): Promise<void> {
  const db = await getDB();
  await db.put('pendingOps', op);
}

export async function getPendingOperations(documentId: string): Promise<PendingOperation[]> {
  const db = await getDB();
  return db.getAllFromIndex('pendingOps', 'documentId', documentId);
}

export async function deletePendingOperation(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('pendingOps', id);
}

export async function getAllPendingOperations(): Promise<PendingOperation[]> {
  const db = await getDB();
  return db.getAllFromIndex('pendingOps', 'createdAt');
}

export async function deleteLocalDocument(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('documents', id);
}
