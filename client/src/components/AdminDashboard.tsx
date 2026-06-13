import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { API_URL } from '../apiConfig';
import type { Product } from '../types';
import { 
  Trash2, Edit, LogOut, Package, ShoppingBag, BarChart3, Mail, Upload, CheckCircle, Clock, Truck, AlertTriangle, X, ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Sub-Components ---

const StatCard = ({ title, value, label, icon }: { title: string, value: string | number, label: string, icon: React.ReactNode }) => (
  <div className="bg-white p-6 md:p-8 rounded-3xl border border-brand-light shadow-sm flex justify-between items-center text-brand-dark">
    <div>
      <p className="text-[10px] font-bold text-brand-zinc uppercase tracking-widest mb-2">{title}</p>
      <h3 className="text-4xl font-black text-brand-rose">{value}</h3>
      <p className="text-xs text-brand-zinc mt-1">{label}</p>
    </div>
    <div className="bg-brand-roseLight p-4 rounded-2xl text-brand-rose">
      {icon}
    </div>
  </div>
);

// --- Custom Confirmation Modal ---
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, type = 'info', confirmText = 'Proceed' }: any) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 text-center border border-brand-light relative overflow-hidden"
        >
          <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${type === 'danger' ? 'bg-rose-100 text-rose-500' : 'bg-brand-roseLight text-brand-rose'}`}>
            {type === 'danger' ? <ShieldAlert size={32} /> : <AlertTriangle size={32} />}
          </div>
          
          <h3 className="text-2xl font-black text-brand-dark mb-4 uppercase tracking-tighter">{title}</h3>
          <p className="text-brand-zinc text-sm font-medium mb-10 leading-relaxed px-4">{message}</p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={onConfirm}
              className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition shadow-lg ${
                type === 'danger' ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20' : 'bg-brand-dark text-white hover:bg-brand-rose shadow-brand-dark/20'
              }`}
            >
              {confirmText}
            </button>
            <button 
              onClick={onCancel}
              className="w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] text-brand-zinc hover:bg-brand-light transition"
            >
              Wait, Cancel
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// --- Main Dashboard ---

