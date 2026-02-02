
import React, { useState, useMemo } from 'react';
import { 
  InventoryItem, 
  Warehouse, 
  TransferLog, 
  ItemStatus 
} from '../types';
import { ArrowRight, Package, Info, AlertTriangle, Send, CheckCircle2, Search } from 'lucide-react';

interface TransfersProps {
  items: InventoryItem[];
  warehouses: Warehouse[];
  onTransfer: (log: TransferLog) => void;
  user: string;
  canEdit: boolean;
}

const Transfers: React.FC<TransfersProps> = ({ items, warehouses, onTransfer, user, canEdit }) => {
  const [fromWhId, setFromWhId] = useState('');
  const [toWhId, setToWhId] = useState('');
  const [selectedSNS, setSelectedSNS] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const availableItems = useMemo(() => {
    if (!fromWhId) return [];
    return items.filter(i => i.warehouseId === fromWhId && i.status !== ItemStatus.FAULTY);
  }, [fromWhId, items]);

  const filteredItems = useMemo(() => {
    return availableItems.filter(i => 
      i.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.boardName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableItems, searchTerm]);

  const toggleSelect = (sn: string) => {
    setSelectedSNS(prev => 
      prev.includes(sn) ? prev.filter(s => s !== sn) : [...prev, sn]
    );
  };

  const handleBulkTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSNS.length === 0 || !toWhId || !reason) return;

    selectedSNS.forEach(sn => {
      const item = items.find(i => i.serialNumber === sn);
      if (item) {
        const log: TransferLog = {
          id: `tr-bulk-${sn}-${Date.now()}`,
          timestamp: Date.now(),
          itemId: sn,
          serialNumber: sn,
          boardName: item.boardName,
          partNumber: item.partNumber,
          fromWarehouseId: fromWhId,
          toWarehouseId: toWhId,
          reason: reason,
          user: user,
          quantity: 1
        };
        onTransfer(log);
      }
    });

    // Reset
    setFromWhId('');
    setToWhId('');
    setSelectedSNS([]);
    setReason('');
  };

  if (!canEdit) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
        <div className="p-4 bg-amber-50 rounded-full text-amber-600 mb-4">
          <AlertTriangle className="w-12 h-12" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Access Restricted</h3>
        <p className="text-gray-500 max-w-md">Your account role (Viewer) does not have permission to initiate item transfers.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-indigo-50/50">
          <h2 className="text-2xl font-bold text-slate-900">Bulk Warehouse Transfer</h2>
          <p className="text-slate-500">Move multiple DWDM units between any two inventory locations.</p>
        </div>
        
        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Step 1: Source Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center">
              <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs mr-2">1</span>
              Source Warehouse
            </h3>
            <select 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              value={fromWhId}
              onChange={(e) => {
                setFromWhId(e.target.value);
                setSelectedSNS([]);
              }}
            >
              <option value="">Select Origin...</option>
              {warehouses.map(wh => (
                <option key={wh.id} value={wh.id}>{wh.name} ({items.filter(i => i.warehouseId === wh.id).length} units)</option>
              ))}
            </select>

            {fromWhId && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Search items in stock..."
                    className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="max-h-[400px] overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
                  {filteredItems.map(item => (
                    <div 
                      key={item.serialNumber} 
                      onClick={() => toggleSelect(item.serialNumber)}
                      className={`p-3 flex items-center space-x-3 cursor-pointer transition-colors ${selectedSNS.includes(item.serialNumber) ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedSNS.includes(item.serialNumber) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'}`}>
                        {selectedSNS.includes(item.serialNumber) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{item.boardName}</p>
                        <p className="text-xs font-mono text-gray-500">{item.serialNumber}</p>
                      </div>
                    </div>
                  ))}
                  {filteredItems.length === 0 && <p className="p-8 text-center text-sm text-gray-400 italic">No available items found.</p>}
                </div>
                <p className="text-xs text-gray-500 font-medium">Selected: {selectedSNS.length} items</p>
              </div>
            )}
          </div>

          {/* Step 2: Destination & Logistics */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center">
                  <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs mr-2">2</span>
                  Target Destination
                </h3>
                <select 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  value={toWhId}
                  onChange={(e) => setToWhId(e.target.value)}
                  disabled={!fromWhId}
                >
                  <option value="">Select Destination...</option>
                  {warehouses.filter(wh => wh.id !== fromWhId).map(wh => (
                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center">
                  <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs mr-2">3</span>
                  Reason for Move
                </h3>
                <input 
                  type="text"
                  placeholder="e.g. Project Allocation"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={!fromWhId}
                />
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-gray-100">
              <h4 className="text-sm font-bold text-slate-700 mb-4">Transfer Summary</h4>
              {selectedSNS.length > 0 && toWhId ? (
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">From</p>
                    <p className="text-sm font-bold text-gray-800">{warehouses.find(w => w.id === fromWhId)?.name}</p>
                  </div>
                  <div className="px-8 text-indigo-300">
                    <ArrowRight className="w-8 h-8" />
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">To</p>
                    <p className="text-sm font-bold text-indigo-600">{warehouses.find(w => w.id === toWhId)?.name}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <Repeat className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm italic">Complete steps 1-3 to see summary</p>
                </div>
              )}
            </div>

            <button 
              onClick={handleBulkTransfer}
              disabled={selectedSNS.length === 0 || !toWhId || !reason}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl text-lg font-bold transition-all shadow-lg hover:shadow-indigo-100"
            >
              <Send className="w-5 h-5" />
              <span>Confirm Transfer ({selectedSNS.length} items)</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-indigo-50 p-6 rounded-2xl flex items-start space-x-4 border border-indigo-100">
        <Info className="w-6 h-6 text-indigo-500 shrink-0 mt-1" />
        <div>
          <h4 className="font-bold text-indigo-900">Any-to-Any Logistics</h4>
          <p className="text-sm text-indigo-700 mt-1">
            DWDM Inventory supports full multi-node transfers. Every item move is logged with high precision. Ensure the destination warehouse has adequate rack space before confirming the move.
          </p>
        </div>
      </div>
    </div>
  );
};

const Repeat: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export default Transfers;
