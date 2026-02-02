
import React, { useMemo, useState } from 'react';
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
  ArrowRightLeft,
  Sparkles,
  Loader2,
  BrainCircuit
} from 'lucide-react';
import { format } from 'date-fns';
import { GoogleGenAI } from "@google/genai";

interface DashboardProps {
  items: InventoryItem[];
  warehouses: Warehouse[];
  logs: TransferLog[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard: React.FC<DashboardProps> = ({ items, warehouses, logs }) => {
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const stats = useMemo(() => {
    return {
      total: items.length,
      free: items.filter(i => i.status === ItemStatus.FREE).length,
      used: items.filter(i => i.status === ItemStatus.USED).length,
      faulty: items.filter(i => i.status === ItemStatus.FAULTY).length,
      lowStockCount: items.length < 5 ? items.length : 0
    };
  }, [items]);

  const generateAIInsight = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inventorySummary = {
        totalItems: items.length,
        statusCounts: {
          free: stats.free,
          used: stats.used,
          faulty: stats.faulty
        },
        warehouses: warehouses.map(wh => ({
          name: wh.name,
          count: items.filter(i => i.warehouseId === wh.id).length
        })),
        recentActivity: logs.slice(0, 3).map(l => l.reason)
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this DWDM inventory data and provide 3-4 bullet points of high-level strategic insight or warnings: ${JSON.stringify(inventorySummary)}. Focus on stock health and warehouse balance. Keep it professional and concise.`,
      });

      setAiInsight(response.text || "Unable to generate insights at this time.");
    } catch (error) {
      console.error("AI Generation Error:", error);
      setAiInsight("Error connecting to AI advisor. Please check your API configuration.");
    } finally {
      setIsGenerating(false);
    }
  };

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
        name: wh.name.split(' ')[0],
        count: whItems.length,
        free: whItems.filter(i => i.status === ItemStatus.FREE).length
      };
    });
  }, [items, warehouses]);

  return (
    <div className="space-y-6">
      {/* AI Insight Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 shadow-xl text-white overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
          <BrainCircuit className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-indigo-100" />
              </div>
              <h3 className="text-xl font-bold">Smart Inventory Advisor</h3>
            </div>
            <button 
              onClick={generateAIInsight}
              disabled={isGenerating}
              className="px-4 py-2 bg-white text-indigo-600 rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-50 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
              <span>{isGenerating ? 'Analyzing...' : 'Refresh AI Analysis'}</span>
            </button>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 min-h-[100px]">
            {aiInsight ? (
              <div className="prose prose-invert prose-sm max-w-none">
                <p className="whitespace-pre-line leading-relaxed text-indigo-50 font-medium">
                  {aiInsight}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-indigo-100/60">
                <Sparkles className="w-8 h-8 mb-2 animate-pulse" />
                <p className="text-sm">Click the button above to generate real-time AI inventory insights.</p>
              </div>
            )}
          </div>
        </div>
      </div>

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
                  {statusData.map((_, index) => (
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
            {boardWiseData.slice(0, 5).map((board) => (
              <div key={board.name}>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="font-medium text-gray-700">{board.name}</span>
                  <span className="text-gray-500">{board.value} units</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${(board.value / Math.max(items.length, 1)) * 100}%` }}
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
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
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
