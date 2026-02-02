
/**
 * GOOGLE APPS SCRIPT CODE (Paste this in your Google Sheet > Extensions > Apps Script):
 * 
 * function doGet(e) {
 *   var ss = SpreadsheetApp.getActiveSpreadsheet();
 *   var data = {
 *     warehouses: transform(ss.getSheetByName("Warehouses")),
 *     items: transform(ss.getSheetByName("Items")),
 *     logs: transform(ss.getSheetByName("Logs"))
 *   };
 *   return ContentService.createTextOutput(JSON.stringify(data))
 *     .setMimeType(ContentService.MimeType.JSON);
 * }
 * 
 * function doPost(e) {
 *   var data = JSON.parse(e.postData.contents);
 *   var ss = SpreadsheetApp.getActiveSpreadsheet();
 *   if(data.warehouses) updateSheet(ss.getSheetByName("Warehouses"), data.warehouses);
 *   if(data.items) updateSheet(ss.getSheetByName("Items"), data.items);
 *   if(data.logs) updateSheet(ss.getSheetByName("Logs"), data.logs);
 *   return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
 * }
 * 
 * function transform(sheet) {
 *   if (!sheet) return [];
 *   var vals = sheet.getDataRange().getValues();
 *   if (vals.length < 2) return [];
 *   var headers = vals[0];
 *   var result = [];
 *   for (var i = 1; i < vals.length; i++) {
 *     var obj = {};
 *     for (var j = 0; j < headers.length; j++) { 
 *       var val = vals[i][j];
 *       // Preserve numbers and dates, convert others to string
 *       obj[headers[j]] = (typeof val === 'string') ? val.trim() : val; 
 *     }
 *     result.push(obj);
 *   }
 *   return result;
 * }
 * 
 * function updateSheet(sheet, data) {
 *   if (!sheet) return;
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
  CheckCircle2,
  Wifi,
  WifiOff,
  Database
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
//cgatgpt
const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
//end

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
  
  // State initialization: Prefer LocalStorage, otherwise empty/loading state
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
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [selectedTrackingSN, setSelectedTrackingSN] = useState<string | null>(null);

  // Persistence to LocalStorage (Instant UI feedback)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(warehouses));
  }, [warehouses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  }, [logs]);

  // Cloud Pull Function
  const pullFromCloud = useCallback(async (showNotification = true) => {
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    if (!scriptUrl) {
      setIsConnected(false);
      return;
    }

    setSyncStatus('syncing');
    try {
      // Use a cache-busting parameter to ensure we get fresh data from Google Sheets
      const response = await fetch(`${scriptUrl}?t=${Date.now()}`);
      if (!response.ok) throw new Error("Sheet response not OK");
      
      const data = await response.json();
      
      if (data.warehouses && data.warehouses.length > 0) setWarehouses(data.warehouses);
      if (data.items && data.items.length > 0) setItems(data.items);
      if (data.logs && data.logs.length > 0) setLogs(data.logs);
      
      const now = new Date().toLocaleString();
      setLastSync(now);
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, now);
      setSyncStatus('success');
      setIsConnected(true);
      if (showNotification) setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error("Cloud Pull Error:", error);
      setSyncStatus('error');
      setIsConnected(false);
    }
  }, []);

  // Initial Pull on Mount
  useEffect(() => {
    pullFromCloud(false);
  }, [pullFromCloud]);

  // Cloud Sync Function (Push)
  const syncToCloud = async () => {
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    if (!scriptUrl) {
      alert("Google Script URL is missing. Please set GOOGLE_SCRIPT_URL in your Netlify Environment Variables.");
      setIsConnected(false);
      return;
    }

    setSyncStatus('syncing');
    try {
      // POST to Google Apps Script
      // Note: Apps Script might throw CORS errors on POST even if successful. 
      // We use 'no-cors' for POST as standard for Apps Script Web Apps.
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warehouses, items, logs })
      });
      
      const now = new Date().toLocaleString();
      setLastSync(now);
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, now);
      setSyncStatus('success');
      setIsConnected(true);
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error("Cloud Sync Error:", error);
      setSyncStatus('error');
      setIsConnected(false);
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
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-white transition-all duration-300 shrink-0">
        <div className="p-6 flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
            <Package className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">DWDM Cloud</h1>
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

        {/* Sync Center Sidebar Component */}
        <div className="p-4 bg-slate-800/50 m-4 rounded-2xl border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {isConnected ? 'Sheet Connected' : 'Disconnected'}
              </span>
            </div>
            {syncStatus === 'syncing' && <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />}
          </div>
          
          <div className="space-y-2">
            <button 
              onClick={syncToCloud}
              className="w-full flex items-center justify-center space-x-2 py-2.5 bg-slate-900 hover:bg-black rounded-xl text-xs font-bold transition-all border border-slate-700 text-slate-300"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              <span>Push to Sheet</span>
            </button>
            <button 
              onClick={() => pullFromCloud(true)}
              className="w-full flex items-center justify-center space-x-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold transition-all shadow-md"
            >
              <CloudDownload className="w-3.5 h-3.5" />
              <span>Pull from Sheet</span>
            </button>
          </div>
          
          {lastSync && (
            <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-center space-x-1">
              <Database className="w-3 h-3 text-slate-500" />
              <p className="text-[9px] text-slate-500 italic truncate">Last: {lastSync}</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 shrink-0">
          <div className="flex items-center space-x-4">
            <button className="lg:hidden p-2 text-slate-500" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-slate-800 capitalize tracking-tight leading-tight">
                {currentView.replace('-', ' ')}
              </h2>
              {isConnected && <span className="text-[10px] text-emerald-600 font-bold flex items-center"><Wifi className="w-3 h-3 mr-1" /> Live Sync Active</span>}
              {!isConnected && <span className="text-[10px] text-red-500 font-bold flex items-center"><WifiOff className="w-3 h-3 mr-1" /> Offline Mode</span>}
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="hidden lg:flex items-center space-x-3">
               {syncStatus === 'syncing' && (
                 <div className="flex items-center text-indigo-600 text-xs font-bold animate-pulse">
                   <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> Synchronizing...
                 </div>
               )}
               {syncStatus === 'success' && (
                 <div className="flex items-center text-emerald-600 text-xs font-bold animate-in fade-in zoom-in duration-300">
                   <CheckCircle2 className="w-4 h-4 mr-1.5" /> Cloud Updated
                 </div>
               )}
               {syncStatus === 'error' && (
                 <div className="flex items-center text-red-500 text-xs font-bold">
                   <AlertCircle className="w-4 h-4 mr-1.5" /> Connection Error
                 </div>
               )}
            </div>

            <div className="flex items-center space-x-4 pl-6 border-l border-slate-100">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-bold text-slate-700">{currentUser.name}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{currentUser.role}</span>
              </div>
              <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-slate-200">
                <UserIcon className="w-5 h-5" />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8 scroll-smooth bg-[#fcfdfe]">
          {!process.env.GOOGLE_SCRIPT_URL && (
            <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-4 animate-in slide-in-from-top-4">
              <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-amber-900">Google Sheet Connection Not Configured</h4>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  To store data dynamically in your Google Sheet, you must deploy the Apps Script (see code in source) and add the Web App URL to your Netlify environment variables as <code className="bg-amber-100 px-1 rounded">GOOGLE_SCRIPT_URL</code>.
                </p>
              </div>
            </div>
          )}

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
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-72 bg-slate-900 text-white h-full flex flex-col animate-in slide-in-from-left duration-300 shadow-2xl">
            <div className="p-6 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <Package className="w-6 h-6 text-indigo-500" />
                <span className="text-xl font-bold tracking-tight">DWDM Cloud</span>
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
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${currentView === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="p-6 bg-slate-800 m-4 rounded-2xl border border-slate-700">
               <button onClick={syncToCloud} className="w-full py-3 bg-indigo-600 rounded-xl font-bold mb-2 flex items-center justify-center space-x-2">
                 <CloudUpload className="w-4 h-4" /> <span>Push to Sheet</span>
               </button>
               <button onClick={() => pullFromCloud(true)} className="w-full py-3 bg-slate-700 rounded-xl font-bold flex items-center justify-center space-x-2">
                 <CloudDownload className="w-4 h-4" /> <span>Pull Refresh</span>
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
