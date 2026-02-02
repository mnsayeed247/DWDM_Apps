import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Warehouse as WarehouseIcon, 
  Repeat, 
  History, 
  Search, 
  LogOut, 
  Menu,
  X,
  Cloud,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

import { 
  Warehouse, 
  InventoryItem, 
  TransferLog, 
  UserRole, 
  ViewType 
} from './types';

import { fetchData, saveData } from './api';

import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import WarehouseList from './components/WarehouseList';
import Transfers from './components/Transfers';
import TransferHistory from './components/TransferHistory';
import ItemTracking from './components/ItemTracking';

const App: React.FC = () => {

  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [currentUser] = useState({ name: 'Admin User', role: UserRole.ADMIN });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<TransferLog[]>([]);

  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [selectedTrackingSN, setSelectedTrackingSN] = useState<string | null>(null);

  // Load from cloud at startup
  useEffect(() => {
    pullFromCloud();
  }, []);

  const syncToCloud = async () => {
    setSyncStatus('syncing');
    try {
      await saveData({ warehouses, items, logs });
      const now = new Date().toLocaleString();
      setLastSync(now);
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
    }
  };

  const pullFromCloud = async () => {
    setSyncStatus('syncing');
    try {
      const data = await fetchData();
      setWarehouses(data.warehouses || []);
      setItems(data.items || []);
      setLogs(data.logs || []);
      const now = new Date().toLocaleString();
      setLastSync(now);
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
    }
  };

  const handleTransfer = (transfer: TransferLog) => {
    setItems(prev =>
      prev.map(item =>
        item.serialNumber === transfer.serialNumber
          ? { ...item, warehouseId: transfer.toWarehouseId, lastModified: Date.now() }
          : item
      )
    );
    setLogs(prev => [transfer, ...prev]);
    syncToCloud();
    setCurrentView('history');
  };

  const addItem = (newItem: InventoryItem) => {
    setItems(prev => [...prev, newItem]);
    setLogs(prev => [{
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
    }, ...prev]);

    syncToCloud();
  };

  const updateItem = (oldSN: string, updated: InventoryItem) => {
    setItems(prev => prev.map(i => i.serialNumber === oldSN ? updated : i));
    syncToCloud();
  };

  const deleteItem = (serialNumber: string) => {
    if (!window.confirm(`Delete ${serialNumber}?`)) return;
    setItems(prev => prev.filter(i => i.serialNumber !== serialNumber));
    syncToCloud();
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

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden">

      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-white">
        <div className="p-6 text-xl font-bold">DWDM Inventory</div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map(item => (
            <button key={item.id}
              onClick={() => setCurrentView(item.id as ViewType)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${
                currentView === item.id ? 'bg-indigo-600' : 'hover:bg-slate-800 text-slate-400'
              }`}>
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4">
          <button onClick={syncToCloud} className="w-full py-2 bg-indigo-600 rounded-xl mb-2">Backup Now</button>
          <button onClick={pullFromCloud} className="w-full py-2 bg-slate-700 rounded-xl">Restore Data</button>
          {lastSync && <p className="text-xs text-center text-slate-400 mt-2">Last sync: {lastSync}</p>}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b flex items-center px-6 justify-between">
          <button className="lg:hidden" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu />
          </button>

          <h2 className="text-lg font-bold capitalize">{currentView}</h2>

          {syncStatus === 'success' && <CheckCircle2 className="text-green-500" />}
          {syncStatus === 'error' && <AlertCircle className="text-red-500" />}
          {syncStatus === 'syncing' && <RefreshCw className="animate-spin" />}
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {currentView === 'dashboard' && <Dashboard items={items} warehouses={warehouses} logs={logs} />}
          {currentView === 'inventory' && <Inventory items={items} warehouses={warehouses} canEdit={canEdit}
            onAdd={addItem} onUpdate={updateItem} onDelete={deleteItem}
            onTrack={sn => { setSelectedTrackingSN(sn); setCurrentView('tracking'); }} />}

          {currentView === 'warehouses' && <WarehouseList warehouses={warehouses} items={items} canEdit={canEdit}
            onUpdate={wh => setWarehouses(prev => prev.map(w => w.id === wh.id ? wh : w))}
            onAdd={wh => setWarehouses(prev => [...prev, wh])} />}

          {currentView === 'transfers' && <Transfers items={items} warehouses={warehouses}
            onTransfer={handleTransfer} user={currentUser.name} canEdit={canEdit} />}

          {currentView === 'history' && <TransferHistory logs={logs} warehouses={warehouses} />}

          {currentView === 'tracking' && <ItemTracking logs={logs} items={items} initialSN={selectedTrackingSN || ''} />}
        </div>
      </main>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsMobileMenuOpen(false)} />
      )}

    </div>
  );
};

export default App;
