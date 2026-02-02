
import { Warehouse, InventoryItem, ItemStatus, TransferLog } from './types';

export const INITIAL_WAREHOUSES: Warehouse[] = [
  { id: 'wh-001', name: 'Main Store (Central)', isCentral: true, location: 'Building A, Floor 1' },
  { id: 'wh-002', name: 'R&D Lab North', isCentral: false, location: 'Building B, Floor 2' },
  { id: 'wh-003', name: 'Assembly Line 4', isCentral: false, location: 'Building C, Floor 1' },
  { id: 'wh-004', name: 'Quality Assurance', isCentral: false, location: 'Building B, Floor 3' },
];

export const INITIAL_ITEMS: InventoryItem[] = [
  { serialNumber: 'SN-X1001', partNumber: 'PN-782', boardName: 'Main Controller V2', category: 'Logic', status: ItemStatus.FREE, warehouseId: 'wh-001', lastModified: Date.now() },
  { serialNumber: 'SN-X1002', partNumber: 'PN-782', boardName: 'Main Controller V2', category: 'Logic', status: ItemStatus.FREE, warehouseId: 'wh-001', lastModified: Date.now() },
  { serialNumber: 'SN-P2001', partNumber: 'PN-412', boardName: 'Power Shield 30A', category: 'Power', status: ItemStatus.USED, warehouseId: 'wh-002', lastModified: Date.now() },
  { serialNumber: 'SN-C3001', partNumber: 'PN-991', boardName: 'Comms Bridge WiFi', category: 'Wireless', status: ItemStatus.RESERVED, warehouseId: 'wh-001', lastModified: Date.now() },
  { serialNumber: 'SN-D4001', partNumber: 'PN-223', boardName: 'Display Module 7"', category: 'UI', status: ItemStatus.FAULTY, warehouseId: 'wh-004', lastModified: Date.now() },
  { serialNumber: 'SN-X1003', partNumber: 'PN-782', boardName: 'Main Controller V2', category: 'Logic', status: ItemStatus.FREE, warehouseId: 'wh-003', lastModified: Date.now() },
];

export const INITIAL_LOGS: TransferLog[] = [
  { 
    id: 'tr-001', 
    timestamp: Date.now() - 86400000 * 2, 
    itemId: 'SN-P2001', 
    serialNumber: 'SN-P2001', 
    boardName: 'Power Shield 30A', 
    partNumber: 'PN-412', 
    fromWarehouseId: 'wh-001', 
    toWarehouseId: 'wh-002', 
    reason: 'Initial allocation for R&D Project Alpha', 
    user: 'John Doe', 
    quantity: 1 
  }
];
