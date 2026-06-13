import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Storefront from './components/Storefront';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Storefront />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
