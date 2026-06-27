import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import MasyarakatDashboard from './pages/MasyarakatDashboard';
import PetugasDashboard from './pages/PetugasDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { LogOut } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function App() {
  const [page, setPage] = useState('landing'); // landing, login, register, dashboard
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('simpub_token') || '');
  const [systemSettings, setSystemSettings] = useState({
    systemName: 'SIMPUB Dinsos',
    systemEmail: 'dinsos.simpub@pemda.go.id',
    hotline: '0812-3456-7890',
    address: 'Jl. Bersih No.1, Tengah, Kec. Cibinong, Kabupaten Bogor, Jawa Barat 16914'
  });
  const [toasts, setToasts] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Load user profile if token exists
  useEffect(() => {
    if (token) {
      localStorage.setItem('simpub_token', token);
      fetchUserProfile();
    } else {
      localStorage.removeItem('simpub_token');
      setUser(null);
      if (page === 'dashboard') setPage('landing');
    }
  }, [token]);

  // Fetch Settings pada awal load
  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const fetchSystemSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/settings`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setSystemSettings(data);
      }
    } catch (err) {
      console.error("Gagal memuat pengaturan sistem:", err);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setPage('dashboard');
      } else {
        // Token tidak valid/kedaluwarsa
        showToast('Sesi Anda telah berakhir. Silakan login kembali.', 'error');
        setToken('');
      }
    } catch (err) {
      console.error("Gagal memuat profil user:", err);
      setToken('');
    }
  };

  // Toast System
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove setelah 4 detik
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    setPage('landing');
    setShowLogoutModal(false);
    showToast('Anda berhasil keluar dari sistem.', 'success');
  };

  const handleLoginSuccess = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    setPage('dashboard');
    showToast(`Selamat datang kembali, ${userData.name}!`, 'success');
    fetchSystemSettings();
  };

  // Render Dashboard berdasarkan role
  const renderDashboard = () => {
    if (!user) return null;

    switch (user.role) {
      case 'masyarakat':
        return (
          <MasyarakatDashboard
            user={user}
            token={token}
            showToast={showToast}
            onLogout={() => setShowLogoutModal(true)}
            systemSettings={systemSettings}
            onUpdateProfile={fetchUserProfile}
            API_BASE_URL={API_BASE_URL}
          />
        );
      case 'petugas':
        return (
          <PetugasDashboard
            user={user}
            token={token}
            showToast={showToast}
            onLogout={() => setShowLogoutModal(true)}
            onUpdateProfile={fetchUserProfile}
            API_BASE_URL={API_BASE_URL}
          />
        );
      case 'admin':
        return (
          <AdminDashboard
            user={user}
            token={token}
            showToast={showToast}
            onLogout={() => setShowLogoutModal(true)}
            systemSettings={systemSettings}
            onUpdateSettings={(newSettings) => {
              setSystemSettings(newSettings);
              showToast('Pengaturan sistem berhasil diperbarui!', 'success');
            }}
            onUpdateProfile={fetchUserProfile}
            API_BASE_URL={API_BASE_URL}
          />
        );
      default:
        return <div>Role tidak dikenal.</div>;
    }
  };

  return (
    <>
      {/* Toast Notification Renderer */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-icon">
              {t.type === 'success' && '✅'}
              {t.type === 'error' && '❌'}
              {t.type === 'warning' && '⚠️'}
              {t.type === 'info' && 'ℹ️'}
            </span>
            <span className="toast-message">{t.message}</span>
            <button
              className="toast-close"
              onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-icon">
              <LogOut size={28} />
            </div>
            <h3 className="modal-title">Konfirmasi Keluar</h3>
            <p className="modal-desc">Apakah Anda yakin ingin keluar dari sistem SIMPUB?</p>
            <div className="modal-buttons">
              <button className="btn btn-secondary" onClick={() => setShowLogoutModal(false)}>Batal</button>
              <button className="btn btn-danger" onClick={handleLogout}>Keluar</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Pages router */}
      {page === 'landing' && (
        <LandingPage
          setPage={setPage}
          systemSettings={systemSettings}
        />
      )}

      {page === 'login' && (
        <Login
          setPage={setPage}
          onLoginSuccess={handleLoginSuccess}
          showToast={showToast}
          API_BASE_URL={API_BASE_URL}
        />
      )}

      {page === 'register' && (
        <Register
          setPage={setPage}
          onRegisterSuccess={handleLoginSuccess}
          showToast={showToast}
          API_BASE_URL={API_BASE_URL}
        />
      )}

      {page === 'dashboard' && renderDashboard()}
    </>
  );
}
