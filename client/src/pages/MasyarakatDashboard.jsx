import React, { useState, useEffect } from 'react';
import {
  Megaphone, Plus, FileText, User, LogOut,
  Search, Calendar, MessageSquare, Clock,
  MapPin, Phone, Mail, FileImage, Shield,
  Lock, CheckCircle, ChevronRight, Eye
} from 'lucide-react';

export default function MasyarakatDashboard({
  user, token, showToast, onLogout, systemSettings, onUpdateProfile, API_BASE_URL
}) {
  const [activeMenu, setActiveMenu] = useState('overview'); // overview, create, history, profile
  const [stats, setStats] = useState({ total: 0, pending: 0, processing: 0, completed: 0 });
  const [activities, setActivities] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Table filters & pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(5);

  // New complaint form state
  const [complaintForm, setComplaintForm] = useState({
    reporterName: user.name || '',
    nik: user.nik || '',
    phone: user.phone || '',
    email: user.email || '',
    address: '',
    title: '',
    category: 'Bantuan Sosial',
    subcategory: 'Program Keluarga Harapan (PKH)',
    details: '',
    evidence: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  // Profile edit form state
  const [profileForm, setProfileForm] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileLoading, setProfileLoading] = useState(false);

  // Load stats, recent activities, and complaints
  useEffect(() => {
    fetchStats();
    if (activeMenu === 'history') {
      fetchComplaints();
    } else if (activeMenu === 'overview') {
      fetchRecentComplaints();
    }
  }, [activeMenu, searchQuery, statusFilter, currentPage]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.userStats || { total: 0, pending: 0, processing: 0, completed: 0 });
      }
    } catch (err) {
      console.error("Gagal memuat statistik:", err);
    }
  };

  const fetchRecentComplaints = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/complaints?limit=3`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setActivities(data.complaints || []);
      }
    } catch (err) {
      console.error("Gagal memuat pengaduan terbaru:", err);
    }
  };

  const fetchComplaints = async () => {
    try {
      const url = `${API_BASE_URL}/complaints?page=${currentPage}&limit=${limit}&search=${searchQuery}&status=${statusFilter}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setComplaints(data.complaints || []);
        setTotalPages(data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error("Gagal memuat daftar pengaduan:", err);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/complaints/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedComplaint(data);
        setActiveMenu('detail');
      } else {
        showToast('Gagal memuat detail pengaduan.', 'error');
      }
    } catch (err) {
      showToast('Gagal terhubung ke server.', 'error');
    }
  };

  // Handle Form Buat Pengaduan
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setComplaintForm(prev => {
      const updated = { ...prev, [name]: value };

      // Auto-set subkategori jika kategori diganti
      if (name === 'category') {
        if (value === 'Bantuan Sosial') updated.subcategory = 'Program Keluarga Harapan (PKH)';
        else if (value === 'Pendaftaran Data') updated.subcategory = 'Data Terpadu Kesejahteraan Sosial (DTKS)';
        else if (value === 'Salah Sasaran') updated.subcategory = 'Penerima Mampu';
        else updated.subcategory = 'Lainnya';
      }
      return updated;
    });
  };

  // Convert File to Base64
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Ukuran berkas maksimal adalah 10MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setComplaintForm(prev => ({
        ...prev,
        evidence: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const validateComplaintForm = () => {
    const errors = {};
    if (!complaintForm.reporterName.trim()) errors.reporterName = 'Nama pelapor wajib diisi.';
    if (!complaintForm.nik || complaintForm.nik.length !== 16) errors.nik = 'NIK KTP harus 16 digit.';
    if (!complaintForm.phone) errors.phone = 'Nomor telepon wajib diisi.';
    if (!complaintForm.address.trim()) errors.address = 'Alamat lengkap wajib diisi.';
    if (!complaintForm.title.trim()) errors.title = 'Judul pengaduan wajib diisi.';
    if (!complaintForm.details.trim()) errors.details = 'Detail keluhan wajib diisi.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    if (!validateComplaintForm()) return;

    setFormLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(complaintForm)
      });
      const data = await response.json();
      setFormLoading(false);

      if (response.ok) {
        showToast('Pengaduan berhasil dikirim!', 'success');
        // Reset form & ke riwayat
        setComplaintForm({
          reporterName: user.name || '',
          nik: user.nik || '',
          phone: user.phone || '',
          email: user.email || '',
          address: '',
          title: '',
          category: 'Bantuan Sosial',
          subcategory: 'Program Keluarga Harapan (PKH)',
          details: '',
          evidence: ''
        });
        setActiveMenu('history');
      } else {
        showToast(data.message || 'Gagal mengirim pengaduan.', 'error');
      }
    } catch (err) {
      setFormLoading(false);
      showToast('Gagal mengirim aduan. Coba lagi.', 'error');
    }
  };

  // Handle Edit Profil
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const validateProfileForm = () => {
    const errors = {};
    if (!profileForm.name.trim()) errors.name = 'Nama lengkap wajib diisi.';
    if (!profileForm.email) errors.email = 'Email wajib diisi.';
    if (!profileForm.phone) errors.phone = 'Nomor telepon wajib diisi.';

    if (profileForm.newPassword) {
      if (!profileForm.currentPassword) {
        errors.currentPassword = 'Password saat ini diperlukan untuk mengubah password.';
      }
      if (profileForm.newPassword.length < 6) {
        errors.newPassword = 'Password baru minimal harus 6 karakter.';
      }
      if (profileForm.newPassword !== profileForm.confirmNewPassword) {
        errors.confirmNewPassword = 'Konfirmasi password baru tidak cocok.';
      }
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!validateProfileForm()) return;

    setProfileLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileForm)
      });
      const data = await response.json();
      setProfileLoading(false);

      if (response.ok) {
        showToast('Profil Anda berhasil diperbarui!', 'success');
        onUpdateProfile(); // Refresh profile di state utama
        setProfileForm(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        }));
      } else {
        showToast(data.message || 'Gagal memperbarui profil.', 'error');
      }
    } catch (err) {
      setProfileLoading(false);
      showToast('Terjadi kesalahan koneksi.', 'error');
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Menu */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">📣</div>
          <span>SIMPUB</span>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user.name ? user.name[0].toUpperCase() : 'M'}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user.name}</span>
            <span className="sidebar-user-role">Masyarakat</span>
          </div>
        </div>

        <ul className="sidebar-menu">
          <li
            className={`sidebar-menu-item ${activeMenu === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveMenu('overview')}
          >
            <FileText size={18} /> Ringkasan
          </li>
          <li
            className={`sidebar-menu-item ${activeMenu === 'create' ? 'active' : ''}`}
            onClick={() => setActiveMenu('create')}
          >
            <Plus size={18} /> Buat Pengaduan
          </li>
          <li
            className={`sidebar-menu-item ${activeMenu === 'history' || activeMenu === 'detail' ? 'active' : ''}`}
            onClick={() => {
              setCurrentPage(1);
              setActiveMenu('history');
            }}
          >
            <Clock size={18} /> Riwayat Pengaduan
          </li>
          <li
            className={`sidebar-menu-item ${activeMenu === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveMenu('profile')}
          >
            <User size={18} /> Profil & Pengaturan
          </li>
        </ul>

        <div className="sidebar-logout">
          <li className="sidebar-menu-item" style={{ color: '#f87171' }} onClick={onLogout}>
            <LogOut size={18} /> Keluar
          </li>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        <header className="main-header">
          <div className="main-header-title">
            <h1>
              {activeMenu === 'overview' && 'Ringkasan Aktivitas'}
              {activeMenu === 'create' && 'Buat Pengaduan Baru'}
              {activeMenu === 'history' && 'Daftar Riwayat Pengaduan'}
              {activeMenu === 'detail' && 'Detail Pengaduan'}
              {activeMenu === 'profile' && 'Profil Saya & Pengaturan'}
              <span className="system-badge">SIMPUB</span>
            </h1>
          </div>
          <div className="header-right">
            <div className="system-date">
              <Calendar size={16} /> {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </header>

        {/* 1. OVERVIEW VIEW */}
        {activeMenu === 'overview' && (
          <div className="dashboard-grid">
            {/* Welcome Banner */}
            <div className="welcome-banner">
              <div className="welcome-banner-text">
                <h2>Selamat Datang, {user.name}!</h2>
                <p>
                  Sampaikan keluhan atau masukan Anda terkait program Bantuan Sosial Dinas Sosial di sistem SIMPUB. Laporan Anda akan diproses dengan aman, transparan, dan profesional.
                </p>
              </div>
              <span className="welcome-banner-badge">Role: Masyarakat</span>
            </div>

            {/* Stat Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon stat-icon-blue"><FileText size={24} /></div>
                <div className="stat-info">
                  <span className="stat-label">Total Pengaduan</span>
                  <span className="stat-value">{stats.total}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon stat-icon-yellow"><Clock size={24} /></div>
                <div className="stat-info">
                  <span className="stat-label">Menunggu</span>
                  <span className="stat-value">{stats.pending}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon stat-icon-purple"><MessageSquare size={24} /></div>
                <div className="stat-info">
                  <span className="stat-label">Diproses</span>
                  <span className="stat-value">{stats.processing}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon stat-icon-green"><CheckCircle size={24} /></div>
                <div className="stat-info">
                  <span className="stat-label">Selesai</span>
                  <span className="stat-value">{stats.completed}</span>
                </div>
              </div>
            </div>

            {/* Panels */}
            <div className="dashboard-panels">
              {/* Cepat Access */}
              <div className="panel">
                <div className="panel-header">
                  <h3 className="panel-title"><Megaphone size={18} /> Menu Akses Cepat</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1rem' }}>
                  <div
                    style={{ background: 'var(--primary-blue-light)', border: '1px solid rgba(59, 130, 246, 0.1)', padding: '2rem 1.5rem', borderRadius: '16px', cursor: 'pointer', textAlign: 'center', transition: 'var(--transition-normal)' }}
                    onClick={() => setActiveMenu('create')}
                    className="quick-card"
                  >
                    <Plus size={36} color="var(--primary-blue)" style={{ marginBottom: '0.75rem' }} />
                    <h4 style={{ color: 'var(--primary-blue-dark)', fontSize: '1.1rem', marginBottom: '0.25rem' }}>Buat Pengaduan</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Laporkan kendala bansos secara instan</p>
                  </div>
                  <div
                    style={{ background: 'var(--primary-purple-light)', border: '1px solid rgba(139, 92, 246, 0.1)', padding: '2rem 1.5rem', borderRadius: '16px', cursor: 'pointer', textAlign: 'center', transition: 'var(--transition-normal)' }}
                    onClick={() => setActiveMenu('history')}
                    className="quick-card"
                  >
                    <Clock size={36} color="var(--primary-purple)" style={{ marginBottom: '0.75rem' }} />
                    <h4 style={{ color: 'var(--primary-purple-dark)', fontSize: '1.1rem', marginBottom: '0.25rem' }}>Lacak Status</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pantau perkembangan aduan Anda</p>
                  </div>
                </div>

                <div style={{
                  marginTop: '2rem',
                  padding: '1.25rem',
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
                  borderRadius: '16px',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <Shield size={36} color="var(--primary-blue)" />
                  <div>
                    <h4 style={{ fontSize: '0.95rem', color: 'white' }}>Layanan Terlindungi</h4>
                    <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>Identitas NIK dan laporan Anda tersimpan secara terenkripsi dan hanya dapat diakses oleh Dinsos resmi.</p>
                  </div>
                </div>
              </div>

              {/* Recent Activities */}
              <div className="panel">
                <div className="panel-header">
                  <h3 className="panel-title"><Clock size={18} /> Riwayat Laporan Terbaru</h3>
                </div>
                <div className="activity-list" style={{ marginTop: '0.5rem' }}>
                  {activities.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0' }}>
                      Belum ada riwayat pengaduan.
                    </div>
                  ) : (
                    activities.map((c) => (
                      <div key={c.id} className="activity-item">
                        <div className={`activity-dot ${c.status === 'Menunggu' ? 'activity-dot-yellow' :
                          c.status === 'Diproses' ? 'activity-dot-blue' :
                            c.status === 'Selesai' ? 'activity-dot-green' : 'activity-dot-red'
                          }`}>
                          📣
                        </div>
                        <div className="activity-details">
                          <div className="activity-text">
                            Status aduan <span>{c.id}</span> diupdate menjadi <span className={`badge ${c.status === 'Menunggu' ? 'badge-pending' :
                              c.status === 'Diproses' ? 'badge-processing' :
                                c.status === 'Selesai' ? 'badge-completed' : 'badge-rejected'
                              }`}>{c.status}</span>
                          </div>
                          <div className="activity-text" style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.1rem' }}>
                            "{c.title}"
                          </div>
                          <span className="activity-time">{new Date(c.createdAt).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. CREATE COMPLAINT VIEW */}
        {activeMenu === 'create' && (
          <div className="dashboard-grid">
            <div className="panel" style={{ minHeight: 'auto' }}>
              <form onSubmit={handleComplaintSubmit}>
                <div className="form-group-row">
                  <div className="form-group">
                    <label className="form-label form-label-light" htmlFor="reporterName">Nama Lengkap Pelapor</label>
                    <input
                      id="reporterName"
                      name="reporterName"
                      type="text"
                      className="form-control form-control-light"
                      value={complaintForm.reporterName}
                      onChange={handleFormChange}
                    />
                    {formErrors.reporterName && <span className="form-error">{formErrors.reporterName}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-light" htmlFor="nik">NIK KTP (16 Digit)</label>
                    <input
                      id="nik"
                      name="nik"
                      type="text"
                      maxLength={16}
                      className="form-control form-control-light"
                      value={complaintForm.nik}
                      onChange={handleFormChange}
                    />
                    {formErrors.nik && <span className="form-error">{formErrors.nik}</span>}
                  </div>
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label className="form-label form-label-light" htmlFor="phone">Nomor Telepon</label>
                    <input
                      id="phone"
                      name="phone"
                      type="text"
                      className="form-control form-control-light"
                      value={complaintForm.phone}
                      onChange={handleFormChange}
                    />
                    {formErrors.phone && <span className="form-error">{formErrors.phone}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-light" htmlFor="email">Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className="form-control form-control-light"
                      value={complaintForm.email}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label form-label-light" htmlFor="address">Alamat Lengkap KTP / Domisili</label>
                  <textarea
                    id="address"
                    name="address"
                    className="form-control form-control-light"
                    rows="3"
                    placeholder="Nama Jalan, Blok, RT/RW, Kelurahan, Kecamatan, Kota"
                    value={complaintForm.address}
                    onChange={handleFormChange}
                  ></textarea>
                  {formErrors.address && <span className="form-error">{formErrors.address}</span>}
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label className="form-label form-label-light" htmlFor="category">Kategori Pengaduan</label>
                    <select
                      id="category"
                      name="category"
                      className="filter-select"
                      style={{ width: '100%', padding: '0.75rem 1rem' }}
                      value={complaintForm.category}
                      onChange={handleFormChange}
                    >
                      <option value="Bantuan Sosial">Bantuan Sosial</option>
                      <option value="Pendaftaran Data">Pendaftaran Data</option>
                      <option value="Salah Sasaran">Salah Sasaran</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-light" htmlFor="subcategory">Subkategori Pengaduan</label>
                    {complaintForm.category === 'Bantuan Sosial' && (
                      <select
                        id="subcategory"
                        name="subcategory"
                        className="filter-select"
                        style={{ width: '100%', padding: '0.75rem 1rem' }}
                        value={complaintForm.subcategory}
                        onChange={handleFormChange}
                      >
                        <option value="Program Keluarga Harapan (PKH)">Program Keluarga Harapan (PKH)</option>
                        <option value="Bantuan Pangan Non-Tunai (BPNT)">Bantuan Pangan Non-Tunai (BPNT)</option>
                        <option value="Bantuan Langsung Tunai (BLT)">Bantuan Langsung Tunai (BLT)</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    )}
                    {complaintForm.category === 'Pendaftaran Data' && (
                      <select
                        id="subcategory"
                        name="subcategory"
                        className="filter-select"
                        style={{ width: '100%', padding: '0.75rem 1rem' }}
                        value={complaintForm.subcategory}
                        onChange={handleFormChange}
                      >
                        <option value="Data Terpadu Kesejahteraan Sosial (DTKS)">Data Terpadu Kesejahteraan Sosial (DTKS)</option>
                        <option value="Kartu Indonesia Sehat (KIS)">Kartu Indonesia Sehat (KIS)</option>
                        <option value="Kartu Indonesia Pintar (KIP)">Kartu Indonesia Pintar (KIP)</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    )}
                    {complaintForm.category === 'Salah Sasaran' && (
                      <select
                        id="subcategory"
                        name="subcategory"
                        className="filter-select"
                        style={{ width: '100%', padding: '0.75rem 1rem' }}
                        value={complaintForm.subcategory}
                        onChange={handleFormChange}
                      >
                        <option value="Penerima Mampu">Penerima Mampu</option>
                        <option value="Perangkat Desa Menerima Bansos">Perangkat Desa Menerima Bansos</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    )}
                    {complaintForm.category === 'Lainnya' && (
                      <input
                        id="subcategory"
                        name="subcategory"
                        type="text"
                        className="form-control form-control-light"
                        placeholder="Masukkan jenis subkategori"
                        value={complaintForm.subcategory}
                        onChange={handleFormChange}
                      />
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label form-label-light" htmlFor="title">Judul Pengaduan</label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    className="form-control form-control-light"
                    placeholder="Contoh: Penyaluran Bansos BPNT Kelurahan X Lambat"
                    value={complaintForm.title}
                    onChange={handleFormChange}
                  />
                  {formErrors.title && <span className="form-error">{formErrors.title}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label form-label-light" htmlFor="details">Detail Keluhan</label>
                  <textarea
                    id="details"
                    name="details"
                    className="form-control form-control-light"
                    rows="6"
                    placeholder="Jelaskan secara rinci permasalahan bansos Anda: kronologi kejadian, tanggal kejadian, serta nama program terkait..."
                    value={complaintForm.details}
                    onChange={handleFormChange}
                  ></textarea>
                  {formErrors.details && <span className="form-error">{formErrors.details}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label form-label-light">Upload Gambar Bukti (Max 10MB)</label>
                  {complaintForm.evidence ? (
                    <div className="uploaded-preview">
                      <img src={complaintForm.evidence} alt="Bukti pengaduan" />
                      <button
                        type="button"
                        className="btn-remove-file"
                        onClick={() => setComplaintForm(prev => ({ ...prev, evidence: '' }))}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <label className="file-upload-area" htmlFor="fileUpload">
                      <FileImage className="file-upload-icon" />
                      <span className="file-upload-text">Klik untuk Unggah Gambar</span>
                      <span className="file-upload-hint">Format yang didukung: JPG, JPEG, PNG (Maks. 10MB)</span>
                      <input
                        id="fileUpload"
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setActiveMenu('overview')}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={formLoading}
                  >
                    {formLoading ? 'Mengirim aduan...' : 'Kirim Pengaduan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 3. HISTORY VIEW */}
        {activeMenu === 'history' && (
          <div className="dashboard-grid">
            <div className="panel" style={{ minHeight: 'auto' }}>
              <div className="table-controls">
                {/* Search Box */}
                <div className="search-box">
                  <Search size={18} className="search-icon-svg" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Cari ID atau judul pengaduan..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                {/* Filter Box */}
                <div className="filter-box">
                  <label htmlFor="statusFilter" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</label>
                  <select
                    id="statusFilter"
                    className="filter-select"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="Semua">Semua Status</option>
                    <option value="Menunggu">Menunggu</option>
                    <option value="Diproses">Diproses</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Ditolak">Ditolak</option>
                  </select>
                </div>
              </div>

              {/* Table Container */}
              <div className="table-container">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>ID Pengaduan</th>
                      <th>Judul Pengaduan</th>
                      <th>Kategori</th>
                      <th>Tanggal Kirim</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0' }}>
                          Tidak ada data pengaduan yang cocok.
                        </td>
                      </tr>
                    ) : (
                      complaints.map((c) => (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 700, color: 'var(--primary-purple)' }}>{c.id}</td>
                          <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                            {c.title}
                          </td>
                          <td>{c.category}</td>
                          <td>{new Date(c.createdAt).toLocaleDateString('id-ID')}</td>
                          <td>
                            <span className={`badge ${c.status === 'Menunggu' ? 'badge-pending' :
                              c.status === 'Diproses' ? 'badge-processing' :
                                c.status === 'Selesai' ? 'badge-completed' : 'badge-rejected'
                              }`}>
                              {c.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn-action-view"
                              title="Lihat Detail & Lacak"
                              onClick={() => handleViewDetail(c.id)}
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <span className="pagination-info">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <div className="pagination-buttons">
                    <button
                      className="pagination-btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    >
                      Sebelumnya
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      className="pagination-btn"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. DETAIL COMPLAINT VIEW */}
        {activeMenu === 'detail' && selectedComplaint && (
          <div className="dashboard-grid animate-fade-in">
            <button
              className="btn btn-secondary"
              style={{ width: 'fit-content', marginBottom: '0.5rem' }}
              onClick={() => setActiveMenu('history')}
            >
              ← Kembali ke Riwayat
            </button>

            <div className="complaint-detail-grid">
              {/* Left Panel - Detail Aduan */}
              <div className="panel" style={{ minHeight: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-blue-dark)' }}>{selectedComplaint.id}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dikirim pada {new Date(selectedComplaint.createdAt).toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <span className={`badge ${selectedComplaint.status === 'Menunggu' ? 'badge-pending' :
                      selectedComplaint.status === 'Diproses' ? 'badge-processing' :
                        selectedComplaint.status === 'Selesai' ? 'badge-completed' : 'badge-rejected'
                      }`} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                      {selectedComplaint.status}
                    </span>
                  </div>
                </div>

                <div className="detail-info-block">
                  <div className="detail-label">Judul Aduan</div>
                  <div className="detail-value detail-value-bold" style={{ fontSize: '1.15rem' }}>{selectedComplaint.title}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <div className="detail-label">Kategori</div>
                    <div className="detail-value">{selectedComplaint.category}</div>
                  </div>
                  <div>
                    <div className="detail-label">Subkategori</div>
                    <div className="detail-value">{selectedComplaint.subcategory}</div>
                  </div>
                </div>

                <div className="detail-info-block">
                  <div className="detail-label">Deskripsi Permasalahan</div>
                  <div className="detail-value" style={{ whiteSpace: 'pre-wrap', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    {selectedComplaint.details}
                  </div>
                </div>

                <div className="detail-info-block">
                  <div className="detail-label">Bukti Lampiran Foto</div>
                  <div className="evidence-img-container">
                    {selectedComplaint.evidence ? (
                      <img src={selectedComplaint.evidence} alt="Bukti" className="evidence-img" />
                    ) : (
                      <div className="evidence-placeholder">
                        <span>📷 Tidak ada lampiran gambar bukti.</span>
                      </div>
                    )}
                  </div>
                </div>

                <h4 style={{ margin: '2rem 0 1rem 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Identitas Pelapor</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <div className="detail-label">Nama Pelapor</div>
                    <div className="detail-value">{selectedComplaint.reporterName}</div>
                  </div>
                  <div>
                    <div className="detail-label">NIK KTP</div>
                    <div className="detail-value">{selectedComplaint.nik}</div>
                  </div>
                  <div>
                    <div className="detail-label">No Telepon</div>
                    <div className="detail-value">{selectedComplaint.phone}</div>
                  </div>
                  <div>
                    <div className="detail-label">Email</div>
                    <div className="detail-value">{selectedComplaint.email || '-'}</div>
                  </div>
                </div>

                <div className="detail-info-block" style={{ marginTop: '1.5rem' }}>
                  <div className="detail-label">Alamat Lengkap</div>
                  <div className="detail-value">{selectedComplaint.address}</div>
                </div>
              </div>

              {/* Right Panel - Timeline Status */}
              <div className="panel" style={{ minHeight: 'auto' }}>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={20} color="var(--primary-purple)" /> Timeline Pelacakan Laporan
                </h3>

                <div className="timeline-list">
                  {selectedComplaint.timeline && selectedComplaint.timeline.map((item, idx) => {
                    const isLast = idx === selectedComplaint.timeline.length - 1;
                    return (
                      <div key={idx} className={`timeline-node ${isLast ? 'active' : ''} ${item.status === 'Selesai' ? 'completed' :
                        item.status === 'Ditolak' ? 'rejected' : ''
                        }`}>
                        <div className="timeline-marker"></div>
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className={`timeline-status ${item.status === 'Menunggu' ? 'badge-pending' :
                              item.status === 'Diproses' ? 'badge-processing' :
                                item.status === 'Selesai' ? 'badge-completed' : 'badge-rejected'
                              }`} style={{ background: 'transparent', padding: 0 }}>
                              {item.status}
                            </span>
                            <span className="timeline-date">{new Date(item.updatedAt).toLocaleString('id-ID')}</span>
                          </div>
                          <p className="timeline-body">{item.note}</p>
                          <div className="timeline-footer">Oleh: {item.updatedBy}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. PROFILE & SETTINGS VIEW */}
        {activeMenu === 'profile' && (
          <div className="dashboard-grid">
            <div className="panel" style={{ minHeight: 'auto' }}>
              <div className="profile-avatar-edit-container">
                <div className="profile-avatar-large">
                  {user.name ? user.name[0].toUpperCase() : 'M'}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.35rem' }}>{user.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user.email} • NIK: {user.nik}</p>
                  <span className="badge badge-active" style={{ marginTop: '0.5rem' }}>AKUN MASYARAKAT AKTIF</span>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit}>
                <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>Informasi Profil</h4>

                <div className="form-group-row">
                  <div className="form-group">
                    <label className="form-label form-label-light" htmlFor="profName">Nama Lengkap</label>
                    <input
                      id="profName"
                      name="name"
                      type="text"
                      className="form-control form-control-light"
                      value={profileForm.name}
                      onChange={handleProfileChange}
                    />
                    {profileErrors.name && <span className="form-error">{profileErrors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-light" htmlFor="profPhone">Nomor Telepon</label>
                    <input
                      id="profPhone"
                      name="phone"
                      type="text"
                      className="form-control form-control-light"
                      value={profileForm.phone}
                      onChange={handleProfileChange}
                    />
                    {profileErrors.phone && <span className="form-error">{profileErrors.phone}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label form-label-light" htmlFor="profEmail">Email</label>
                  <input
                    id="profEmail"
                    name="email"
                    type="email"
                    className="form-control form-control-light"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                  />
                  {profileErrors.email && <span className="form-error">{profileErrors.email}</span>}
                </div>

                <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: '2.5rem', marginBottom: '1.25rem' }}>Keamanan (Ubah Password)</h4>

                <div className="form-group">
                  <label className="form-label form-label-light" htmlFor="currPass">Password Saat Ini</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
                      <Lock size={16} />
                    </span>
                    <input
                      id="currPass"
                      name="currentPassword"
                      type="password"
                      className="form-control form-control-light"
                      style={{ paddingLeft: '2.5rem' }}
                      placeholder="Masukkan password sekarang"
                      value={profileForm.currentPassword}
                      onChange={handleProfileChange}
                    />
                  </div>
                  {profileErrors.currentPassword && <span className="form-error">{profileErrors.currentPassword}</span>}
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label className="form-label form-label-light" htmlFor="newPass">Password Baru</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
                        <Lock size={16} />
                      </span>
                      <input
                        id="newPass"
                        name="newPassword"
                        type="password"
                        className="form-control form-control-light"
                        style={{ paddingLeft: '2.5rem' }}
                        placeholder="Minimal 6 karakter"
                        value={profileForm.newPassword}
                        onChange={handleProfileChange}
                      />
                    </div>
                    {profileErrors.newPassword && <span className="form-error">{profileErrors.newPassword}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-light" htmlFor="confNewPass">Konfirmasi Password Baru</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
                        <Lock size={16} />
                      </span>
                      <input
                        id="confNewPass"
                        name="confirmNewPassword"
                        type="password"
                        className="form-control form-control-light"
                        style={{ paddingLeft: '2.5rem' }}
                        placeholder="Ulangi password baru"
                        value={profileForm.confirmNewPassword}
                        onChange={handleProfileChange}
                      />
                    </div>
                    {profileErrors.confirmNewPassword && <span className="form-error">{profileErrors.confirmNewPassword}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={profileLoading}
                  >
                    {profileLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
