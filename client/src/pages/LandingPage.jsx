import React from 'react';
import { Megaphone, ShieldCheck, Clock, Users, ArrowRight, Shield } from 'lucide-react';

export default function LandingPage({ setPage, systemSettings }) {
  return (
    <div className="landing-container">
      {/* Sticky Navigation Bar */}
      <nav className="landing-nav">
        <div className="logo">
          <div className="logo-icon">📣</div>
          <span>{systemSettings.systemName || 'SIMPUB'}</span>
        </div>
        <div className="nav-buttons">
          <button className="btn btn-secondary" onClick={() => setPage('login')}>Masuk</button>
          <button className="btn btn-primary" onClick={() => setPage('register')}>Daftar Akun</button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-text">
          <h1>Sampaikan Pengaduan <span>Bantuan Sosial</span> Secara Digital</h1>
          <p>
            SIMPUB memfasilitasi masyarakat untuk melaporkan masalah penyaluran bantuan sosial secara cepat, transparan, dan terverifikasi langsung oleh Dinas Sosial.
          </p>
          <div className="hero-cta">
            <button className="btn btn-primary" onClick={() => setPage('register')}>
              Laporkan Sekarang <ArrowRight size={18} />
            </button>
            <button className="btn btn-secondary" onClick={() => setPage('login')}>
              Pantau Aduan
            </button>
          </div>
        </div>
        
        <div className="hero-image">
          <div className="hero-bg-blob"></div>
          <div className="hero-image-frame">
            <img src="/pelayanan_1.jpg" alt="Layanan Publik Dinas Sosial" />
          </div>
        </div>
      </header>

      {/* Features / Steps Section */}
      <section className="features-section">
        <div className="section-title">
          <h2>Bagaimana SIMPUB Membantu Anda?</h2>
          <p>Alur pengaduan bantuan sosial digital yang cepat dan terintegrasi.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <Megaphone size={24} />
            </div>
            <h3>1. Laporkan</h3>
            <p>Masyarakat mengunggah laporan keluhan bantuan sosial lengkap dengan bukti foto secara instan melalui sistem.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Clock size={24} />
            </div>
            <h3>2. Verifikasi & Proses</h3>
            <p>Petugas Dinas Sosial memverifikasi kebenaran laporan aduan dan memperbarui tahapan penanganan secara realtime.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <ShieldCheck size={24} />
            </div>
            <h3>3. Selesai</h3>
            <p>Aduan ditindaklanjuti hingga tuntas dan umpan balik langsung diberikan kepada warga yang bersangkutan.</p>
          </div>
        </div>
      </section>

      {/* Split trust & collaboration section using handshake.jpg */}
      <section className="landing-split-section" style={{ borderTop: '1px solid var(--border-color)', background: 'white' }}>
        <div className="landing-split-img">
          <img src="/handshake.jpg" alt="Kolaborasi dan Kepercayaan" />
        </div>
        <div className="landing-split-text">
          <h2>Membangun Kepercayaan & Layanan yang Transparan</h2>
          <p>
            Dinas Sosial berkomitmen penuh untuk menjembatani setiap aduan masyarakat secara langsung. Kami percaya bahwa transparansi dan kolaborasi digital adalah kunci utama dalam penyaluran bantuan sosial yang tepat sasaran.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary-purple-dark)' }}>
              ✔ Pengaduan langsung dipantau oleh pimpinan daerah
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary-blue-dark)' }}>
              ✔ Pengolahan data berbasis verifikasi lapangan terpercaya
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              ✔ Kerahasiaan identitas pelapor dijamin sepenuhnya
            </div>
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <footer className="footer">
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', textAlign: 'left', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ color: 'white', marginBottom: '1rem' }}>{systemSettings.systemName}</h3>
            <p style={{ fontSize: '0.85rem' }}>Portal resmi pengaduan dan umpan balik penyaluran bantuan sosial daerah setempat.</p>
          </div>
          <div>
            <h3 style={{ color: 'white', marginBottom: '1rem' }}>Hubungi Kami</h3>
            <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>📞 Hotline: {systemSettings.hotline}</p>
            <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>✉️ Email: {systemSettings.systemEmail}</p>
            <p style={{ fontSize: '0.85rem' }}>📍 Alamat: {systemSettings.address}</p>
          </div>
          <div>
            <h3 style={{ color: 'white', marginBottom: '1rem' }}>Keamanan</h3>
            <p style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={16} /> Keamanan data pelapor dan NIK dijamin kerahasiaannya oleh undang-undang.
            </p>
          </div>
        </div>
        <p style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', fontSize: '0.8rem' }}>
          © {new Date().getFullYear()} {systemSettings.systemName}. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
