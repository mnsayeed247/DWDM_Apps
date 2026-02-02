
import React, { useState } from 'react';
import { Warehouse, InventoryItem, ItemStatus } from '../types';
import { Warehouse as WarehouseIcon, MapPin, Package, Layers, Edit2, Check, X, Plus } from 'lucide-react';

interface WarehouseListProps {
  warehouses: Warehouse[];
  items: InventoryItem[];
  canEdit: boolean;
  onUpdate: (wh: Warehouse) => void;
  onAdd: (wh: Warehouse) => void;
}

const WarehouseList: React.FC<WarehouseListProps> = ({ warehouses, items, canEdit, onUpdate, onAdd }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [isAddingWh, setIsAddingWh] = useState(false);

  const startEdit = (wh: Warehouse) => {
    setEditingId(wh.id);
    setEditName(wh.name);
    setEditLocation(wh.location);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (wh: Warehouse) => {
    onUpdate({ ...wh, name: editName, location: editLocation });
    setEditingId(null);
  };

  const handleAddWarehouse = () => {
    if (!editName) return;
    onAdd({
      id: `wh-${Date.now()}`,
      name: editName,
      location: editLocation || 'Main Hub',
      isCentral: false
    });
    setEditName('');
    setEditLocation('');
    setIsAddingWh(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Manage Storage Locations</h3>
        {canEdit && !isAddingWh && (
          <button 
            onClick={() => { setIsAddingWh(true); setEditName(''); setEditLocation(''); }}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Warehouse</span>
          </button>
        )}
      </div>

      {isAddingWh && (
        <div className="bg-indigo-50 border-2 border-dashed border-indigo-200 p-6 rounded-2xl flex flex-col md:flex-row gap-4 items-end animate-in slide-in-from-top-4 duration-300">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">New Warehouse Name</label>
            <input 
              className="w-full px-4 py-2 bg-white border border-indigo-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g. Frankfurt Data Center"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Location / Address</label>
            <input 
              className="w-full px-4 py-2 bg-white border border-indigo-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              placeholder="e.g. Building C, Floor 2"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsAddingWh(false)} className="p-2 bg-white text-gray-400 rounded-xl border border-gray-200"><X /></button>
            <button onClick={handleAddWarehouse} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-md">Create</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {warehouses.map(wh => {
          const whItems = items.filter(i => i.warehouseId === wh.id);
          const freeItems = whItems.filter(i => i.status === ItemStatus.FREE).length;
          const isEditing = editingId === wh.id;

          return (
            <div key={wh.id} className={`bg-white rounded-2xl shadow-sm border ${isEditing ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-gray-100'} overflow-hidden transition-all`}>
              <div className={`p-6 ${wh.isCentral ? 'bg-indigo-600 text-white' : 'bg-white text-slate-900 border-b border-gray-100'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input 
                          className="w-full bg-white text-slate-900 px-3 py-1.5 rounded-lg border border-indigo-300 outline-none"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                        <input 
                          className="w-full bg-white/50 text-slate-700 text-sm px-3 py-1.5 rounded-lg border border-indigo-200 outline-none"
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-xl ${wh.isCentral ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'}`}>
                          <WarehouseIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{wh.name}</h3>
                          <div className={`flex items-center space-x-1 text-sm mt-0.5 ${wh.isCentral ? 'text-white/70' : 'text-gray-500'}`}>
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{wh.location}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {canEdit && (
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <button onClick={() => saveEdit(wh)} className="p-2 bg-emerald-500 text-white rounded-lg shadow-sm"><Check className="w-4 h-4" /></button>
                          <button onClick={cancelEdit} className="p-2 bg-gray-200 text-gray-600 rounded-lg shadow-sm"><X className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <button onClick={() => startEdit(wh)} className={`p-2 rounded-lg transition-colors ${wh.isCentral ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'}`}>
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1 tracking-widest">Stock</p>
                    <p className="text-xl font-bold text-slate-900">{whItems.length}</p>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 rounded-xl">
                    <p className="text-xs font-bold text-emerald-600 uppercase mb-1 tracking-widest">Available</p>
                    <p className="text-xl font-bold text-emerald-700">{freeItems}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-700 flex items-center mb-2">
                    <Layers className="w-4 h-4 mr-2" /> Current Mix
                  </h4>
                  {Array.from(new Set(whItems.map(i => i.category))).slice(0, 3).map(cat => (
                    <div key={cat} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{cat}</span>
                      <span className="text-sm font-semibold text-gray-800">{whItems.filter(i => i.category === cat).length} units</span>
                    </div>
                  ))}
                  {whItems.length === 0 && <p className="text-sm text-gray-400 italic">No inventory currently stored.</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WarehouseList;
