import React, { useState } from 'react';
import { Mail, Key, Shield, ArrowLeft } from 'lucide-react';

export default function Login({ setPage, onLoginSuccess, showToast, API_BASE_URL }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const tempErrors = {};
    if (!email) {
      tempErrors.email = 'Email wajib diisi.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Format email tidak valid.';
    }
    if (!password) {
      tempErrors.password = 'Password wajib diisi.';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        onLoginSuccess(data.token, data.user);
      } else {
        showToast(data.message || 'Login gagal. Email atau password salah.', 'error');
      }
    } catch (err) {
      setLoading(false);
      showToast('Gagal terhubung ke server. Pastikan server aktif.', 'error');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-bg-shapes">
        <div className="auth-shape-1"></div>
        <div className="auth-shape-2"></div>
      </div>
      
      <button 
        style={{
          position: 'absolute',
          top: '2rem',
          left: '2rem',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 10
        }}
        onClick={() => setPage('landing')}
      >
        <ArrowLeft size={16} /> Kembali
      </button>

      <div className="auth-card">
        <div className="auth-header">
          <div className="logo" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div className="logo-icon">📣</div>
            <span style={{ color: 'white' }}>SIMPUB</span>
          </div>
          <h2>Selamat Datang</h2>
          <p>
            Belum punya akun?{' '}
            <span onClick={() => setPage('register')}>Daftar Masyarakat</span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
                <Mail size={18} />
              </span>
              <input 
                id="email"
                type="email" 
                className="form-control" 
                style={{ paddingLeft: '2.75rem', width: '100%' }}
                placeholder="masukkan@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
                <Key size={18} />
              </span>
              <input 
                id="password"
                type="password" 
                className="form-control" 
                style={{ paddingLeft: '2.75rem', width: '100%' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-auth-submit"
            disabled={loading}
          >
            {loading ? 'Menghubungkan...' : 'Masuk ke Sistem'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem', fontSize: '0.8rem', color: '#94a3b8' }}>
          <Shield size={14} />
          <span>Sistem Keamanan Terenkripsi SSL</span>
        </div>
      </div>
    </div>
  );
}
