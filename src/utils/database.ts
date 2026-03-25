import Dexie, { type Table } from 'dexie';
import type { Subscription } from '../types/subscription';

export class SubTrackDatabase extends Dexie {
  subscriptions!: Table<Subscription>;

  constructor() {
    super('SubTrackDatabase');
    this.version(1).stores({
      subscriptions: '++id, name, category, renewalDate, status, createdAt'
    });
  }
}

export const db = new SubTrackDatabase();