interface OrderItem { id: string; name: string; price: number; quantity: number; }
interface OrderData { id: string; status: string; total: number; createdAt: string; items: OrderItem[]; }
interface ChartPoint { createdAt: string; _sum: { total: number; }; }
interface AnalyticsData { productCount: number; orderCount: number; subscriberCount: number; revenue: number; chartData: ChartPoint[]; }
interface SubscriberData { id: string; email: string; createdAt: string; }

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberData[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({ productCount: 0, orderCount: 0, subscriberCount: 0, revenue: 0, chartData: [] });
  const [settings, setSettings] = useState({ whatsapp: '', promoMessage: '', shopName: '' });
  
  const [formData, setFormData] = useState({ name: '', description: '', price: '', category: 'Ready-to-wear', colors: '' });
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modal State
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; type?: 'info' | 'danger'; confirmText?: string } | null>(null);
  
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');
  const config = useMemo(() => ({ headers: { 'Authorization': `Bearer ${token}` } }), [token]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const closeConfirm = () => setConfirmState(null);

  const fetchData = useCallback(async () => {
    try {
      const [prodRes, orderRes, analRes, subRes, setRes] = await Promise.all([
        axios.get('http://localhost:5000/api/products'),
        axios.get('http://localhost:5000/api/orders', config),
        axios.get('http://localhost:5000/api/analytics', config),
        axios.get('http://localhost:5000/api/newsletter', config),
        axios.get('http://localhost:5000/api/settings')
      ]);
      setProducts(prodRes.data);
      setOrders(orderRes.data);
      setAnalytics(analRes.data);
      setSubscribers(subRes.data);
      setSettings(setRes.data);
    } catch { console.error("Sync Error"); }
  }, [config]);

  useEffect(() => {
    if (!token) { navigate('/admin'); return; }
    fetchData();
  }, [token, navigate, fetchData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPreviewUrl(URL.createObjectURL(file));
      const reader = new FileReader();
      reader.onloadend = () => setImageBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const executeSubmit = async () => {
    closeConfirm();
    setIsSyncing(true);
    const payload = { ...formData, image: imageBase64 };
    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/products/${editingId}`, payload, config);
        showToast('Piece updated in cloud');
      } else {
        await axios.post('http://localhost:5000/api/products', payload, config);
        showToast('New arrival live!');
      }
      setFormData({ name: '', description: '', price: '', category: 'Ready-to-wear', colors: '' });
      setImageBase64(null); setPreviewUrl(null); setEditingId(null);
      
      const prodRes = await axios.get('http://localhost:5000/api/products');
      setProducts(prodRes.data);
    } catch { 
      showToast('Action failed', 'error');
    }
    finally { setIsSyncing(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmState({
      isOpen: true,
      title: editingId ? 'Update Piece?' : 'Confirm Upload',
      message: editingId ? 'This will update the product details across the entire shop.' : 'Are you ready to make this new arrival visible to customers?',
      confirmText: editingId ? 'Update Now' : 'Launch Piece',
      onConfirm: executeSubmit
    });
  };

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      await axios.put(`http://localhost:5000/api/orders/${id}`, { status }, config);
      showToast(`Marked as ${status}`);
      const ordRes = await axios.get('http://localhost:5000/api/orders', config);
      setOrders(ordRes.data);
    } catch { showToast('Update failed', 'error'); }
  };

  const executeSaveSettings = async () => {
    closeConfirm();
    try {
      await axios.put('http://localhost:5000/api/settings', settings, config);
      showToast('Configurations synced');
    } catch { showToast('Sync failed', 'error'); }
  };

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmState({
      isOpen: true,
      title: 'Sync Settings?',
      message: 'This will instantly update your WhatsApp, Shop Name, and Banner message on the live site.',
      confirmText: 'Sync Now',
      onConfirm: executeSaveSettings
    });
  };

  const executeDelete = async (id: string) => {
    closeConfirm();
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`, config);
      showToast('Piece removed permanently');
      const prodRes = await axios.get('http://localhost:5000/api/products');
      setProducts(prodRes.data);
    } catch { showToast('Delete failed', 'error'); }
  };

  const handleDelete = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Permanent Delete?',
      message: 'This will permanently remove this piece from your shop and cloud storage. This cannot be undone.',
      type: 'danger',
      confirmText: 'Delete Forever',
      onConfirm: () => executeDelete(id)
    });
  };

  return (
    <div className="min-h-screen bg-brand-light py-12 md:py-20 text-brand-dark overflow-x-hidden font-sans">
      <ConfirmModal 
        isOpen={confirmState?.isOpen}
        title={confirmState?.title}
        message={confirmState?.message}
        type={confirmState?.type}
        confirmText={confirmState?.confirmText}
        onConfirm={confirmState?.onConfirm}
        onCancel={closeConfirm}
      />

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-10 left-1/2 z-[9999] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest border border-white/20 backdrop-blur-xl ${
              toast.type === 'success' ? 'bg-emerald-500 text-white' : toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-brand-dark text-white'
            }`}
          >
            {toast.type === 'success' && <CheckCircle size={18} />}
            {toast.type === 'error' && <AlertTriangle size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-6 text-brand-dark">
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 bg-white p-6 md:p-8 rounded-3xl border border-brand-light shadow-sm">
          <div className="flex items-center gap-6 text-brand-dark">
            <img src="/logo.jpg" alt="" className="h-16 rounded-xl border border-brand-light shadow-sm" />
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-brand-dark uppercase tracking-tighter">Business Center</h1>
              <p className="text-brand-zinc text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Cloud Sync Active
              </p>
            </div>
          </div>
          <button 
            onClick={() => { localStorage.removeItem('adminToken'); navigate('/admin'); }} 
            className="flex items-center gap-2 bg-brand-dark text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-brand-rose transition shadow-md"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Inventory" value={analytics.productCount} label="Items Live" icon={<Package size={28} />} />
          <StatCard title="Active Orders" value={analytics.orderCount} label="Customer Requests" icon={<ShoppingBag size={28} />} />
          <StatCard title="Total Revenue" value={`₵${analytics.revenue.toLocaleString()}`} label="Gross Booked" icon={<BarChart3 size={28} />} />
          <StatCard title="Community" value={analytics.subscriberCount} label="Subscribers" icon={<Mail size={28} />} />
        </div>

        <div className="flex overflow-x-auto gap-4 mb-8 border-b border-zinc-200 pb-4 no-scrollbar">
          {['inventory', 'orders', 'customers', 'analytics', 'settings'].map(tab => (
            <button 
              key={tab}
              className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition ${activeTab === tab ? 'bg-brand-rose text-white shadow-lg shadow-brand-rose/20' : 'bg-white text-brand-zinc hover:bg-zinc-50'}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'inventory' && (
            <motion.div key="inv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-8">
              <div className="bg-white p-8 rounded-3xl border border-brand-light shadow-sm h-fit">
                <div className="flex justify-between items-center mb-6 text-brand-dark">
                  <h3 className="font-black text-xl uppercase tracking-tighter">{editingId ? 'Modify Piece' : 'Add New Entry'}</h3>
                  {editingId && <button onClick={() => { setEditingId(null); setFormData({name:'', description:'', price:'', category:'Ready-to-wear', colors:''}); setPreviewUrl(null); }} className="text-brand-zinc hover:text-brand-rose"><X size={20} /></button>}
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input placeholder="Product Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full p-4 bg-brand-light rounded-xl outline-none focus:border-brand-rose border border-transparent transition text-sm font-bold text-brand-dark" />
                  <input placeholder="Price (GHS)" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required className="w-full p-4 bg-brand-light rounded-xl outline-none focus:border-brand-rose border border-transparent transition text-sm font-bold text-brand-dark" />
                  <input type="file" accept="image/*" onChange={handleFileChange} id="f-up" className="hidden" />
                  <label htmlFor="f-up" className="w-full p-4 border-2 border-dashed border-zinc-300 rounded-xl flex items-center justify-center gap-3 cursor-pointer text-brand-zinc hover:bg-brand-light transition text-sm font-bold">
                    {previewUrl ? <img src={previewUrl} className="h-10 rounded-md shadow-sm" alt="" /> : <><Upload size={18} /> Upload Photo</>}
                  </label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-4 bg-brand-light rounded-xl outline-none focus:border-brand-rose border border-transparent transition text-sm font-bold text-brand-dark">
                    <option>Ready-to-wear</option><option>Shoes</option><option>Bags</option>
                  </select>
                  <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-brand-light rounded-xl outline-none focus:border-brand-rose border border-transparent transition text-sm font-bold h-24 resize-none text-brand-dark" />
                  <button type="submit" disabled={isSyncing} className="w-full bg-brand-dark text-white py-4 rounded-xl font-bold hover:bg-brand-rose transition uppercase text-xs tracking-widest shadow-lg shadow-brand-dark/10">
                    {isSyncing ? 'Syncing...' : editingId ? 'Update Piece' : 'Save Product'}
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-3xl border border-brand-light shadow-sm overflow-hidden">
                <table className="w-full text-left text-brand-dark">
                  <thead className="bg-brand-light font-black text-brand-dark">
                    <tr><th className="p-6 text-[10px] tracking-widest uppercase">Product</th><th className="p-6 text-[10px] tracking-widest uppercase">Price</th><th className="p-6 text-[10px] tracking-widest uppercase text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {products.length === 0 ? (
                      <tr><td colSpan={3} className="p-20 text-center text-brand-zinc font-black uppercase text-xs tracking-widest">Inventory Empty</td></tr>
                    ) : (
                      products.map((p: Product) => (
                        <tr key={p.id} className="hover:bg-zinc-50 transition">
                          <td className="p-6 flex items-center gap-4"><img src={p.image} className="w-12 h-16 object-cover rounded-lg shadow-sm" alt="" /><span className="font-bold text-sm uppercase tracking-tighter text-brand-dark">{p.name}</span></td>
                          <td className="p-6 font-black text-sm text-brand-dark">₵{p.price.toFixed(2)}</td>
                          <td className="p-6 text-right space-x-2">
                            <button onClick={() => { setEditingId(p.id); setFormData({ name: p.name, description: p.description, price: p.price.toString(), category: p.category, colors: '' }); setPreviewUrl(p.image); }} className="w-10 h-10 rounded-full bg-brand-light text-brand-zinc hover:bg-brand-dark hover:text-white transition inline-flex items-center justify-center shadow-sm"><Edit size={14} /></button>
                            <button onClick={() => handleDelete(p.id)} className="w-10 h-10 rounded-full bg-brand-roseLight text-brand-rose hover:bg-brand-rose hover:text-white transition inline-flex items-center justify-center shadow-sm"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div key="ord" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl border border-brand-light shadow-sm overflow-hidden text-brand-dark">
              <table className="w-full text-left">
                <thead className="bg-brand-light text-brand-dark font-black">
                  <tr><th className="p-6 text-[10px] tracking-widest uppercase">Identity</th><th className="p-6 text-[10px] tracking-widest uppercase">Total</th><th className="p-6 text-[10px] tracking-widest uppercase">Status</th><th className="p-6 text-[10px] tracking-widest uppercase text-right">Update</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {orders.length === 0 ? (
                    <tr><td colSpan={4} className="p-20 text-center text-brand-zinc font-black uppercase text-xs tracking-widest">No orders tracked yet</td></tr>
                  ) : (
                    orders.map(o => (
                      <tr key={o.id}>
                        <td className="p-6">
                          <p className="font-black text-sm uppercase tracking-tighter text-brand-dark">#{o.id.slice(-6).toUpperCase()}</p>
                          <p className="text-[10px] font-bold text-brand-zinc">{new Date(o.createdAt).toLocaleString()}</p>
                        </td>
                        <td className="p-6 font-black text-brand-dark">₵{o.total.toFixed(2)}</td>
                        <td className="p-6">
                          <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${o.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : o.status === 'shipped' ? 'bg-blue-100 text-blue-700' : 'bg-brand-roseLight text-brand-rose'}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="p-6 text-right flex justify-end gap-2 text-brand-dark">
                          <button onClick={() => updateOrderStatus(o.id, 'pending')} className="w-10 h-10 rounded-full bg-brand-light text-brand-zinc hover:bg-brand-rose hover:text-white transition inline-flex items-center justify-center shadow-sm"><Clock size={14} /></button>
                          <button onClick={() => updateOrderStatus(o.id, 'shipped')} className="w-10 h-10 rounded-full bg-brand-light text-brand-zinc hover:bg-blue-500 hover:text-white transition inline-flex items-center justify-center shadow-sm"><Truck size={14} /></button>
                          <button onClick={() => updateOrderStatus(o.id, 'delivered')} className="w-10 h-10 rounded-full bg-brand-light text-brand-zinc hover:bg-emerald-500 hover:text-white transition inline-flex items-center justify-center shadow-sm"><CheckCircle size={14} /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </motion.div>
          )}

          {activeTab === 'customers' && (
            <motion.div key="cust" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl border border-brand-light shadow-sm overflow-hidden text-brand-dark">
              <table className="w-full text-left">
                <thead className="bg-brand-light font-black text-brand-dark">
                  <tr><th className="p-6 text-[10px] tracking-widest uppercase">Email Address</th><th className="p-6 text-[10px] tracking-widest uppercase">Joined On</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {subscribers.length === 0 ? (
                    <tr><td colSpan={2} className="p-20 text-center text-brand-zinc font-black uppercase text-xs tracking-widest">Mailing list is empty</td></tr>
                  ) : (
                    subscribers.map(s => (
                      <tr key={s.id}>
                        <td className="p-6 font-bold text-sm uppercase tracking-tighter text-brand-dark">{s.email}</td>
                        <td className="p-6 text-brand-zinc text-[10px] uppercase font-bold tracking-widest">{new Date(s.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div key="anal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 text-brand-dark">
              <div className="bg-white p-10 rounded-[2.5rem] border border-brand-light shadow-sm">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="font-black text-2xl uppercase tracking-tighter text-brand-dark">Business Pulse</h3>
                    <p className="text-brand-zinc text-[10px] font-black uppercase tracking-[0.2em] mt-1">Last 7 Days Activity</p>
                  </div>
                  <div className="bg-brand-roseLight px-4 py-2 rounded-full font-black text-[10px] text-brand-rose uppercase tracking-widest">Live Sync</div>
                </div>
                <div style={{ width: '100%', height: 350 }}>
                  <ResponsiveContainer>
                    <LineChart data={analytics.chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                      <XAxis dataKey="createdAt" tickFormatter={(v) => new Date(v).toLocaleDateString()} stroke="#71717a" fontSize={10} fontWeight="bold" />
                      <YAxis stroke="#71717a" fontSize={10} fontWeight="bold" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                        itemStyle={{ color: '#f43f5e' }}
                      />
                      <Line type="monotone" dataKey="_sum.total" stroke="#f43f5e" strokeWidth={6} dot={{ r: 8, fill: '#f43f5e', stroke: '#fff', strokeWidth: 4 }} activeDot={{ r: 10 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="set" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-10 rounded-[2.5rem] border border-brand-light shadow-sm max-w-2xl mx-auto text-brand-dark">
              <div className="flex items-center gap-4 mb-10">
                <div className="bg-brand-dark p-3 rounded-2xl text-white"><BarChart3 size={24} /></div>
                <h3 className="font-black text-2xl uppercase tracking-tighter text-brand-dark">Store Config</h3>
              </div>
              <form onSubmit={saveSettings} className="space-y-8">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 block opacity-60">WhatsApp Business Number</label>
                  <input value={settings.whatsapp} onChange={e => setSettings({...settings, whatsapp: e.target.value})} className="w-full p-5 bg-brand-light rounded-2xl outline-none focus:ring-2 ring-brand-rose/20 transition font-black text-brand-dark" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 block opacity-60">Global Promotional Message</label>
                  <input value={settings.promoMessage} onChange={e => setSettings({...settings, promoMessage: e.target.value})} className="w-full p-5 bg-brand-light rounded-2xl outline-none focus:ring-2 ring-brand-rose/20 transition font-black text-brand-dark" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 block opacity-60">Official Boutique Name</label>
                  <input value={settings.shopName} onChange={e => setSettings({...settings, shopName: e.target.value})} className="w-full p-5 bg-brand-light rounded-2xl outline-none focus:ring-2 ring-brand-rose/20 transition font-black text-brand-dark" />
                </div>
                <button type="submit" className="w-full bg-brand-dark text-white py-6 rounded-[2rem] font-black hover:bg-brand-rose transition uppercase text-xs tracking-[0.2em] shadow-2xl shadow-brand-dark/20">
                  Update Store Settings
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminDashboard;
