
import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  InventoryItem, 
  Warehouse, 
  ItemStatus 
} from '../types';
import { 
  Search, 
  Filter, 
  Plus, 
  FileUp,
  Download,
  AlertCircle,
  Clock,
  X,
  CheckCircle2,
  Table as TableIcon,
  Package,
  UploadCloud,
  FileSpreadsheet,
  Edit2,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';

interface InventoryProps {
  items: InventoryItem[];
  warehouses: Warehouse[];
  canEdit: boolean;
  onAdd: (item: InventoryItem) => void;
  onUpdate: (oldSN: string, item: InventoryItem) => void;
  onDelete: (serialNumber: string) => void;
  onBulkAdd: (items: InventoryItem[]) => void;
  onTrack: (sn: string) => void;
}

const Inventory: React.FC<InventoryProps> = ({ 
  items, 
  warehouses, 
  canEdit, 
  onAdd, 
  onUpdate, 
  onDelete,
  onBulkAdd, 
  onTrack 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [originalSN, setOriginalSN] = useState<string | null>(null);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  
  const [previewItems, setPreviewItems] = useState<InventoryItem[]>([]);
  const [bulkStep, setBulkStep] = useState<'upload' | 'preview'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    serialNumber: '',
    partNumber: '',
    boardName: '',
    category: '',
    status: ItemStatus.FREE,
    warehouseId: warehouses.find(w => w.isCentral)?.id || warehouses[0]?.id || ''
  });

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = 
        item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.boardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.partNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesWarehouse = filterWarehouse === 'all' || item.warehouseId === filterWarehouse;
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;

      return matchesSearch && matchesWarehouse && matchesStatus;
    });
  }, [items, searchTerm, filterWarehouse, filterStatus]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        const centralWhId = warehouses.find(w => w.isCentral)?.id || warehouses[0]?.id;
        
        const parsed: InventoryItem[] = rawData.slice(1).map(row => {
          const warehouseNameFromExcel = String(row[4] || '').trim().toLowerCase();
          const matchedWarehouse = warehouses.find(w => 
            w.name.toLowerCase().includes(warehouseNameFromExcel) || 
            warehouseNameFromExcel.includes(w.name.toLowerCase())
          );
          
          return {
            serialNumber: String(row[0] || '').trim(),
            partNumber: String(row[1] || '').trim(),
            boardName: String(row[2] || '').trim(),
            category: String(row[3] || 'Uncategorized').trim(),
            status: ItemStatus.FREE,
            warehouseId: matchedWarehouse ? matchedWarehouse.id : centralWhId,
            lastModified: Date.now()
          };
        }).filter(item => item.serialNumber !== '');

        setPreviewItems(parsed);
        setBulkStep('preview');
      } catch (err) {
        alert("Failed to parse Excel file. Please ensure it's a valid .xlsx or .xls file.");
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleCommitBulk = () => {
    const validItems = previewItems.filter(p => !items.some(existing => existing.serialNumber === p.serialNumber));
    if (validItems.length > 0) {
      onBulkAdd(validItems);
      resetBulk();
    } else {
      alert("No new items to import (all items already exist in system).");
    }
  };

  const resetBulk = () => {
    setPreviewItems([]);
    setBulkStep('upload');
    setIsBulkAdding(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.serialNumber) return;
    
    if (items.some(i => i.serialNumber === formData.serialNumber)) {
      alert("An item with this Serial Number already exists.");
      return;
    }

    onAdd({ ...formData, lastModified: Date.now() } as InventoryItem);
    setIsAdding(false);
    setFormData({
      serialNumber: '',
      partNumber: '',
      boardName: '',
      category: '',
      status: ItemStatus.FREE,
      warehouseId: warehouses.find(w => w.isCentral)?.id || warehouses[0]?.id || ''
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem && originalSN) {
      // Check if new serial number conflicts with someone else
      if (editingItem.serialNumber !== originalSN && items.some(i => i.serialNumber === editingItem.serialNumber)) {
        alert("This Serial Number is already taken by another item.");
        return;
      }
      onUpdate(originalSN, editingItem);
      setEditingItem(null);
      setOriginalSN(null);
    }
  };

  const startEdit = (item: InventoryItem) => {
    setEditingItem({ ...item });
    setOriginalSN(item.serialNumber);
  };

  const getStatusColor = (status: ItemStatus) => {
    switch (status) {
      case ItemStatus.FREE: return 'bg-emerald-100 text-emerald-700';
      case ItemStatus.USED: return 'bg-blue-100 text-blue-700';
      case ItemStatus.RESERVED: return 'bg-amber-100 text-amber-700';
      case ItemStatus.FAULTY: return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search Serial, Board, or PN..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {canEdit && (
            <>
              <button 
                onClick={() => setIsBulkAdding(true)}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm"
              >
                <FileSpreadsheet className="w-5 h-5" />
                <span>Bulk Upload (Excel)</span>
              </button>
              <button 
                onClick={() => setIsAdding(true)}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm"
              >
                <Plus className="w-5 h-5" />
                <span>New Item</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">Filters:</span>
        </div>
        <select 
          className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          value={filterWarehouse}
          onChange={(e) => setFilterWarehouse(e.target.value)}
        >
          <option value="all">All Warehouses</option>
          {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
        </select>
        <select 
          className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          {Object.values(ItemStatus).map(status => <option key={status} value={status}>{status}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Serial Number</th>
                <th className="px-6 py-4">Board Name</th>
                <th className="px-6 py-4">Part Number</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Warehouse</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <tr key={item.serialNumber} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-gray-900">{item.serialNumber}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.boardName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.partNumber}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full">{item.category}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {warehouses.find(w => w.id === item.warehouseId)?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button 
                        onClick={() => onTrack(item.serialNumber)} 
                        className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 text-xs font-bold px-3 py-1.5 bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Track</span>
                      </button>
                      {canEdit && (
                        <>
                          <button 
                            onClick={() => startEdit(item)}
                            className="flex items-center space-x-1 text-slate-600 hover:text-indigo-600 text-xs font-bold px-3 py-1.5 bg-gray-100 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button 
                            onClick={() => onDelete(item.serialNumber)}
                            className="flex items-center space-x-1 text-red-600 hover:text-white hover:bg-red-600 text-xs font-bold px-3 py-1.5 bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredItems.length === 0 && (
            <div className="p-20 text-center">
              <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">No inventory items found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Excel Upload Modal */}
      {isBulkAdding && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={resetBulk}></div>
          <div className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-600 text-white rounded-lg">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Excel Data Import</h3>
                  <p className="text-xs text-gray-500">Fast-track inventory intake with .xlsx files</p>
                </div>
              </div>
              <button onClick={resetBulk} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-8">
              {bulkStep === 'upload' ? (
                <div className="space-y-6">
                  <div className="flex items-start space-x-4 bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                    <InfoIcon className="w-10 h-10 text-indigo-500 shrink-0" />
                    <div className="text-sm text-indigo-900">
                      <p className="font-bold">Required Excel Column Structure:</p>
                      <ol className="mt-2 space-y-1 list-decimal list-inside">
                        <li>Serial Number</li>
                        <li>Part Number</li>
                        <li>Board Name</li>
                        <li>Category</li>
                        <li>Warehouse Name</li>
                      </ol>
                    </div>
                  </div>
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="group border-4 border-dashed border-gray-100 hover:border-indigo-200 bg-gray-50 hover:bg-indigo-50/30 p-12 rounded-3xl cursor-pointer transition-all flex flex-col items-center justify-center text-center"
                  >
                    <UploadCloud className="w-16 h-16 text-gray-300 group-hover:text-indigo-400 mb-4 transition-colors" />
                    <p className="text-lg font-bold text-gray-600 group-hover:text-indigo-600">Click to Browse Excel File</p>
                    <p className="text-sm text-gray-400 mt-2">Supports .xlsx and .xls formats</p>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept=".xlsx, .xls" 
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-bold text-slate-800">Reviewing {previewItems.length} Records</h4>
                    <button onClick={() => setBulkStep('upload')} className="text-sm text-indigo-600 font-semibold hover:underline">Change File</button>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto rounded-2xl border border-gray-100 shadow-inner bg-gray-50/30">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white sticky top-0 border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-3 font-bold text-gray-400 uppercase text-[10px]">Status</th>
                          <th className="px-4 py-3 font-bold text-gray-400 uppercase text-[10px]">Serial</th>
                          <th className="px-4 py-3 font-bold text-gray-400 uppercase text-[10px]">Part Number</th>
                          <th className="px-4 py-3 font-bold text-gray-400 uppercase text-[10px]">Warehouse</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {previewItems.map((item, idx) => {
                          const isDup = items.some(existing => existing.serialNumber === item.serialNumber);
                          return (
                            <tr key={idx} className={isDup ? 'bg-red-50/50' : 'bg-white'}>
                              <td className="px-4 py-3">
                                {isDup ? (
                                  <span className="flex items-center text-red-600 text-[10px] font-bold">
                                    <AlertCircle className="w-3 h-3 mr-1" /> DUPLICATE
                                  </span>
                                ) : (
                                  <span className="flex items-center text-emerald-600 text-[10px] font-bold">
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> READY
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 font-mono">{item.serialNumber}</td>
                              <td className="px-4 py-3 text-gray-500">{item.partNumber}</td>
                              <td className="px-4 py-3">
                                {warehouses.find(w => w.id === item.warehouseId)?.name || 'Central Store'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl">
                    <div>
                      <p className="text-sm font-bold">Import Summary</p>
                      <p className="text-xs text-white/50">
                        {previewItems.filter(p => !items.some(e => e.serialNumber === p.serialNumber)).length} unique items will be added.
                      </p>
                    </div>
                    <button 
                      onClick={handleCommitBulk}
                      className="px-10 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all shadow-lg"
                    >
                      Process Final Import
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(isAdding || editingItem) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setIsAdding(false); setEditingItem(null); setOriginalSN(null); }}></div>
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-800">{editingItem ? 'Edit Inventory Item' : 'New Inventory Item'}</h3>
              <button onClick={() => { setIsAdding(false); setEditingItem(null); setOriginalSN(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={editingItem ? handleUpdateSubmit : handleAddSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Serial Number</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Enter unique S/N"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono" 
                    value={editingItem ? editingItem.serialNumber : formData.serialNumber} 
                    onChange={(e) => editingItem ? setEditingItem({...editingItem, serialNumber: e.target.value}) : setFormData({...formData, serialNumber: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Part Number</label>
                  <input type="text" required placeholder="P/N" className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none" value={editingItem ? editingItem.partNumber : formData.partNumber} onChange={(e) => editingItem ? setEditingItem({...editingItem, partNumber: e.target.value}) : setFormData({...formData, partNumber: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Board Name</label>
                  <input type="text" required placeholder="Friendly name" className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none" value={editingItem ? editingItem.boardName : formData.boardName} onChange={(e) => editingItem ? setEditingItem({...editingItem, boardName: e.target.value}) : setFormData({...formData, boardName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Category</label>
                  <input type="text" required placeholder="e.g. Logic, Power" className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none" value={editingItem ? editingItem.category : formData.category} onChange={(e) => editingItem ? setEditingItem({...editingItem, category: e.target.value}) : setFormData({...formData, category: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Warehouse</label>
                  <select className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer" value={editingItem ? editingItem.warehouseId : formData.warehouseId} onChange={(e) => editingItem ? setEditingItem({...editingItem, warehouseId: e.target.value}) : setFormData({...formData, warehouseId: e.target.value})}>
                    {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
                  </select>
                </div>
                {editingItem && (
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Operational Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.values(ItemStatus).map(status => (
                        <button key={status} type="button" onClick={() => setEditingItem({...editingItem, status: status})} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${editingItem.status === status ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-100 hover:border-indigo-100'}`}>{status}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => { setIsAdding(false); setEditingItem(null); setOriginalSN(null); }} className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-all">Cancel</button>
                <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
                  {editingItem ? 'Save Changes' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default Inventory;
