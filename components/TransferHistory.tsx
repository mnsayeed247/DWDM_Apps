
import React, { useState, useMemo } from 'react';
import { TransferLog, Warehouse } from '../types';
import { format } from 'date-fns';
// Added History to the import list to avoid conflict with the global History object
import { Calendar, Filter, Search, User, Download, History } from 'lucide-react';

interface TransferHistoryProps {
  logs: TransferLog[];
  warehouses: Warehouse[];
}

const TransferHistory: React.FC<TransferHistoryProps> = ({ logs, warehouses }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('all');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.boardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesWarehouse = 
        filterWarehouse === 'all' || 
        log.fromWarehouseId === filterWarehouse || 
        log.toWarehouseId === filterWarehouse;

      return matchesSearch && matchesWarehouse;
    });
  }, [logs, searchTerm, filterWarehouse]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search logs by Serial, Board or User..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center space-x-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
            <Filter className="w-4 h-4 text-gray-500" />
            <select 
              className="bg-transparent text-sm font-medium outline-none"
              value={filterWarehouse}
              onChange={(e) => setFilterWarehouse(e.target.value)}
            >
              <option value="all">Any Warehouse</option>
              {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
            </select>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 text-indigo-600 font-medium hover:bg-indigo-50 rounded-xl transition-colors">
            <Download className="w-5 h-5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredLogs.map((log) => (
          <div key={log.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:border-indigo-200 transition-all flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded uppercase tracking-wider">
                  {log.fromWarehouseId === 'EXTERNAL' ? 'Initial Addition' : 'Inter-Warehouse'}
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-sm font-mono text-gray-500">{log.serialNumber}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{log.boardName}</h3>
              <p className="text-sm text-gray-500 italic mt-1">&ldquo;{log.reason}&rdquo;</p>
            </div>

            <div className="flex items-center justify-center space-x-6 shrink-0">
              <div className="text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">From</p>
                <p className="text-sm font-semibold text-gray-700">
                  {warehouses.find(w => w.id === log.fromWarehouseId)?.name || 'External Vendor'}
                </p>
              </div>
              <div className="text-indigo-400">
                <ArrowRight className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">To</p>
                <p className="text-sm font-semibold text-gray-700">
                  {warehouses.find(w => w.id === log.toWarehouseId)?.name}
                </p>
              </div>
            </div>

            <div className="flex flex-col md:items-end justify-center md:border-l border-gray-100 md:pl-6 shrink-0 space-y-2">
              <div className="flex items-center space-x-2 text-gray-600">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">{log.user}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{format(log.timestamp, 'MMM d, yyyy • HH:mm')}</span>
              </div>
            </div>
          </div>
        ))}
        {filteredLogs.length === 0 && (
          <div className="text-center py-20">
            <History className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400">No transfer history recorded</h3>
            <p className="text-gray-400">Try adjusting your filters or search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ArrowRight: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

export default TransferHistory;
