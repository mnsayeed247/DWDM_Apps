
export enum ItemStatus {
  FREE = 'Free',
  USED = 'Used',
  RESERVED = 'Reserved',
  FAULTY = 'Faulty'
}

export enum UserRole {
  ADMIN = 'Admin',
  MANAGER = 'Store Manager',
  VIEWER = 'Viewer'
}

export interface Warehouse {
  id: string;
  name: string;
  isCentral: boolean;
  location: string;
}

export interface InventoryItem {
  serialNumber: string;
  partNumber: string;
  boardName: string;
  category: string;
  status: ItemStatus;
  warehouseId: string;
  lastModified: number;
}

export interface TransferLog {
  id: string;
  timestamp: number;
  itemId: string;
  serialNumber: string;
  boardName: string;
  partNumber: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  reason: string;
  user: string;
  quantity: number;
}

export type ViewType = 'dashboard' | 'inventory' | 'warehouses' | 'transfers' | 'history' | 'tracking';
