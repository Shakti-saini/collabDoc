'use client';
import { v4 as uuidv4 } from 'uuid';
import {
  saveDocumentLocally, getLocalDocument, addPendingOperation,
  getAllPendingOperations, deletePendingOperation, LocalDocument
} from './indexedDB';
import { VectorClock, incrementClock, mergeClock } from './vectorClock';

const MAX_PAYLOAD_SIZE = 512 * 1024; // 512KB guard
const MAX_RETRIES = 5;

type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error';
type StatusListener = (status: SyncStatus, docId?: string) => void;

class SyncEngine {
  private listeners: StatusListener[] = [];
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private status: SyncStatus = 'idle';
  private userId: string | null = null;
  private userVectorClock: VectorClock = {};

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.setStatus('idle');
        this.flushPendingOps();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.setStatus('offline');
      });
      this.startPeriodicSync();
    }
  }

  init(userId: string) {
    this.userId = userId;
    this.userVectorClock = { [userId]: 0 };
  }

  subscribe(listener: StatusListener) {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  private setStatus(s: SyncStatus, docId?: string) {
    this.status = s;
    this.listeners.forEach(l => l(s, docId));
  }

  getStatus() { return this.status; }
  getIsOnline() { return this.isOnline; }

  private startPeriodicSync() {
    this.syncInterval = setInterval(() => {
      if (this.isOnline) this.flushPendingOps();
    }, 15000);
  }

  async saveLocally(docId: string, updates: Partial<LocalDocument>): Promise<void> {
    const existing = await getLocalDocument(docId);
    const doc: LocalDocument = {
      id: docId,
      title: updates.title ?? existing?.title ?? 'Untitled',
      content: updates.content ?? existing?.content ?? {},
      yjsState: updates.yjsState ?? existing?.yjsState,
      version: updates.version ?? existing?.version ?? 0,
      updatedAt: new Date().toISOString(),
      isDirty: true,
      lastSyncedVersion: existing?.lastSyncedVersion ?? 0,
    };
    await saveDocumentLocally(doc);
    if (!this.userId) return;

    this.userVectorClock = incrementClock(this.userVectorClock, this.userId);
    const payload = {
      documentId: docId,
      title: doc.title,
      content: doc.content,
      clientVersion: doc.version,
    };
    const payloadStr = JSON.stringify(payload);
    if (payloadStr.length > MAX_PAYLOAD_SIZE) {
      console.warn('Payload too large, skipping sync operation');
      return;
    }

    const pendingOp = {
      id: uuidv4(),
      documentId: docId,
      operation: payload,
      vectorClock: this.userVectorClock,
      createdAt: new Date().toISOString(),
      retries: 0,
    };
    await addPendingOperation(pendingOp);
    if (this.isOnline) this.flushPendingOps();
  }

  async flushPendingOps(): Promise<void> {
    if (!this.isOnline || !this.userId) return;
    const ops = await getAllPendingOperations();
    if (ops.length === 0) return;

    // Group by document, only send latest per document
    const latestOps = new Map<string, typeof ops[0]>();
    for (const op of ops.sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
      latestOps.set(op.documentId, op);
    }

    for (const [docId, op] of latestOps) {
      if (op.retries >= MAX_RETRIES) {
        await deletePendingOperation(op.id);
        continue;
      }
      this.setStatus('syncing', docId);
      try {
        const res = await fetch(`/api/documents/${docId}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operation: op.operation, vectorClock: op.vectorClock }),
        });
        if (res.ok) {
          const data = await res.json();
          // Merge remote vector clock
          if (data.vectorClock) {
            this.userVectorClock = mergeClock(this.userVectorClock, data.vectorClock);
          }
          // Clear all pending ops for this document (we sent the latest)
          const allOps = await getAllPendingOperations();
          const docOps = allOps.filter(o => o.documentId === docId);
          for (const o of docOps) await deletePendingOperation(o.id);

          // Update local synced version
          const localDoc = await getLocalDocument(docId);
          if (localDoc) {
            await saveDocumentLocally({ ...localDoc, isDirty: false, lastSyncedVersion: data.version ?? localDoc.version });
          }
          this.setStatus('idle', docId);
        } else if (res.status === 409) {
          // Conflict — server will return merged content
          const conflictData = await res.json();
          const localDoc = await getLocalDocument(docId);
          if (localDoc && conflictData.merged) {
            await saveDocumentLocally({ ...localDoc, content: conflictData.merged, isDirty: false });
          }
          await deletePendingOperation(op.id);
          this.setStatus('idle', docId);
        } else {
          op.retries++;
        }
      } catch {
        op.retries++;
        this.setStatus('error', docId);
      }
    }
    if (this.status !== 'offline') this.setStatus('idle');
  }

  async fetchRemote(docId: string): Promise<unknown> {
    if (!this.isOnline) return null;
    try {
      const res = await fetch(`/api/documents/${docId}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  destroy() {
    if (this.syncInterval) clearInterval(this.syncInterval);
  }
}

export const syncEngine = new SyncEngine();
