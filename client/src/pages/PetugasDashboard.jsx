import React, { useState, useEffect } from 'react';
import { 
  FileText, Clock, MessageSquare, CheckCircle, 
  Calendar, Search, User, LogOut, Eye, 
  MapPin, Phone, Mail, ShieldAlert, Edit, 
  AlertTriangle, Lock, Download 
} from 'lucide-react';

export default function PetugasDashboard({ 
  user, token, showToast, onLogout, onUpdateProfile, API_BASE_URL 
}) {
  const [activeMenu, setActiveMenu] = useState('overview'); // overview, complaints, detail, profile
  const [stats, setStats] = useState({ total: 0, pending: 0, processing: 0, completed: 0, rejected: 0 });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState([]);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(6);

  // Status Change Form
  const [statusForm, setStatusForm] = useState({
    status: '',
    note: ''
  });
  const [statusErrors, setStatusErrors] = useState({});
  const [statusLoading, setStatusLoading] = useState(false);

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    bidang: user.bidang || '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileLoading, setProfileLoading] = useState(false);

  // Tooltip for chart
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: '' });

  // Fetch initial data
  useEffect(() => {
    fetchStats();
    if (activeMenu === 'complaints') {
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
        setStats(data.overall || { total: 0, pending: 0, processing: 0, completed: 0, rejected: 0 });
        setMonthlyStats(data.monthlyStats || []);
      }
    } catch (err) {
      console.error("Gagal memuat statistik petugas:", err);
    }
  };

  const fetchRecentComplaints = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/complaints?limit=3`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRecentComplaints(data.complaints || []);
      }
    } catch (err) {
      console.error("Gagal memuat aduan terbaru:", err);
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
      console.error("Gagal memuat daftar aduan masuk:", err);
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
        setStatusForm({
          status: data.status,
          note: ''
        });
        setStatusErrors({});
        setActiveMenu('detail');
      } else {
        showToast('Gagal memuat detail pengaduan.', 'error');
      }
    } catch (err) {
      showToast('Gagal terhubung ke server.', 'error');
    }
  };

  // Handle Update Status & Tindak Lanjut
  const handleStatusChange = (e) => {
    const { name, value } = e.target;
    setStatusForm(prev => ({ ...prev, [name]: value }));
  };

  const validateStatusForm = () => {
    const errors = {};
    if (!statusForm.status) errors.status = 'Status wajib dipilih.';
    if (!statusForm.note.trim()) errors.note = 'Catatan tindak lanjut wajib diisi.';
    setStatusErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!validateStatusForm()) return;

    setStatusLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/complaints/${selectedComplaint.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(statusForm)
      });
      const data = await response.json();
      setStatusLoading(false);

      if (response.ok) {
        showToast('Status aduan berhasil diperbarui!', 'success');
        handleViewDetail(selectedComplaint.id); // Reload aduan
        fetchStats(); // Update stats
      } else {
        showToast(data.message || 'Gagal merubah status aduan.', 'error');
      }
    } catch (err) {
      setStatusLoading(false);
      showToast('Gagal memproses. Coba lagi.', 'error');
    }
  };

  // Handle Edit Profil
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    // Validasi
    const errors = {};
    if (!profileForm.name.trim()) errors.name = 'Nama wajib diisi.';
    if (!profileForm.email) errors.email = 'Email wajib diisi.';
    if (!profileForm.phone) errors.phone = 'No telepon wajib diisi.';
    if (!profileForm.bidang) errors.bidang = 'Bidang kepetugasan wajib diisi.';

    if (profileForm.newPassword) {
      if (!profileForm.currentPassword) errors.currentPassword = 'Password saat ini diperlukan.';
      if (profileForm.newPassword.length < 6) errors.newPassword = 'Password baru minimal 6 karakter.';
      if (profileForm.newPassword !== profileForm.confirmNewPassword) errors.confirmNewPassword = 'Konfirmasi password baru tidak cocok.';
    }

    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) return;

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
        onUpdateProfile();
        setProfileForm(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        }));
      } else {
        showToast(data.message || 'Gagal menyimpan profil.', 'error');
      }
    } catch (err) {
      setProfileLoading(false);
      showToast('Gagal terhubung ke server.', 'error');
    }
  };

  // Custom SVG Chart Generator
  const renderSVGChart = () => {
    if (monthlyStats.length === 0) return null;

    const width = 500;
    const height = 220;
    const padding = 35;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const maxVal = Math.max(...monthlyStats.map(d => Math.max(d.total, d.selesai, 5)));
    const yGridTicks = [0, Math.ceil(maxVal / 2), maxVal];

    return (
      <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} width="100%">
        {/* Grid lines */}
        {yGridTicks.map((val, i) => {
          const y = padding + chartHeight - (val / maxVal) * chartHeight;
          return (
            <g key={i}>
              <line 
                x1={padding} 
                y1={y} 
                x2={width - padding} 
                y2={y} 
                className="chart-grid-line" 
              />
              <text 
                x={padding - 10} 
                y={y + 4} 
                textAnchor="end" 
                className="chart-label-text"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Axis Lines */}
        <line 
          x1={padding} 
          y1={height - padding} 
          x2={width - padding} 
          y2={height - padding} 
          className="chart-axis-line" 
        />
        <line 
          x1={padding} 
          y1={padding} 
          x2={padding} 
          y2={height - padding} 
          className="chart-axis-line" 
        />

        {/* Render Bars */}
        {monthlyStats.map((d, i) => {
          const barCount = monthlyStats.length;
          const sectionWidth = chartWidth / barCount;
          const barWidth = 14;
          const xCenter = padding + i * sectionWidth + sectionWidth / 2;
          
          // Total masuk bar (Blue)
          const totalHeight = (d.total / maxVal) * chartHeight;
          const totalY = height - padding - totalHeight;

          // Selesai bar (Purple)
          const selesaiHeight = (d.selesai / maxVal) * chartHeight;
          const selesaiY = height - padding - selesaiHeight;

          return (
            <g key={i}>
              {/* Total Masuk Bar */}
              <rect 
                x={xCenter - barWidth - 2} 
                y={totalY} 
                width={barWidth} 
                height={totalHeight} 
                fill="url(#blueGrad)" 
                rx="3"
                className="chart-bar"
                onMouseEnter={(e) => setTooltip({
                  show: true,
                  x: e.clientX,
                  y: e.clientY - 40,
                  content: `${d.month}: ${d.total} Pengaduan`
                })}
                onMouseLeave={() => setTooltip({ show: false, x: 0, y: 0, content: '' })}
              />
              {/* Selesai Bar */}
              <rect 
                x={xCenter + 2} 
                y={selesaiY} 
                width={barWidth} 
                height={selesaiHeight} 
                fill="url(#purpleGrad)" 
                rx="3"
                className="chart-bar"
                onMouseEnter={(e) => setTooltip({
                  show: true,
                  x: e.clientX,
                  y: e.clientY - 40,
                  content: `${d.month}: ${d.selesai} Selesai`
                })}
                onMouseLeave={() => setTooltip({ show: false, x: 0, y: 0, content: '' })}
              />
              {/* X Axis Label */}
              <text 
                x={xCenter} 
                y={height - padding + 18} 
                textAnchor="middle" 
                className="chart-label-text"
              >
                {d.month}
              </text>
            </g>
          );
        })}

        {/* Gradients */}
        <defs>
          <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  return (
    <div className="app-container">
      {/* Sidebar Petugas */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">📣</div>
          <span>SIMPUB</span>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar" style={{ background: 'var(--gradient-primary)' }}>
            {user.name ? user.name[0].toUpperCase() : 'P'}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user.name}</span>
            <span className="sidebar-user-role">Petugas Dinsos</span>
          </div>
        </div>

        <ul className="sidebar-menu">
          <li 
            className={`sidebar-menu-item ${activeMenu === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveMenu('overview')}
          >
            <FileText size={18} /> Dashboard
          </li>
          <li 
            className={`sidebar-menu-item ${activeMenu === 'complaints' || activeMenu === 'detail' ? 'active' : ''}`}
            onClick={() => {
              setCurrentPage(1);
              setActiveMenu('complaints');
            }}
          >
            <Clock size={18} /> Pengaduan Masuk
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

      {/* Main Content Area */}
      <main className="main-content">
        <header className="main-header">
          <div className="main-header-title">
            <h1>
              {activeMenu === 'overview' && 'Dashboard Petugas'}
              {activeMenu === 'complaints' && 'Pengaduan Masuk'}
              {activeMenu === 'detail' && 'Verifikasi Pengaduan'}
              {activeMenu === 'profile' && 'Profil Petugas & Pengaturan'}
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
                <h2>Selamat Bekerja, {user.name}!</h2>
                <p>
                  Pantau aduan masuk dari masyarakat, lakukan verifikasi data secara objektif, dan berikan tindak lanjut secara cepat serta transparan. Kontribusi Anda sangat berarti bagi masyarakat.
                </p>
              </div>
              <span className="welcome-banner-badge" style={{ borderColor: 'var(--primary-blue)', color: 'white' }}>Role: Petugas</span>
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
                  <span className="stat-label">Menunggu Verifikasi</span>
                  <span className="stat-value">{stats.pending}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon stat-icon-purple"><MessageSquare size={24} /></div>
                <div className="stat-info">
                  <span className="stat-label">Sedang Diproses</span>
                  <span className="stat-value">{stats.processing}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon stat-icon-green"><CheckCircle size={24} /></div>
                <div className="stat-info">
                  <span className="stat-label">Laporan Selesai</span>
                  <span className="stat-value">{stats.completed}</span>
                </div>
              </div>
            </div>

            {/* Dashboard Panels */}
            <div className="dashboard-panels">
              {/* Monthly Stats Chart */}
              <div className="panel">
                <div className="panel-header">
                  <h3 className="panel-title"><FileText size={18} /> Grafik Statistik Pengaduan (6 Bulan Terakhir)</h3>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ width: '12px', height: '12px', background: 'var(--primary-blue)', borderRadius: '3px' }}></span> Masuk
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ width: '12px', height: '12px', background: 'var(--primary-purple)', borderRadius: '3px' }}></span> Selesai
                    </span>
                  </div>
                </div>
                <div className="chart-container">
                  {renderSVGChart()}
                  {tooltip.show && (
                    <div 
                      className="chart-tooltip" 
                      style={{ 
                        left: `${tooltip.x - window.innerWidth * 0.18}px`, // Simple alignment
                        top: `${tooltip.y - 120}px` 
                      }}
                    >
                      {tooltip.content}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Inbound complaints */}
              <div className="panel">
                <div className="panel-header">
                  <h3 className="panel-title"><Clock size={18} /> Pengaduan Terbaru Masuk</h3>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={() => setActiveMenu('complaints')}
                  >
                    Lihat Semua
                  </button>
                </div>
                <div className="activity-list" style={{ marginTop: '0.5rem' }}>
                  {recentComplaints.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0' }}>
                      Tidak ada pengaduan terbaru.
                    </div>
                  ) : (
                    recentComplaints.map((c) => (
                      <div key={c.id} className="activity-item" style={{ cursor: 'pointer' }} onClick={() => handleViewDetail(c.id)}>
                        <div className={`activity-dot ${
                          c.status === 'Menunggu' ? 'activity-dot-yellow' : 
                          c.status === 'Diproses' ? 'activity-dot-blue' : 
                          c.status === 'Selesai' ? 'activity-dot-green' : 'activity-dot-red'
                        }`}>
                          📝
                        </div>
                        <div className="activity-details" style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary-purple)' }}>{c.id}</span>
                            <span className={`badge ${
                              c.status === 'Menunggu' ? 'badge-pending' : 
                              c.status === 'Diproses' ? 'badge-processing' : 
                              c.status === 'Selesai' ? 'badge-completed' : 'badge-rejected'
                            }`} style={{ scale: '0.9' }}>{c.status}</span>
                          </div>
                          <div className="activity-text" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                            {c.title}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                            <span>Pelapor: {c.reporterName}</span>
                            <span>{new Date(c.createdAt).toLocaleDateString('id-ID')}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. COMPLAINTS LIST VIEW */}
        {activeMenu === 'complaints' && (
          <div className="dashboard-grid">
            <div className="panel" style={{ minHeight: 'auto' }}>
              <div className="table-controls">
                {/* Search */}
                <div className="search-box">
                  <Search size={18} className="search-icon-svg" />
                  <input 
                    type="text" 
                    className="search-input" 
                    placeholder="Cari ID, NIK, Pelapor, atau Judul..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                {/* Filter */}
                <div className="filter-box">
                  <label htmlFor="statusSelect" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</label>
                  <select 
                    id="statusSelect"
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

              {/* Table */}
              <div className="table-container">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>ID Pengaduan</th>
                      <th>Pelapor</th>
                      <th>Judul Pengaduan</th>
                      <th>Kategori</th>
                      <th>Tanggal Masuk</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0' }}>
                          Tidak ada pengaduan masuk yang cocok.
                        </td>
                      </tr>
                    ) : (
                      complaints.map((c) => (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 700, color: 'var(--primary-purple)' }}>{c.id}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{c.reporterName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NIK: {c.nik}</div>
                          </td>
                          <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                            {c.title}
                          </td>
                          <td>{c.category}</td>
                          <td>{new Date(c.createdAt).toLocaleDateString('id-ID')}</td>
                          <td>
                            <span className={`badge ${
                              c.status === 'Menunggu' ? 'badge-pending' : 
                              c.status === 'Diproses' ? 'badge-processing' : 
                              c.status === 'Selesai' ? 'badge-completed' : 'badge-rejected'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn-action-view"
                              title="Detail & Verifikasi"
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

        {/* 3. DETAIL & VERIFICATION VIEW */}
        {activeMenu === 'detail' && selectedComplaint && (
          <div className="dashboard-grid animate-fade-in">
            <button 
              className="btn btn-secondary" 
              style={{ width: 'fit-content', marginBottom: '0.5rem' }}
              onClick={() => setActiveMenu('complaints')}
            >
              ← Kembali ke Pengaduan Masuk
            </button>
            
            <div className="complaint-detail-grid">
              {/* Left Panel: Info Detail */}
              <div className="panel" style={{ minHeight: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-blue-dark)' }}>Detail Pengaduan: {selectedComplaint.id}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Masuk pada {new Date(selectedComplaint.createdAt).toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <span className={`badge ${
                      selectedComplaint.status === 'Menunggu' ? 'badge-pending' : 
                      selectedComplaint.status === 'Diproses' ? 'badge-processing' : 
                      selectedComplaint.status === 'Selesai' ? 'badge-completed' : 'badge-rejected'
                    }`} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                      {selectedComplaint.status}
                    </span>
                  </div>
                </div>

                <div className="detail-info-block">
                  <div className="detail-label">Judul Keluhan</div>
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
                  <div className="detail-label">Detail Permasalahan</div>
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

                <h4 style={{ margin: '2rem 0 1rem 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Identitas Warga Pelapor</h4>
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
                  <div className="detail-label">Alamat Lengkap KTP</div>
                  <div className="detail-value">{selectedComplaint.address}</div>
                </div>
              </div>

              {/* Right Panel: Tindak Lanjut & Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Form Handling Status */}
                <div className="panel" style={{ minHeight: 'auto' }}>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-blue-dark)' }}>
                    <ShieldAlert size={20} /> Verifikasi & Tindak Lanjut
                  </h3>
                  
                  <form onSubmit={handleStatusSubmit}>
                    <div className="form-group">
                      <label className="form-label form-label-light" htmlFor="statusUpdate">Pilih Status Penanganan</label>
                      <select 
                        id="statusUpdate"
                        name="status"
                        className="filter-select"
                        style={{ width: '100%', padding: '0.75rem 1rem' }}
                        value={statusForm.status}
                        onChange={handleStatusChange}
                      >
                        <option value="Menunggu">Menunggu Verifikasi</option>
                        <option value="Diproses">Diproses (Sedang ditindaklanjuti)</option>
                        <option value="Selesai">Selesai (Keluhan Teratasi)</option>
                        <option value="Ditolak">Ditolak (Aduan tidak valid)</option>
                      </select>
                      {statusErrors.status && <span className="form-error">{statusErrors.status}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label form-label-light" htmlFor="statusNote">Catatan Tindak Lanjut (Umpan Balik)</label>
                      <textarea 
                        id="statusNote"
                        name="note"
                        className="form-control form-control-light"
                        rows="4"
                        placeholder="Masukkan catatan perkembangan atau alasan status diubah..."
                        value={statusForm.note}
                        onChange={handleStatusChange}
                      ></textarea>
                      {statusErrors.note && <span className="form-error">{statusErrors.note}</span>}
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem' }}
                      disabled={statusLoading}
                    >
                      {statusLoading ? 'Memproses...' : 'Simpan Umpan Balik'}
                    </button>
                  </form>
                </div>

                {/* Timeline Pelacakan */}
                <div className="panel" style={{ minHeight: 'auto' }}>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={20} color="var(--primary-purple)" /> Log Histori Perkembangan
                  </h3>
                  
                  <div className="timeline-list">
                    {selectedComplaint.timeline && selectedComplaint.timeline.map((item, idx) => {
                      const isLast = idx === selectedComplaint.timeline.length - 1;
                      return (
                        <div key={idx} className={`timeline-node ${isLast ? 'active' : ''} ${
                          item.status === 'Selesai' ? 'completed' : 
                          item.status === 'Ditolak' ? 'rejected' : ''
                        }`}>
                          <div className="timeline-marker"></div>
                          <div className="timeline-content" style={{ padding: '0.85rem' }}>
                            <div className="timeline-header">
                              <span className={`timeline-status ${
                                item.status === 'Menunggu' ? 'badge-pending' : 
                                item.status === 'Diproses' ? 'badge-processing' : 
                                item.status === 'Selesai' ? 'badge-completed' : 'badge-rejected'
                              }`} style={{ background: 'transparent', padding: 0 }}>
                                {item.status}
                              </span>
                              <span className="timeline-date">{new Date(item.updatedAt).toLocaleDateString('id-ID')}</span>
                            </div>
                            <p className="timeline-body" style={{ fontSize: '0.8rem' }}>{item.note}</p>
                            <div className="timeline-footer" style={{ fontSize: '0.7rem' }}>Oleh: {item.updatedBy}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. PROFILE & SETTINGS VIEW */}
        {activeMenu === 'profile' && (
          <div className="dashboard-grid">
            <div className="panel" style={{ minHeight: 'auto' }}>
              <div className="profile-avatar-edit-container">
                <div className="profile-avatar-large" style={{ background: 'var(--gradient-primary)' }}>
                  {user.name ? user.name[0].toUpperCase() : 'P'}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.35rem' }}>{user.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user.email} • Bidang: {user.bidang || '-'}</p>
                  <span className="badge badge-active" style={{ marginTop: '0.5rem' }}>PETUGAS AKTIF</span>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit}>
                <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>Detail Data Akun</h4>
                
                <div className="form-group-row">
                  <div className="form-group">
                    <label className="form-label form-label-light" htmlFor="petName">Nama Petugas</label>
                    <input 
                      id="petName"
                      name="name"
                      type="text" 
                      className="form-control form-control-light" 
                      value={profileForm.name}
                      onChange={handleProfileChange}
                    />
                    {profileErrors.name && <span className="form-error">{profileErrors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-light" htmlFor="petPhone">Nomor Telepon</label>
                    <input 
                      id="petPhone"
                      name="phone"
                      type="text" 
                      className="form-control form-control-light" 
                      value={profileForm.phone}
                      onChange={handleProfileChange}
                    />
                    {profileErrors.phone && <span className="form-error">{profileErrors.phone}</span>}
                  </div>
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label className="form-label form-label-light" htmlFor="petEmail">Email Petugas</label>
                    <input 
                      id="petEmail"
                      name="email"
                      type="email" 
                      className="form-control form-control-light" 
                      value={profileForm.email}
                      onChange={handleProfileChange}
                    />
                    {profileErrors.email && <span className="form-error">{profileErrors.email}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-light" htmlFor="petBid">Bidang Penanganan</label>
                    <input 
                      id="petBid"
                      name="bidang"
                      type="text" 
                      className="form-control form-control-light" 
                      value={profileForm.bidang}
                      placeholder="Contoh: Bantuan Sosial Tunai, Rehabilitasi Sosial..."
                      onChange={handleProfileChange}
                    />
                    {profileErrors.bidang && <span className="form-error">{profileErrors.bidang}</span>}
                  </div>
                </div>

                <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: '2.5rem', marginBottom: '1.25rem' }}>Keamanan Akun</h4>
                
                <div className="form-group">
                  <label className="form-label form-label-light" htmlFor="petCurrPass">Password Saat Ini</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
                      <Lock size={16} />
                    </span>
                    <input 
                      id="petCurrPass"
                      name="currentPassword"
                      type="password" 
                      className="form-control form-control-light" 
                      style={{ paddingLeft: '2.5rem' }}
                      placeholder="Masukkan password saat ini"
                      value={profileForm.currentPassword}
                      onChange={handleProfileChange}
                    />
                  </div>
                  {profileErrors.currentPassword && <span className="form-error">{profileErrors.currentPassword}</span>}
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label className="form-label form-label-light" htmlFor="petNewPass">Password Baru</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
                        <Lock size={16} />
                      </span>
                      <input 
                        id="petNewPass"
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
                    <label className="form-label form-label-light" htmlFor="petConfPass">Konfirmasi Password Baru</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
                        <Lock size={16} />
                      </span>
                      <input 
                        id="petConfPass"
                        name="confirmNewPassword"
                        type="password" 
                        className="form-control form-control-light" 
                        style={{ paddingLeft: '2.5rem' }}
                        placeholder="Konfirmasi password baru"
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
