import DashboardLayout from "../layouts/DashboardLayout";
import { 
  Plus, ShoppingCart, TrendingUp, TrendingDown, 
  MoreVertical, Clock, CheckCircle, AlertCircle, XCircle, Star 
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer 
} from 'recharts';

// --- MOCK DATA ---
const statsData = [
  { label: "Total Orders", value: "42", change: "+12%", trend: "up", sub: "Vs. 36 yesterday" },
  { label: "Net Revenue", value: "₹1,240.50", change: "+8%", trend: "up", sub: "Vs. ₹1,148.00 yesterday" },
  { label: "Avg Order Value", value: "₹29.50", change: "-2%", trend: "down", sub: "Vs. ₹30.10 yesterday" },
  { label: "Pending Orders", value: "5", change: "0%", trend: "neutral", sub: "Needs attention" },
];

const chartData = [
  { time: '9am', value: 400 },
  { time: '10am', value: 800 },
  { time: '11am', value: 500 },
  { time: '12pm', value: 1000 },
  { time: '1pm', value: 2000 },
  { time: '2pm', value: 1800 },
  { time: '3pm', value: 2600 },
  { time: '4pm', value: 2200 },
  { time: '5pm', value: 3400 },
  { time: '6pm', value: 2800 },
  { time: '7pm', value: 3800 },
  { time: '8pm', value: 3500 },
  { time: '9pm', value: 4000 },
];

const recentOrders = [
  { id: "#ORD-2458", customer: "Michael S.", items: "2x Pepperoni Pizza, 1x Coke", total: "₹45.50", status: "Cooking", img: "https://i.pravatar.cc/150?u=1" },
  { id: "#ORD-2457", customer: "Sarah J.", items: "1x Vegan Burger, 1x Fries", total: "₹18.00", status: "Ready", img: "https://i.pravatar.cc/150?u=2" },
  { id: "#ORD-2456", customer: "David R.", items: "1x Family Combo", total: "₹55.20", status: "Delivered", img: "https://i.pravatar.cc/150?u=3" },
];

const updates = [
  { type: "new_order", id: "#202", time: "2m ago", title: "New Order #202", desc: "Order received via App. Total: ₹45.00. 3 Items." },
  { type: "delivered", id: "#199", time: "15m ago", title: "Order #199 Delivered", desc: "Driver confirmed delivery to 123 Main St." },
  { type: "stock", id: "stock", time: "32m ago", title: "Low Stock Alert", desc: "Item \"Avocado\" is running low (5 units left)." },
  { type: "cancelled", id: "#195", time: "1h ago", title: "Order #195 Cancelled", desc: "Customer cancelled due to wait time." },
  { type: "review", id: "rev", time: "2h ago", title: "New Review", desc: "5 stars received from James K." },
];

// --- HELPER COMPONENTS ---

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    Cooking: "bg-orange-100 text-orange-700",
    Ready: "bg-blue-100 text-blue-700",
    Delivered: "bg-green-100 text-green-700",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
};

const UpdateIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "new_order": return <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Clock size={18} /></div>;
    case "delivered": return <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600"><CheckCircle size={18} /></div>;
    case "stock": return <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><AlertCircle size={18} /></div>;
    case "cancelled": return <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600"><XCircle size={18} /></div>;
    case "review": return <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"><Star size={18} /></div>;
    default: return <div className="w-10 h-10 rounded-full bg-gray-100" />;
  }
};

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- LEFT MAIN CONTENT (9 Columns) --- */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-500 text-sm mt-1">Good morning, Pizza Palace. Here's what's happening today.</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <Plus size={16} /> Add Menu Item
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm shadow-blue-200">
                <ShoppingCart size={16} /> Create Order
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsData.map((stat, idx) => (
              <div key={idx} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{stat.label}</p>
                  <span className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                    stat.trend === "up" ? "bg-green-100 text-green-700" : 
                    stat.trend === "down" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                  }`}>
                    {stat.trend === "up" ? <TrendingUp size={12} className="mr-1" /> : stat.trend === "down" ? <TrendingDown size={12} className="mr-1" /> : null}
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Chart Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Daily Sales Performance</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-gray-900">$1,240.50</span>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">↑ Today</span>
                </div>
              </div>
              <select className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-100">
                <option>Today</option>
                <option>Yesterday</option>
                <option>Last 7 Days</option>
              </select>
            </div>
            
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#9ca3af' }} 
                    dy={10}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
              <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700">View All</a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="px-6 py-4 font-semibold">Order ID</th>
                    <th className="px-6 py-4 font-semibold">Customer</th>
                    <th className="px-6 py-4 font-semibold">Items</th>
                    <th className="px-6 py-4 font-semibold">Total</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={order.img} alt="" className="w-8 h-8 rounded-full bg-gray-200" />
                          <span className="text-sm text-gray-700 font-medium">{order.customer}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={order.items}>
                        {order.items}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{order.total}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* --- RIGHT SIDEBAR (3 Columns) --- */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-full">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <h2 className="text-lg font-bold text-gray-900">Live Updates</h2>
              </div>
              <button className="text-xs text-gray-500 hover:text-gray-800">Clear</button>
            </div>

            <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:h-[90%] before:w-[2px] before:bg-gray-100">
              {updates.map((update, idx) => (
                <div key={idx} className="relative flex gap-4">
                  <div className="relative z-10 bg-white">
                    <UpdateIcon type={update.type} />
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-semibold text-gray-900">{update.title}</h4>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{update.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {update.desc}
                    </p>
                    {update.type === "new_order" && (
                      <div className="flex gap-2 mt-3">
                        <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700">Accept</button>
                        <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-200">Decline</button>
                      </div>
                    )}
                    {update.type === "stock" && (
                      <button className="mt-2 text-xs font-semibold text-blue-600 hover:underline">
                        Update Inventory
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
