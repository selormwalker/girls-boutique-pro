import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, Heart, CheckCircle2, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import type { Product, CartItem } from '../types';
import { fetchProducts } from '../services/api';

const Storefront: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [settings, setSettings] = useState({ whatsapp: '233552850088', promoMessage: '', shopName: 'GIRLS BOUTIQUE GH' });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const getData = async () => {
      try {
        const [prodRes, setRes] = await Promise.all([
          fetchProducts(),
          axios.get('http://localhost:5000/api/settings')
        ]);
        setProducts(Array.isArray(prodRes) ? prodRes : []);
        if (setRes.data && typeof setRes.data === 'object') {
          setSettings(prev => ({ ...prev, ...setRes.data }));
        }
      } catch {
        console.error("Data fetch failed");
      } finally {
        setLoading(false);
      }
    };
    void getData();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    let result = [...products];
    if (activeCategory !== 'All') result = result.filter(p => p.category === activeCategory);
    if (search) result = result.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));
    
    if (sortBy === 'price-low') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') result.sort((a, b) => b.price - a.price);
    return result;
  }, [search, activeCategory, products, sortBy]);

  const relatedProducts = useMemo(() => {
    if (!selectedProduct || !Array.isArray(products)) return [];
    return products.filter(p => p.id !== selectedProduct.id && (p.category === selectedProduct.category)).slice(0, 3);
  }, [selectedProduct, products]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
    showToast('Added to bag');
    setSelectedProduct(null);
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };

  const handleCheckout = async () => {
    const totalVal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    try {
      await axios.post('http://localhost:5000/api/orders', { items: cart, total: totalVal });
    } catch { console.error("Order tracking failed"); }

    const details = cart.map(item => `- ${item.name} (x${item.quantity})`).join('\n');
    const message = `Hello ${settings.shopName}! I'd like to order:\n\n${details}\n\nTotal: GHS ${totalVal.toFixed(2)}`;
    window.open(`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleNewsletter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const emailInput = form.elements.namedItem('email') as HTMLInputElement;
    if (!emailInput) return;
    const email = emailInput.value;
    try {
      await axios.post('http://localhost:5000/api/newsletter', { email });
      setToast("Welcome to the circle!");
      form.reset();
    } catch { setToast("Error joining"); }
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  const categories = ['All', 'Ready-to-wear', 'Shoes', 'Bags'];

  return (
    <div className="min-h-screen bg-white text-brand-dark font-sans overflow-x-hidden">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-24 left-1/2 -translate-x-1/2 z-[5000] bg-brand-dark text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-luxe font-bold text-sm">
            <CheckCircle2 size={18} className="text-brand-rose" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {settings?.promoMessage && (
        <div className="bg-brand-dark text-white text-[10px] font-black tracking-[0.2em] py-3 text-center uppercase relative z-[60]">
          {settings.promoMessage}
        </div>
      )}

      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-brand-light h-20 flex items-center">
        <div className="container mx-auto px-6 flex justify-between items-center w-full">
          <a href="/" className="flex items-center gap-3 font-black text-xl tracking-tight no-underline text-brand-dark">
            <img src="/logo.jpg" alt="Logo" className="h-10 w-10 rounded-full object-cover border border-brand-light shadow-sm" />
            {settings?.shopName || 'GIRLS BOUTIQUE GH'}
          </a>
          <button onClick={() => setIsCartOpen(true)} className="flex items-center gap-2 bg-brand-roseLight text-brand-rose px-5 py-2 rounded-full font-bold text-sm hover:bg-brand-rose hover:text-white transition">
            <ShoppingBag size={18} /> {count} Items
          </button>
        </div>
      </header>

      <section className="relative py-32 md:py-48 text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/banner.png" alt="Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>
        <div className="relative z-10 px-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-8xl font-black mb-6 tracking-tighter uppercase font-serif text-white drop-shadow-2xl"
          >
            Luxury Made Simple.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-zinc-200 text-lg md:text-xl font-medium max-w-2xl mx-auto drop-shadow-lg"
          >
            Hand-picked styles for the modern woman.
          </motion.p>
        </div>
      </section>

      <main className="container mx-auto px-6 py-20 bg-white">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-brand-light p-6 rounded-[2rem] mb-16 border border-brand-light">
          <div className="flex gap-2 overflow-x-auto no-scrollbar w-full lg:w-auto">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition ${activeCategory === cat ? 'bg-brand-rose text-white shadow-lg shadow-brand-rose/20' : 'bg-white text-brand-zinc hover:bg-zinc-50'}`}>
                {cat}
              </button>
            ))}
          </div>
          
          <div className="flex gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-zinc" />
              <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-white border-none rounded-full py-3 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 ring-brand-rose/20 transition text-brand-dark" />
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-white border-none rounded-full px-6 py-3 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer text-brand-dark">
              <option value="newest">Newest</option>
              <option value="price-low">Price Low</option>
              <option value="price-high">Price High</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {loading ? Array(4).fill(0).map((_, i) => <div key={i} className="animate-pulse bg-brand-light aspect-[4/5] rounded-[2rem]" />) :
            filteredProducts.map(product => (
              <motion.div key={product.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="group">
                <div className="aspect-[4/5] bg-brand-light rounded-[2rem] overflow-hidden mb-6 relative cursor-zoom-in border border-brand-light shadow-sm" onClick={() => setSelectedProduct(product)}>
                  <img src={product.image || 'https://via.placeholder.com/400'} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" alt="" />
                  <button onClick={(e) => { e.stopPropagation(); setWishlist(prev => prev.includes(product.id) ? prev.filter(i => i !== product.id) : [...prev, product.id]); }} className="absolute top-6 right-6 bg-white/90 p-3 rounded-full shadow-lg hover:scale-110 transition backdrop-blur-sm text-brand-dark">
                    <Heart size={18} className={wishlist.includes(product.id) ? 'fill-brand-rose text-brand-rose' : ''} />
                  </button>
                </div>
                <div className="px-2">
                  <p className="text-[10px] font-black text-brand-rose uppercase tracking-[0.2em] mb-2">{product.category}</p>
                  <h3 className="font-black text-xl mb-2 leading-tight uppercase tracking-tighter text-brand-dark">{product.name}</h3>
                  <p className="font-bold text-lg mb-6 text-brand-dark opacity-80">₵{product.price?.toFixed(2)}</p>
                  <button onClick={() => addToCart(product)} className="w-full bg-brand-dark text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition hover:bg-brand-rose hover:shadow-xl shadow-brand-rose/20">Add to Bag</button>
                </div>
              </motion.div>
            ))
          }
        </div>
      </main>

      <section className="bg-brand-dark text-white py-24 px-6 text-center">
        <h2 className="text-4xl font-black mb-6 uppercase tracking-tighter">Join the Muse</h2>
        <p className="text-zinc-400 mb-10 font-medium">Be the first to see our new drops and private sales.</p>
        <form onSubmit={handleNewsletter} className="max-w-md mx-auto flex gap-3">
          <input name="email" type="email" placeholder="YOUR EMAIL" required className="flex-1 bg-white/10 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-brand-rose transition font-bold text-white" />
          <button type="submit" className="bg-brand-rose text-white px-8 rounded-xl font-black uppercase text-[10px] tracking-widest hover:brightness-110 transition">Join</button>
        </form>
      </section>

      <footer className="py-20 text-center border-t border-brand-light bg-white">
        <img src="/logo.jpg" alt="Logo" className="h-14 mx-auto mb-8 rounded-lg" />
        <div className="flex justify-center gap-10 mb-10 text-brand-dark">
          <a href="https://instagram.com/girls_boutique_gh" target="_blank" rel="noreferrer" className="hover:text-brand-rose transition">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
          </a>
          <a href="https://tiktok.com/@girls_boutique_gram" target="_blank" rel="noreferrer" className="hover:text-brand-rose transition">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47V18c0 1.94-.66 3.82-1.88 5.23-1.65 1.91-4.2 2.8-6.64 2.41-2.51-.4-4.64-2.23-5.39-4.71-.74-2.48-.19-5.27 1.48-7.26 1.63-1.93 4.14-2.85 6.64-2.5v4.03c-1.02-.19-2.07.12-2.93.89-.64.57-1.01 1.43-1.01 2.3 0 1.07.54 2.07 1.44 2.64.9.57 2.03.68 3.01.29.98-.38 1.68-1.28 1.68-2.34V.02z"/></svg>
          </a>
          <a href="https://wa.me/233552850088" target="_blank" rel="noreferrer" className="hover:text-brand-rose transition">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.38 0 0 1 8 8v.5z"></path></svg>
          </a>
        </div>
        <p className="text-brand-zinc text-[10px] font-bold tracking-[0.3em]">© 2026 {settings.shopName}</p>
      </footer>

      {/* Bag Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-md z-[1500]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[2000] p-10 shadow-2xl flex flex-col rounded-l-[3rem]">
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-3xl font-black uppercase tracking-tighter text-brand-dark">Your Bag</h2>
                <button onClick={() => setIsCartOpen(false)} className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center hover:rotate-90 transition duration-500 text-brand-dark"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-8 no-scrollbar text-brand-dark">
                {cart.length === 0 ? <p className="text-center py-20 text-brand-zinc font-black uppercase tracking-widest text-xs">Bag is empty</p> :
                  cart.map(item => (
                    <div key={item.id} className="flex gap-6 pb-8 border-b border-brand-light text-brand-dark">
                      <img src={item.image} className="w-24 h-32 object-cover rounded-2xl shadow-sm" alt="" />
                      <div className="flex-1 flex flex-col justify-center text-brand-dark">
                        <h4 className="font-black text-lg uppercase tracking-tighter mb-1">{item.name}</h4>
                        <p className="text-brand-rose font-black text-base mb-4 tracking-tighter">₵{item.price?.toFixed(2)}</p>
                        <div className="flex items-center gap-5">
                          <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 rounded-xl bg-brand-light flex items-center justify-center font-black hover:bg-brand-rose hover:text-white transition text-brand-dark">-</button>
                          <span className="font-black text-sm">{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 rounded-xl bg-brand-light flex items-center justify-center font-black hover:bg-brand-rose hover:text-white transition text-brand-dark">+</button>
                        </div>
                      </div>
                      <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} className="text-brand-zinc hover:text-brand-rose transition"><X size={20} /></button>
                    </div>
                  ))
                }
              </div>
              {cart.length > 0 && (
                <div className="pt-8 mt-6">
                  <div className="flex justify-between font-black text-2xl mb-8 uppercase tracking-tighter text-brand-dark"><span>Subtotal</span><span>₵{total.toFixed(2)}</span></div>
                  <button onClick={handleCheckout} className="w-full bg-brand-dark text-white py-6 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-brand-rose transition shadow-xl shadow-brand-dark/10">Order on WhatsApp</button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quick View Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl" onClick={() => setSelectedProduct(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white w-full max-w-6xl rounded-[3rem] overflow-hidden flex flex-col md:flex-row max-h-[90vh] shadow-[0_40px_100px_rgba(0,0,0,0.3)] text-brand-dark">
              <div className="md:w-1/2 bg-brand-light overflow-hidden">
                <img src={selectedProduct.image} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="md:w-1/2 p-10 md:p-16 relative flex flex-col overflow-y-auto no-scrollbar">
                <button onClick={() => setSelectedProduct(null)} className="absolute top-8 right-8 w-12 h-12 bg-brand-light rounded-full flex items-center justify-center hover:rotate-90 transition duration-500 text-brand-dark"><X size={24} /></button>
                <p className="text-brand-rose font-black text-[10px] uppercase tracking-[0.3em] mb-6">Exclusive {selectedProduct.category}</p>
                <h2 className="text-5xl font-black mb-6 leading-none uppercase tracking-tighter text-brand-dark">{selectedProduct.name}</h2>
                <p className="text-brand-zinc text-lg font-medium mb-10 leading-relaxed">{selectedProduct.description || "A masterfully crafted piece designed for those who demand excellence."}</p>
                <p className="text-4xl font-black text-brand-dark mb-12 tracking-tighter">₵{selectedProduct.price?.toFixed(2)}</p>
                
                <button onClick={() => addToCart(selectedProduct)} className="w-full bg-brand-dark text-white py-6 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-brand-rose transition mb-12 shadow-2xl shadow-brand-dark/20">
                  Add to Bag
                </button>

                {relatedProducts.length > 0 && (
                  <div className="pt-10 border-t border-brand-light">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-3 text-brand-dark"><span className="w-2 h-2 bg-brand-rose rounded-full animate-pulse" /> Complete the Look</h4>
                    <div className="grid grid-cols-3 gap-6">
                      {relatedProducts.map(p => (
                        <div key={p.id} className="cursor-pointer group" onClick={() => setSelectedProduct(p)}>
                          <div className="aspect-[3/4] rounded-2xl overflow-hidden mb-3 bg-brand-light border border-brand-light">
                            <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" alt="" />
                          </div>
                          <p className="text-[9px] font-black uppercase tracking-widest truncate text-brand-dark">{p.name}</p>
                          <p className="text-[9px] text-brand-rose font-black mt-1">₵{p.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Storefront;
