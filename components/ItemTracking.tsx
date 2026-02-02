
import React, { useState, useMemo } from 'react';
import { InventoryItem, TransferLog } from '../types';
import { Search, ChevronRight, Package, Clock, User, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';

interface ItemTrackingProps {
  logs: TransferLog[];
  items: InventoryItem[];
  initialSN: string;
}

const ItemTracking: React.FC<ItemTrackingProps> = ({ logs, items, initialSN }) => {
  const [searchSN, setSearchSN] = useState(initialSN);

  const trackingData = useMemo(() => {
    if (!searchSN) return null;
    const item = items.find(i => i.serialNumber === searchSN);
    const history = logs.filter(l => l.serialNumber === searchSN).sort((a, b) => b.timestamp - a.timestamp);
    return item ? { item, history } : null;
  }, [searchSN, items, logs]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Enter Serial Number to Trace History</label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="e.g. SN-X1001" 
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono transition-all"
            value={searchSN}
            onChange={(e) => setSearchSN(e.target.value)}
          />
        </div>
      </div>

      {trackingData ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Item Info Card */}
          <div className="bg-indigo-600 text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-white/20 rounded-2xl">
                <Package className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{trackingData.item.boardName}</h3>
                <p className="text-white/70 font-mono">{trackingData.item.serialNumber}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-center px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                <p className="text-[10px] font-bold uppercase text-white/60">Category</p>
                <p className="font-semibold">{trackingData.item.category}</p>
              </div>
              <div className="text-center px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                <p className="text-[10px] font-bold uppercase text-white/60">Current Status</p>
                <p className="font-semibold">{trackingData.item.status}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-8 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-indigo-500" />
              Full Movement Timeline
            </h3>

            <div className="relative space-y-12 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-50">
              {trackingData.history.map((log, idx) => (
                <div key={log.id} className="relative pl-12">
                  <div className={`absolute left-0 top-1 w-10 h-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${idx === 0 ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                    {idx === 0 ? <ArrowRightLeft className="w-5 h-5 text-white" /> : <div className="w-2 h-2 bg-gray-400 rounded-full"></div>}
                  </div>
                  
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                      <div>
                        <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">{format(log.timestamp, 'MMMM d, yyyy')}</span>
                        <h4 className="text-base font-bold text-gray-900 mt-1">{log.reason}</h4>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-xs">
                        <User className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">{log.user}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 bg-white/80 p-3 rounded-xl border border-dashed border-gray-200">
                      <div className="flex-1 text-center">
                        <span className="text-[10px] block text-gray-400 uppercase font-bold">Origin</span>
                        <span className="text-sm font-semibold text-gray-700">{log.fromWarehouseId === 'EXTERNAL' ? 'Vendor / Source' : 'Warehouse A'}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                      <div className="flex-1 text-center">
                        <span className="text-[10px] block text-gray-400 uppercase font-bold">Destination</span>
                        <span className="text-sm font-semibold text-gray-700">Warehouse B</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : searchSN ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-400">Item not found</h3>
          <p className="text-gray-400">Please verify the serial number and try again.</p>
        </div>
      ) : (
        <div className="text-center py-20">
          <Search className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400">Enter a serial number above to view its journey.</p>
        </div>
      )}
    </div>
  );
};

export default ItemTracking;
