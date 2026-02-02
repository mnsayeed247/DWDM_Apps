
import React, { useMemo } from 'react';
import { 
  InventoryItem, 
  Warehouse, 
  TransferLog, 
  ItemStatus 
} from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRightLeft 
} from 'lucide-react';
import { format } from 'date-fns';

interface DashboardProps {
  items: InventoryItem[];
  warehouses: Warehouse[];
  logs: TransferLog[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard: React.FC<DashboardProps> = ({ items, warehouses, logs }) => {
  const stats = useMemo(() => {
    return {
      total: items.length,
      free: items.filter(i => i.status === ItemStatus.FREE).length,
      used: items.filter(i => i.status === ItemStatus.USED).length,
      faulty: items.filter(i => i.status === ItemStatus.FAULTY).length,
      lowStockCount: items.length < 5 ? items.length : 0 // Simplified mock alert logic
    };
  }, [items]);

  const boardWiseData = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      counts[item.boardName] = (counts[item.boardName] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [items]);

  const statusData = [
    { name: 'Free', value: stats.free },
    { name: 'Used', value: stats.used },
    { name: 'Reserved', value: items.filter(i => i.status === ItemStatus.RESERVED).length },
    { name: 'Faulty', value: stats.faulty },
  ];

  const warehouseDist = useMemo(() => {
    return warehouses.map(wh => {
      const whItems = items.filter(i => i.warehouseId === wh.id);
      return {
        name: wh.name.split(' ')[0], // short name
        count: whItems.length,
        free: whItems.filter(i => i.status === ItemStatus.FREE).length
      };
    });
  }, [items, warehouses]);

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Stock" value={stats.total} icon={<Package className="text-blue-500" />} />
        <StatCard title="Available (Free)" value={stats.free} icon={<CheckCircle className="text-emerald-500" />} />
        <StatCard title="Faulty Units" value={stats.faulty} icon={<AlertTriangle className="text-red-500" />} />
        <StatCard title="Total Transfers" value={logs.length} icon={<ArrowRightLeft className="text-amber-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-indigo-500" />
            Stock Distribution by Warehouse
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={warehouseDist}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" verticalAlign="top" align="right" />
                <Bar name="Total Items" dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar name="Free Items" dataKey="free" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6">Status Summary</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Logs */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Recent Movements</h3>
          <div className="space-y-4">
            {logs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {log.boardName} ({log.serialNumber})
                  </p>
                  <p className="text-xs text-gray-500">
                    {warehouses.find(w => w.id === log.fromWarehouseId)?.name || 'External'} → {warehouses.find(w => w.id === log.toWarehouseId)?.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{format(log.timestamp, 'MMM d, HH:mm')}</p>
                </div>
              </div>
            ))}
            {logs.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No recent movements</p>}
          </div>
        </div>

        {/* Board Stats */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <h3 className="text-lg font-semibold mb-4">Board-wise Distribution</h3>
          <div className="space-y-4">
            {boardWiseData.slice(0, 5).map((board, idx) => (
              <div key={board.name}>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="font-medium text-gray-700">{board.name}</span>
                  <span className="text-gray-500">{board.value} units</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-indigo-500 h-2 rounded-full" 
                    style={{ width: `${(board.value / items.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
    <div className="p-3 bg-gray-50 rounded-xl">
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

export default Dashboard;
