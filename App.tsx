
/**
 * GOOGLE APPS SCRIPT CODE (Paste this in your Google Sheet > Extensions > Apps Script):
 * 
 * function doGet(e) {
 *   var ss = SpreadsheetApp.getActiveSpreadsheet();
 *   return ContentService.createTextOutput(JSON.stringify({
 *     warehouses: transform(ss.getSheetByName("Warehouses").getDataRange().getValues()),
 *     items: transform(ss.getSheetByName("Items").getDataRange().getValues()),
 *     logs: transform(ss.getSheetByName("Logs").getDataRange().getValues())
 *   })).setMimeType(ContentService.MimeType.JSON);
 * }
 * 
 * function doPost(e) {
 *   var data = JSON.parse(e.postData.contents);
 *   var ss = SpreadsheetApp.getActiveSpreadsheet();
 *   if(data.warehouses) updateSheet(ss.getSheetByName("Warehouses"), data.warehouses);
 *   if(data.items) updateSheet(ss.getSheetByName("Items"), data.items);
 *   if(data.logs) updateSheet(ss.getSheetByName("Logs"), data.logs);
 *   return ContentService.createTextOutput("OK");
 * }
 * 
 * function transform(vals) {
 *   if (vals.length < 2) return [];
 *   var headers = vals[0];
 *   var result = [];
 *   for (var i = 1; i < vals.length; i++) {
 *     var obj = {};
 *     for (var j = 0; j < headers.length; j++) { obj[headers[j]] = vals[i][j]; }
 *     result.push(obj);
 *   }
 *   return result;
 * }
 * 
 * function updateSheet(sheet, data) {
 *   sheet.clear();
 *   if (!data || data.length == 0) return;
 *   var headers = Object.keys(data[0]);
 *   sheet.appendRow(headers);
 *   var values = data.map(function(row) { return headers.map(function(h) { return row[h]; }); });
 *   sheet.getRange(2, 1, values.length, headers.length).setValues(values);
 * }
 */

import React, { useState, useEffect, useCallback } from 'react';
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

const STORAGE_KEYS = {
  ITEMS: 'dwdm_inventory_items',
  WAREHOUSES: 'dwdm_inventory_warehouses',
  LOGS: 'dwdm_inventory_logs',
  LAST_SYNC: 'dwdm_inventory_last_sync'
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [currentUser, setCurrentUser] = useState<{ name: string; role: UserRole }>({
    name: 'Admin User',
    role: UserRole.ADMIN
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // State initialization with localStorage fallback
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WAREHOUSES);
    return saved ? JSON.parse(saved) : INITIAL_WAREHOUSES;
  });
  
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ITEMS);
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });
  
  const [logs, setLogs] = useState<TransferLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  const [lastSync, setLastSync] = useState<string | null>(localStorage.getItem(STORAGE_KEYS.LAST_SYNC));
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [selectedTrackingSN, setSelectedTrackingSN] = useState<string | null>(null);

  // Persistence to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(warehouses));
  }, [warehouses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  }, [logs]);

  // Cloud Sync Functions
  const syncToCloud = async () => {
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    if (!scriptUrl) {
      alert("Google Script URL not found in environment variables. Please set GOOGLE_SCRIPT_URL in Netlify.");
      return;
    }

    setSyncStatus('syncing');
    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors', // Apps Script requires no-cors for simple web app posts
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warehouses, items, logs })
      });
      
      const now = new Date().toLocaleString();
      setLastSync(now);
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, now);
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error("Cloud Sync Error:", error);
      setSyncStatus('error');
    }
  };

  const pullFromCloud = async () => {
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    if (!scriptUrl) return;

    setSyncStatus('syncing');
    try {
      const response = await fetch(scriptUrl);
      const data = await response.json();
      
      if (data.warehouses) setWarehouses(data.warehouses);
      if (data.items) setItems(data.items);
      if (data.logs) setLogs(data.logs);
      
      const now = new Date().toLocaleString();
      setLastSync(now);
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, now);
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error("Cloud Pull Error:", error);
      setSyncStatus('error');
    }
  };

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
  };

  const deleteItem = (serialNumber: string) => {
    const itemToDelete = items.find(i => i.serialNumber === serialNumber);
    if (!itemToDelete) return;

    if (window.confirm(`Are you sure you want to delete item ${serialNumber}?`)) {
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Cloud className={`w-4 h-4 ${syncStatus === 'success' ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cloud Sync</span>
            </div>
            {syncStatus === 'syncing' && <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />}
          </div>
          <div className="flex flex-col gap-2">
            <button 
              onClick={syncToCloud}
              className="w-full flex items-center justify-center space-x-2 py-2 bg-slate-900 hover:bg-slate-900/50 rounded-lg text-xs font-bold transition-all border border-slate-700"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              <span>Backup Now</span>
            </button>
            <button 
              onClick={pullFromCloud}
              className="w-full flex items-center justify-center space-x-2 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold transition-all"
            >
              <CloudDownload className="w-3.5 h-3.5" />
              <span>Restore Data</span>
            </button>
          </div>
          {lastSync && <p className="text-[9px] text-slate-500 mt-3 text-center italic">Last sync: {lastSync}</p>}
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
          
          <div className="flex items-center space-x-6">
            <div className="hidden lg:flex items-center space-x-2 text-slate-400 border-r pr-6 border-slate-100">
               {syncStatus === 'success' && <div className="flex items-center text-emerald-600 text-xs font-bold animate-in fade-in zoom-in"><CheckCircle2 className="w-4 h-4 mr-1" /> Cloud Synced</div>}
               {syncStatus === 'error' && <div className="flex items-center text-red-500 text-xs font-bold"><AlertCircle className="w-4 h-4 mr-1" /> Sync Failed</div>}
               {syncStatus === 'idle' && lastSync && <span className="text-xs">Sheet Connected</span>}
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-700">{currentUser.name}</span>
                <span className="text-xs text-slate-400">{currentUser.role}</span>
              </div>
              <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto pb-12">
            {currentView === 'dashboard' && <Dashboard items={items} warehouses={warehouses} logs={logs} />}
            {currentView === 'inventory' && <Inventory items={items} warehouses={warehouses} canEdit={canEdit} onAdd={addItem} onUpdate={updateItem} onDelete={deleteItem} onBulkAdd={addBulkItems} onTrack={(sn) => { setSelectedTrackingSN(sn); setCurrentView('tracking'); }} />}
            {currentView === 'warehouses' && <WarehouseList warehouses={warehouses} items={items} canEdit={canEdit} onUpdate={(wh) => setWarehouses(prev => prev.map(w => w.id === wh.id ? wh : w))} onAdd={(wh) => setWarehouses(prev => [...prev, wh])} />}
            {currentView === 'transfers' && <Transfers items={items} warehouses={warehouses} onTransfer={handleTransfer} user={currentUser.name} canEdit={canEdit} />}
            {currentView === 'history' && <TransferHistory logs={logs} warehouses={warehouses} />}
            {currentView === 'tracking' && <ItemTracking logs={logs} items={items} initialSN={selectedTrackingSN || ''} />}
          </div>
        </div>
      </main>
      
      {/* Mobile Menu Logic remains similar but with Sync buttons */}
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
                  onClick={() => { setCurrentView(item.id as ViewType); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${currentView === item.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="p-6 bg-slate-800 m-4 rounded-2xl">
               <button onClick={syncToCloud} className="w-full py-3 bg-indigo-600 rounded-xl font-bold mb-2">Cloud Backup</button>
               <button onClick={pullFromCloud} className="w-full py-3 bg-slate-700 rounded-xl font-bold">Restore Sheet Data</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
