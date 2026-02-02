import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Warehouse as WarehouseIcon, 
  Repeat, 
  History, 
  Search, 
  LogOut, 
  Plus, 
  User as UserIcon,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { 
  Warehouse, 
  InventoryItem, 
  TransferLog, 
  UserRole, 
  ViewType, 
  ItemStatus 
} from './types';
import { INITIAL_WAREHOUSES, INITIAL_ITEMS, INITIAL_LOGS } from './mockData';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import WarehouseList from './components/WarehouseList';
import Transfers from './components/Transfers';
import TransferHistory from './components/TransferHistory';
import ItemTracking from './components/ItemTracking';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [currentUser, setCurrentUser] = useState<{ name: string; role: UserRole }>({
    name: 'Admin User',
    role: UserRole.ADMIN
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [warehouses, setWarehouses] = useState<Warehouse[]>(INITIAL_WAREHOUSES);
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_ITEMS);
  const [logs, setLogs] = useState<TransferLog[]>(INITIAL_LOGS);
  const [selectedTrackingSN, setSelectedTrackingSN] = useState<string | null>(null);

  const handleTransfer = (transfer: TransferLog) => {
    setItems(prev => prev.map(item => 
      item.serialNumber === transfer.serialNumber 
        ? { ...item, warehouseId: transfer.toWarehouseId, lastModified: Date.now() }
        : item
    ));
    setLogs(prev => [transfer, ...prev]);
    setCurrentView('history');
  };

  const addItem = (newItem: InventoryItem) => {
    setItems(prev => [...prev, newItem]);
    const log: TransferLog = {
      id: `in-${Date.now()}`,
      timestamp: Date.now(),
      itemId: newItem.serialNumber,
      serialNumber: newItem.serialNumber,
      boardName: newItem.boardName,
      partNumber: newItem.partNumber,
      fromWarehouseId: 'EXTERNAL',
      toWarehouseId: newItem.warehouseId,
      reason: 'New Purchase Receipt',
      user: currentUser.name,
      quantity: 1
    };
    setLogs(prev => [log, ...prev]);
  };

  const updateItem = (oldSerialNumber: string, updatedItem: InventoryItem) => {
    setItems(prev => {
      const index = prev.findIndex(i => i.serialNumber === oldSerialNumber);
      if (index === -1) return prev;
      const newItems = [...prev];
      newItems[index] = { ...updatedItem, lastModified: Date.now() };
      return newItems;
    });
    
    // Log the update if the serial number changed for audit tracking
    if (oldSerialNumber !== updatedItem.serialNumber) {
      const log: TransferLog = {
        id: `upd-sn-${Date.now()}`,
        timestamp: Date.now(),
        itemId: updatedItem.serialNumber,
        serialNumber: updatedItem.serialNumber,
        boardName: updatedItem.boardName,
        partNumber: updatedItem.partNumber,
        fromWarehouseId: 'SYSTEM',
        toWarehouseId: 'SYSTEM',
        reason: `Serial number changed from ${oldSerialNumber}`,
        user: currentUser.name,
        quantity: 1
      };
      setLogs(prev => [log, ...prev]);
    }
  };

  const deleteItem = (serialNumber: string) => {
    const itemToDelete = items.find(i => i.serialNumber === serialNumber);
    if (!itemToDelete) return;

    if (window.confirm(`Are you sure you want to delete item ${serialNumber} (${itemToDelete.boardName})? This action cannot be undone.`)) {
      setItems(prev => prev.filter(item => item.serialNumber !== serialNumber));
      
      const log: TransferLog = {
        id: `del-${Date.now()}`,
        timestamp: Date.now(),
        itemId: serialNumber,
        serialNumber: serialNumber,
        boardName: itemToDelete.boardName,
        partNumber: itemToDelete.partNumber,
        fromWarehouseId: itemToDelete.warehouseId,
        toWarehouseId: 'DELETED',
        reason: 'Item removed from system',
        user: currentUser.name,
        quantity: 0
      };
      setLogs(prev => [log, ...prev]);
    }
  };

  const addBulkItems = (newItems: InventoryItem[]) => {
    setItems(prev => [...prev, ...newItems]);
    const bulkLogs: TransferLog[] = newItems.map(item => ({
      id: `bulk-${item.serialNumber}-${Date.now()}`,
      timestamp: Date.now(),
      itemId: item.serialNumber,
      serialNumber: item.serialNumber,
      boardName: item.boardName,
      partNumber: item.partNumber,
      fromWarehouseId: 'EXTERNAL',
      toWarehouseId: item.warehouseId,
      reason: 'Bulk Data Import',
      user: currentUser.name,
      quantity: 1
    }));
    setLogs(prev => [...bulkLogs, ...prev]);
  };

  const updateWarehouse = (updatedWh: Warehouse) => {
    setWarehouses(prev => prev.map(wh => wh.id === updatedWh.id ? updatedWh : wh));
  };

  const addWarehouse = (newWh: Warehouse) => {
    setWarehouses(prev => [...prev, newWh]);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'warehouses', label: 'Warehouses', icon: WarehouseIcon },
    { id: 'transfers', label: 'New Transfer', icon: Repeat },
    { id: 'history', label: 'Transfer Logs', icon: History },
    { id: 'tracking', label: 'Item Tracking', icon: Search },
  ];

  const canEdit = currentUser.role !== UserRole.VIEWER;

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard items={items} warehouses={warehouses} logs={logs} />;
      case 'inventory':
        return (
          <Inventory 
            items={items} 
            warehouses={warehouses} 
            canEdit={canEdit} 
            onAdd={addItem} 
            onUpdate={updateItem}
            onDelete={deleteItem}
            onBulkAdd={addBulkItems} 
            onTrack={(sn) => { setSelectedTrackingSN(sn); setCurrentView('tracking'); }} 
          />
        );
      case 'warehouses':
        return <WarehouseList warehouses={warehouses} items={items} canEdit={canEdit} onUpdate={updateWarehouse} onAdd={addWarehouse} />;
      case 'transfers':
        return <Transfers items={items} warehouses={warehouses} onTransfer={handleTransfer} user={currentUser.name} canEdit={canEdit} />;
      case 'history':
        return <TransferHistory logs={logs} warehouses={warehouses} />;
      case 'tracking':
        return <ItemTracking logs={logs} items={items} initialSN={selectedTrackingSN || ''} />;
      default:
        return <Dashboard items={items} warehouses={warehouses} logs={logs} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden">
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-white transition-all duration-300 shrink-0">
        <div className="p-6 flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Package className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">DWDM Inventory</h1>
        </div>
        
        <nav className="flex-1 px-4 mt-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as ViewType)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                currentView === item.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 bg-slate-800 m-4 rounded-2xl border border-slate-700">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold border-2 border-slate-700">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-white">{currentUser.name}</p>
              <p className="text-xs text-slate-400">{currentUser.role}</p>
            </div>
          </div>
          <select 
            className="w-full bg-slate-900 text-xs border-none rounded-lg py-1.5 px-2 focus:ring-1 focus:ring-indigo-500 cursor-pointer text-slate-300"
            value={currentUser.role}
            onChange={(e) => setCurrentUser(prev => ({ ...prev, role: e.target.value as UserRole }))}
          >
            <option value={UserRole.ADMIN}>Admin Role</option>
            <option value={UserRole.MANAGER}>Manager Role</option>
            <option value={UserRole.VIEWER}>Viewer Only</option>
          </select>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 shrink-0">
          <div className="flex items-center space-x-4">
            <button className="lg:hidden p-2 text-slate-500" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-slate-800 capitalize tracking-tight">
              {currentView.replace('-', ' ')}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-700">{currentUser.name}</span>
              <span className="text-xs text-slate-400">{currentUser.role}</span>
            </div>
            <div className="w-px h-6 bg-slate-200 mx-2 hidden md:block"></div>
            <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto pb-12">
            {renderView()}
          </div>
        </div>
      </main>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-72 bg-slate-900 text-white h-full flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-6 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <Package className="w-6 h-6 text-indigo-500" />
                <span className="text-xl font-bold tracking-tight">DWDM Inventory</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id as ViewType);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    currentView === item.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;