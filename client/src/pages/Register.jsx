import React, { useState } from 'react';
import { User, Shield, ArrowLeft, Mail, Key, Phone, CreditCard } from 'lucide-react';

export default function Register({ setPage, onRegisterSuccess, showToast, API_BASE_URL }) {
  const [formData, setFormData] = useState({
    name: '',
    nik: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const tempErrors = {};
    if (!formData.name.trim()) tempErrors.name = 'Nama lengkap wajib diisi.';
    
    if (!formData.nik) {
      tempErrors.nik = 'NIK wajib diisi.';
    } else if (formData.nik.length !== 16 || isNaN(formData.nik)) {
      tempErrors.nik = 'NIK harus berupa 16 digit angka.';
    }

    if (!formData.email) {
      tempErrors.email = 'Email wajib diisi.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Format email tidak valid.';
    }

    if (!formData.phone) {
      tempErrors.phone = 'Nomor telepon wajib diisi.';
    } else if (isNaN(formData.phone) || formData.phone.length < 10) {
      tempErrors.phone = 'Masukkan nomor telepon yang valid.';
    }

    if (!formData.password) {
      tempErrors.password = 'Password wajib diisi.';
    } else if (formData.password.length < 6) {
      tempErrors.password = 'Password minimal harus 6 karakter.';
    }

    if (formData.password !== formData.confirmPassword) {
      tempErrors.confirmPassword = 'Konfirmasi password tidak sesuai.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        onRegisterSuccess(data.token, data.user);
      } else {
        showToast(data.message || 'Registrasi gagal. Coba lagi.', 'error');
      }
    } catch (err) {
      setLoading(false);
      showToast('Gagal terhubung ke server. Hubungi administrator.', 'error');
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

      <div className="auth-card" style={{ maxWidth: '600px', margin: '4rem auto' }}>
        <div className="auth-header" style={{ marginBottom: '1.5rem' }}>
          <div className="logo" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
            <div className="logo-icon">📣</div>
            <span style={{ color: 'white' }}>SIMPUB</span>
          </div>
          <h2>Registrasi Akun Masyarakat</h2>
          <p>
            Sudah terdaftar?{' '}
            <span onClick={() => setPage('login')}>Masuk ke Akun</span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group-row">
            <div className="form-group">
              <label className="form-label" htmlFor="name">Nama Lengkap</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
                  <User size={16} />
                </span>
                <input 
                  id="name"
                  name="name"
                  type="text" 
                  className="form-control" 
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                  placeholder="Nama Lengkap"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="nik">NIK KTP (16 Digit)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
                  <CreditCard size={16} />
                </span>
                <input 
                  id="nik"
                  name="nik"
                  type="text" 
                  maxLength={16}
                  className="form-control" 
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                  placeholder="320102XXXXXXXXXX"
                  value={formData.nik}
                  onChange={handleChange}
                />
              </div>
              {errors.nik && <span className="form-error">{errors.nik}</span>}
            </div>
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
                  <Mail size={16} />
                </span>
                <input 
                  id="email"
                  name="email"
                  type="email" 
                  className="form-control" 
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                  placeholder="nama@email.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">Nomor Telepon</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
                  <Phone size={16} />
                </span>
                <input 
                  id="phone"
                  name="phone"
                  type="tel" 
                  className="form-control" 
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                  placeholder="08XXXXXXXXXX"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              {errors.phone && <span className="form-error">{errors.phone}</span>}
            </div>
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
                  <Key size={16} />
                </span>
                <input 
                  id="password"
                  name="password"
                  type="password" 
                  className="form-control" 
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                  placeholder="Minimal 6 karakter"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Konfirmasi Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
                  <Key size={16} />
                </span>
                <input 
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password" 
                  className="form-control" 
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                  placeholder="Ulangi password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
              {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-auth-submit"
            disabled={loading}
          >
            {loading ? 'Mendaftar...' : 'Daftar Akun'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
          <Shield size={14} />
          <span>Keamanan Data Pribadi Anda Terjamin</span>
        </div>
      </div>
    </div>
  );
}
