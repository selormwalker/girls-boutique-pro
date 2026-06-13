import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { API_URL } from '../apiConfig';

const AdminLogin: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/admin/login`, { password });
      localStorage.setItem('adminToken', response.data.token);
      navigate('/admin/dashboard');
    } catch {
      setError('Incorrect password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-12 rounded-3xl shadow-luxe w-full max-w-md text-center border border-brand-light"
      >
        <img src="/logo.jpg" alt="Logo" className="h-16 mx-auto mb-8 rounded-lg" />
        <h2 className="text-2xl font-black mb-2">Shop Manager</h2>
        <p className="text-brand-zinc text-xs uppercase tracking-widest mb-8">Enter your master password</p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <input 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full text-center text-2xl tracking-[0.5em] p-4 bg-brand-light border border-zinc-200 rounded-2xl outline-none focus:border-brand-rose transition"
          />
          {error && <p className="text-brand-rose text-xs font-bold uppercase tracking-wider">{error}</p>}
          <button type="submit" className="w-full bg-brand-dark text-white py-4 rounded-xl font-bold hover:bg-brand-rose transition">
            Sign In
          </button>
        </form>
        
        <button onClick={() => navigate('/')} className="mt-8 text-xs font-bold text-brand-zinc hover:text-brand-rose uppercase tracking-widest transition">
          Return to Website
        </button>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
