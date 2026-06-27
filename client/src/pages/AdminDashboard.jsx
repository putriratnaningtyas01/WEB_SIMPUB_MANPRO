import React, { useState, useEffect } from 'react';
import {
  Users, User, FileText, Clock, Settings, LogOut,
  Search, Plus, Edit, Trash2, ShieldAlert, Calendar,
  MapPin, Phone, Mail, Eye, Download, Printer, Lock, CheckCircle
} from 'lucide-react';

export default function AdminDashboard({
  user, token, showToast, onLogout, systemSettings, onUpdateSettings, onUpdateProfile, API_BASE_URL
}) {
  const [activeMenu, setActiveMenu] = useState('overview'); // overview, users, complaints, detail, reports, settings, profile
  const [stats, setStats] = useState({ total: 0, pending: 0, processing: 0, completed: 0, rejected: 0, totalUsers: 0, totalStaff: 0 });
  const [activities, setActivities] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [categoryStats, setCategoryStats] = useState({});

  // Filter & Pagination - Users
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('Semua');

  // Filter & Pagination - Complaints
  const [complaintSearch, setComplaintSearch] = useState('');
  const [complaintStatusFilter, setComplaintStatusFilter] = useState('Semua');
  const [complaintPage, setComplaintPage] = useState(1);
  const [complaintTotalPages, setComplaintTotalPages] = useState(1);
  const [complaintLimit] = useState(6);

  // User CRUD Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // add, edit
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    nik: '',
    role: 'petugas',
    bidang: '',
    status: 'aktif',
    password: ''
  });
  const [userFormErrors, setUserFormErrors] = useState({});
  const [userSubmitLoading, setUserSubmitLoading] = useState(false);

  // System Settings state
  const [settingsForm, setSettingsForm] = useState({
    systemName: systemSettings.systemName || '',
    systemEmail: systemSettings.systemEmail || '',
    hotline: systemSettings.hotline || '',
    address: systemSettings.address || ''
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Profile Form state
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

  // Load dashboard overview data
  useEffect(() => {
    fetchStats();
    if (activeMenu === 'overview') {
      fetchRecentComplaints();
    } else if (activeMenu === 'users') {
      fetchUsers();
    } else if (activeMenu === 'complaints') {
      fetchComplaints();
    }
  }, [activeMenu, userSearch, userRoleFilter, complaintSearch, complaintStatusFilter, complaintPage]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.overall || {});
        setCategoryStats(data.categories || {});
      }
    } catch (err) {
      console.error("Gagal memuat statistik admin:", err);
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
      console.error("Gagal memuat aduan terbaru:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users?search=${userSearch}&role=${userRoleFilter}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsersList(data || []);
      }
    } catch (err) {
      console.error("Gagal memuat user:", err);
    }
  };

  const fetchComplaints = async () => {
    try {
      const url = `${API_BASE_URL}/complaints?page=${complaintPage}&limit=${complaintLimit}&search=${complaintSearch}&status=${complaintStatusFilter}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setComplaints(data.complaints || []);
        setComplaintTotalPages(data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error("Gagal memuat daftar aduan:", err);
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

  // --- USER CRUD OPERATIONS ---
  const handleOpenAddUser = () => {
    setModalMode('add');
    setSelectedUserId(null);
    setUserForm({
      name: '',
      email: '',
      phone: '',
      nik: '',
      role: 'petugas',
      bidang: '',
      status: 'aktif',
      password: ''
    });
    setUserFormErrors({});
    setShowUserModal(true);
  };

  const handleOpenEditUser = (targetUser) => {
    setModalMode('edit');
    setSelectedUserId(targetUser.id);
    setUserForm({
      name: targetUser.name,
      email: targetUser.email,
      phone: targetUser.phone,
      nik: targetUser.nik || '',
      role: targetUser.role,
      bidang: targetUser.bidang || '',
      status: targetUser.status || 'aktif',
      password: '' // Kosongkan password saat edit kecuali ingin diubah
    });
    setUserFormErrors({});
    setShowUserModal(true);
  };

  const handleUserFormChange = (e) => {
    const { name, value } = e.target;
    setUserForm(prev => ({ ...prev, [name]: value }));
  };

  const validateUserForm = () => {
    const errors = {};
    if (!userForm.name.trim()) errors.name = 'Nama lengkap wajib diisi.';
    if (!userForm.email) {
      errors.email = 'Email wajib diisi.';
    } else if (!/\S+@\S+\.\S+/.test(userForm.email)) {
      errors.email = 'Format email tidak valid.';
    }
    if (!userForm.phone) errors.phone = 'Nomor telepon wajib diisi.';

    if (userForm.role === 'masyarakat') {
      if (!userForm.nik) {
        errors.nik = 'NIK wajib diisi untuk role Masyarakat.';
      } else if (userForm.nik.length !== 16 || isNaN(userForm.nik)) {
        errors.nik = 'NIK harus 16 digit angka.';
      }
    }

    if (userForm.role === 'petugas' && !userForm.bidang.trim()) {
      errors.bidang = 'Bidang penugasan petugas wajib diisi.';
    }

    if (modalMode === 'add' && (!userForm.password || userForm.password.length < 6)) {
      errors.password = 'Password wajib diisi (minimal 6 karakter).';
    } else if (modalMode === 'edit' && userForm.password && userForm.password.length < 6) {
      errors.password = 'Password minimal harus 6 karakter.';
    }

    setUserFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (!validateUserForm()) return;

    setUserSubmitLoading(true);
    try {
      const url = modalMode === 'add'
        ? `${API_BASE_URL}/admin/users`
        : `${API_BASE_URL}/admin/users/${selectedUserId}`;
      const method = modalMode === 'add' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userForm)
      });
      const data = await response.json();
      setUserSubmitLoading(false);

      if (response.ok) {
        showToast(data.message || 'Data user berhasil disimpan!', 'success');
        setShowUserModal(false);
        fetchUsers();
        fetchStats();
      } else {
        showToast(data.message || 'Terjadi kesalahan.', 'error');
      }
    } catch (err) {
      setUserSubmitLoading(false);
      showToast('Gagal terhubung ke server.', 'error');
    }
  };

  const handleDeleteUser = async (id) => {
    if (id === user.id) {
      showToast('Anda tidak dapat menghapus akun Anda sendiri.', 'error');
      return;
    }

    if (!window.confirm('Apakah Anda yakin ingin menghapus user ini? Semua data terkait user mungkin ikut terpengaruh.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        showToast('User berhasil dihapus.', 'success');
        fetchUsers();
        fetchStats();
      } else {
        showToast(data.message || 'Gagal menghapus user.', 'error');
      }
    } catch (err) {
      showToast('Kesalahan koneksi ke server.', 'error');
    }
  };

  // --- SYSTEM SETTINGS ---
  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settingsForm)
      });
      const data = await response.json();
      setSettingsLoading(false);

      if (response.ok) {
        onUpdateSettings(data.settings);
      } else {
        showToast(data.message || 'Gagal menyimpan pengaturan.', 'error');
      }
    } catch (err) {
      setSettingsLoading(false);
      showToast('Gagal terhubung ke server.', 'error');
    }
  };

  // --- EDIT PROFIL ---
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!profileForm.name.trim()) errors.name = 'Nama lengkap wajib diisi.';
    if (!profileForm.email) errors.email = 'Email wajib diisi.';
    if (!profileForm.phone) errors.phone = 'No telepon wajib diisi.';

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
        showToast('Profil Admin berhasil diperbarui!', 'success');
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

  // --- REPORT GENERATION (PDF & EXCEL EXPORT) ---
  const handlePrintPDF = () => {
    window.print();
  };

  const handleExportCSV = async () => {
    try {
      // Fetch all complaints without pagination limits for full export
      const response = await fetch(`${API_BASE_URL}/complaints?limit=1000`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      const allComplaints = data.complaints || [];

      // Create CSV content (Excel-compatible with semicolons and BOM)
      const headers = ['ID Pengaduan', 'Tanggal', 'Nama Pelapor', 'NIK Pelapor', 'Kategori', 'Subkategori', 'Judul Aduan', 'Status'];
      const csvRows = [
        '\uFEFF' + headers.join(';'), // BOM to display UTF-8 correctly in Excel
        ...allComplaints.map(c => [
          c.id,
          new Date(c.createdAt).toLocaleDateString('id-ID'),
          c.reporterName,
          c.nik,
          c.category,
          c.subcategory,
          `"${c.title.replace(/"/g, '""')}"`,
          c.status
        ].join(';'))
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `SIMPUB_Laporan_Pengaduan_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Laporan berhasil diekspor ke Excel/CSV!', 'success');
    } catch (err) {
      showToast('Gagal mengekspor laporan.', 'error');
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Admin */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">📣</div>
          <span>SIMPUB</span>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            A
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user.name}</span>
            <span className="sidebar-user-role">Administrator</span>
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
            className={`sidebar-menu-item ${activeMenu === 'users' ? 'active' : ''}`}
            onClick={() => setActiveMenu('users')}
          >
            <Users size={18} /> Keloa User
          </li>
          <li
            className={`sidebar-menu-item ${activeMenu === 'complaints' || activeMenu === 'detail' ? 'active' : ''}`}
            onClick={() => {
              setComplaintPage(1);
              setActiveMenu('complaints');
            }}
          >
            <Clock size={18} /> Monitoring Pengaduan
          </li>
          <li
            className={`sidebar-menu-item ${activeMenu === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveMenu('reports')}
          >
            <Download size={18} /> Laporan & Rekap
          </li>
          <li
            className={`sidebar-menu-item ${activeMenu === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveMenu('settings')}
          >
            <Settings size={18} /> Pengaturan Sistem
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

      {/* Main Container */}
      <main className="main-content">
        <header className="main-header">
          <div className="main-header-title">
            <h1 id="page-title">
              {activeMenu === 'overview' && 'Dashboard Analisis Admin'}
              {activeMenu === 'users' && 'Manajemen Data Pengguna'}
              {activeMenu === 'complaints' && 'Monitoring Seluruh Pengaduan'}
              {activeMenu === 'detail' && 'Detail Dokumen Pengaduan'}
              {activeMenu === 'reports' && 'Rekapitulasi & Ekspor Laporan'}
              {activeMenu === 'settings' && 'Konfigurasi Sistem'}
              {activeMenu === 'profile' && 'Profil Administrator'}
              <span className="system-badge">SIMPUB ADMIN</span>
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
                  Melalui panel administrator SIMPUB ini, Anda memiliki kendali penuh untuk mengelola pengguna, memonitor seluruh pengaduan bansos, mengekstrak laporan, dan mengonfigurasi pengaturan sistem Dinas Sosial.
                </p>
              </div>
              <span className="welcome-banner-badge" style={{ borderColor: 'var(--primary-purple)', color: 'white' }}>Role: Admin</span>
            </div>

            {/* Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon stat-icon-blue"><Users size={24} /></div>
                <div className="stat-info">
                  <span className="stat-label">Total Masyarakat</span>
                  <span className="stat-value">{stats.totalUsers}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon stat-icon-purple"><ShieldAlert size={24} /></div>
                <div className="stat-info">
                  <span className="stat-label">Total Petugas</span>
                  <span className="stat-value">{stats.totalStaff}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon stat-icon-yellow"><FileText size={24} /></div>
                <div className="stat-info">
                  <span className="stat-label">Total Pengaduan</span>
                  <span className="stat-value">{stats.total}</span>
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

            {/* Panels */}
            <div className="dashboard-panels dashboard-panels-single">
              <div className="panel" style={{ minHeight: '300px' }}>
                <div className="panel-header">
                  <h3 className="panel-title"><Clock size={18} /> Pengaduan Masuk Terkini</h3>
                  <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} onClick={() => setActiveMenu('complaints')}>Lihat Semua</button>
                </div>
                <div className="activity-list">
                  {activities.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>Belum ada pengaduan masuk.</div>
                  ) : (
                    activities.map((c) => (
                      <div key={c.id} className="activity-item" style={{ cursor: 'pointer' }} onClick={() => handleViewDetail(c.id)}>
                        <div className={`activity-dot ${c.status === 'Menunggu' ? 'activity-dot-yellow' :
                            c.status === 'Diproses' ? 'activity-dot-blue' :
                              c.status === 'Selesai' ? 'activity-dot-green' : 'activity-dot-red'
                          }`}>
                          📝
                        </div>
                        <div className="activity-details" style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 700, color: 'var(--primary-blue-dark)' }}>{c.id}</span>
                            <span className={`badge ${c.status === 'Menunggu' ? 'badge-pending' :
                                c.status === 'Diproses' ? 'badge-processing' :
                                  c.status === 'Selesai' ? 'badge-completed' : 'badge-rejected'
                              }`}>{c.status}</span>
                          </div>
                          <div style={{ fontWeight: 600, marginTop: '0.2rem' }}>{c.title}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <span>Pelapor: {c.reporterName} ({c.category})</span>
                            <span>{new Date(c.createdAt).toLocaleString('id-ID')}</span>
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

        {/* 2. MANAGE USERS VIEW */}
        {activeMenu === 'users' && (
          <div className="dashboard-grid">
            <div className="panel" style={{ minHeight: 'auto' }}>
              <div className="table-controls">
                <div style={{ display: 'flex', gap: '1rem', flex: 1, flexWrap: 'wrap' }}>
                  <div className="search-box">
                    <Search size={18} className="search-icon-svg" />
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Cari user (Nama, Email, NIK)..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
                  <select
                    id="roleSelect"
                    className="filter-select"
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                  >
                    <option value="Semua">Semua Role</option>
                    <option value="masyarakat">Masyarakat</option>
                    <option value="petugas">Petugas</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <button className="btn btn-primary" onClick={handleOpenAddUser}>
                  <Plus size={18} /> Tambah User Baru
                </button>
              </div>

              {/* Table Users */}
              <div className="table-container">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Nama Lengkap</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status Akun</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>Tidak ada user terdaftar.</td>
                      </tr>
                    ) : (
                      usersList.map((u) => (
                        <tr key={u.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{u.name}</div>
                            {u.nik && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NIK: {u.nik}</div>}
                          </td>
                          <td>{u.email}</td>
                          <td>
                            <span style={{
                              textTransform: 'uppercase',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: u.role === 'admin' ? 'var(--primary-purple)' : u.role === 'petugas' ? 'var(--primary-blue)' : 'var(--text-secondary)'
                            }}>
                              {u.role === 'admin' ? 'Admin' : u.role === 'petugas' ? 'Petugas' : 'Masyarakat'}
                            </span>
                            {u.bidang && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({u.bidang})</div>}
                          </td>
                          <td>
                            <span className={`badge ${u.status === 'aktif' ? 'badge-active' : 'badge-inactive'}`}>
                              {u.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                className="btn-action-view"
                                title="Edit User"
                                style={{ color: 'var(--primary-blue)' }}
                                onClick={() => handleOpenEditUser(u)}
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                className="btn-action-view"
                                title="Hapus User"
                                style={{ color: '#dc2626' }}
                                onClick={() => handleDeleteUser(u.id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tambah/Edit User Modal */}
            {showUserModal && (
              <div className="modal-overlay">
                <div className="modal-card" style={{ maxWidth: '580px', textAlign: 'left' }}>
                  <h3 className="modal-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                    {modalMode === 'add' ? 'Tambah User Baru' : 'Ubah Data User'}
                  </h3>

                  <form onSubmit={handleUserSubmit}>
                    <div className="form-group-row">
                      <div className="form-group">
                        <label className="form-label form-label-light" htmlFor="formName">Nama Lengkap</label>
                        <input
                          id="formName"
                          name="name"
                          type="text"
                          className="form-control form-control-light"
                          value={userForm.name}
                          onChange={handleFormChange}
                          style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        />
                        {userFormErrors.name && <span className="form-error">{userFormErrors.name}</span>}
                      </div>
                      <div className="form-group">
                        <label className="form-label form-label-light" htmlFor="formPhone">Nomor Telepon</label>
                        <input
                          id="formPhone"
                          name="phone"
                          type="text"
                          className="form-control form-control-light"
                          value={userForm.phone}
                          onChange={handleFormChange}
                          style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        />
                        {userFormErrors.phone && <span className="form-error">{userFormErrors.phone}</span>}
                      </div>
                    </div>

                    <div className="form-group-row">
                      <div className="form-group">
                        <label className="form-label form-label-light" htmlFor="formEmail">Email</label>
                        <input
                          id="formEmail"
                          name="email"
                          type="email"
                          className="form-control form-control-light"
                          value={userForm.email}
                          onChange={handleFormChange}
                          style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        />
                        {userFormErrors.email && <span className="form-error">{userFormErrors.email}</span>}
                      </div>
                      <div className="form-group">
                        <label className="form-label form-label-light" htmlFor="formRole">Role</label>
                        <select
                          id="formRole"
                          name="role"
                          className="filter-select"
                          value={userForm.role}
                          onChange={handleFormChange}
                          style={{ width: '100%', padding: '0.75rem 1rem' }}
                        >
                          <option value="petugas">Petugas Dinas Sosial</option>
                          <option value="masyarakat">Masyarakat</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </div>
                    </div>

                    {userForm.role === 'masyarakat' && (
                      <div className="form-group">
                        <label className="form-label form-label-light" htmlFor="formNik">NIK KTP (16 Digit)</label>
                        <input
                          id="formNik"
                          name="nik"
                          type="text"
                          maxLength={16}
                          className="form-control form-control-light"
                          value={userForm.nik}
                          onChange={handleFormChange}
                          style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        />
                        {userFormErrors.nik && <span className="form-error">{userFormErrors.nik}</span>}
                      </div>
                    )}

                    {userForm.role === 'petugas' && (
                      <div className="form-group">
                        <label className="form-label form-label-light" htmlFor="formBid">Bidang Penanganan</label>
                        <input
                          id="formBid"
                          name="bidang"
                          type="text"
                          className="form-control form-control-light"
                          value={userForm.bidang}
                          placeholder="Contoh: BLT, PKH, BPNT"
                          onChange={handleFormChange}
                          style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        />
                        {userFormErrors.bidang && <span className="form-error">{userFormErrors.bidang}</span>}
                      </div>
                    )}

                    <div className="form-group-row">
                      <div className="form-group">
                        <label className="form-label form-label-light" htmlFor="formPass">Password {modalMode === 'edit' && '(Kosongkan jika tidak diubah)'}</label>
                        <input
                          id="formPass"
                          name="password"
                          type="password"
                          className="form-control form-control-light"
                          value={userForm.password}
                          onChange={handleFormChange}
                          style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                          placeholder="Min 6 karakter"
                        />
                        {userFormErrors.password && <span className="form-error">{userFormErrors.password}</span>}
                      </div>
                      {modalMode === 'edit' && (
                        <div className="form-group">
                          <label className="form-label form-label-light" htmlFor="formStatus">Status Akun</label>
                          <select
                            id="formStatus"
                            name="status"
                            className="filter-select"
                            value={userForm.status}
                            onChange={handleFormChange}
                            style={{ width: '100%', padding: '0.75rem 1rem' }}
                          >
                            <option value="aktif">Aktif</option>
                            <option value="nonaktif">Nonaktif</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>Batal</button>
                      <button type="submit" className="btn btn-primary" disabled={userSubmitLoading}>
                        {userSubmitLoading ? 'Menyimpan...' : 'Simpan User'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. MONITORING COMPLAINTS VIEW */}
        {activeMenu === 'complaints' && (
          <div className="dashboard-grid">
            <div className="panel" style={{ minHeight: 'auto' }}>
              <div className="table-controls">
                <div className="search-box">
                  <Search size={18} className="search-icon-svg" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Cari ID, Pelapor, atau Judul..."
                    value={complaintSearch}
                    onChange={(e) => {
                      setComplaintSearch(e.target.value);
                      setComplaintPage(1);
                    }}
                  />
                </div>

                <div className="filter-box">
                  <label htmlFor="complSelect" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</label>
                  <select
                    id="complSelect"
                    className="filter-select"
                    value={complaintStatusFilter}
                    onChange={(e) => {
                      setComplaintStatusFilter(e.target.value);
                      setComplaintPage(1);
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

              {/* Table Complaints */}
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
                        <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>Tidak ada pengaduan terdaftar.</td>
                      </tr>
                    ) : (
                      complaints.map((c) => (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 700, color: 'var(--primary-purple)' }}>{c.id}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{c.reporterName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NIK: {c.nik}</div>
                          </td>
                          <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
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
                              title="Lihat Detail Dokumen"
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
              {complaintTotalPages > 1 && (
                <div className="pagination">
                  <span className="pagination-info">Halaman {complaintPage} dari {complaintTotalPages}</span>
                  <div className="pagination-buttons">
                    <button
                      className="pagination-btn"
                      disabled={complaintPage === 1}
                      onClick={() => setComplaintPage(prev => Math.max(prev - 1, 1))}
                    >
                      Sebelumnya
                    </button>
                    {Array.from({ length: complaintTotalPages }).map((_, i) => (
                      <button
                        key={i}
                        className={`pagination-btn ${complaintPage === i + 1 ? 'active' : ''}`}
                        onClick={() => setComplaintPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      className="pagination-btn"
                      disabled={complaintPage === complaintTotalPages}
                      onClick={() => setComplaintPage(prev => Math.min(prev + 1, complaintTotalPages))}
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. DETAIL VIEW COMPLAINT */}
        {activeMenu === 'detail' && selectedComplaint && (
          <div className="dashboard-grid animate-fade-in">
            <button
              className="btn btn-secondary"
              style={{ width: 'fit-content', marginBottom: '0.5rem' }}
              onClick={() => setActiveMenu('complaints')}
            >
              ← Kembali ke Monitoring
            </button>

            <div className="complaint-detail-grid">
              {/* Left Panel */}
              <div className="panel" style={{ minHeight: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-blue-dark)' }}>ID Dokumen: {selectedComplaint.id}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dibuat pada {new Date(selectedComplaint.createdAt).toLocaleString('id-ID')}</p>
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
                  <div className="detail-label">Judul Laporan</div>
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
                  <div className="detail-label">Isi Keluhan Kelompok</div>
                  <div className="detail-value" style={{ whiteSpace: 'pre-wrap', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    {selectedComplaint.details}
                  </div>
                </div>

                <div className="detail-info-block">
                  <div className="detail-label">Bukti Lampiran Foto KTP/Kejadian</div>
                  <div className="evidence-img-container">
                    {selectedComplaint.evidence ? (
                      <img src={selectedComplaint.evidence} alt="Bukti" className="evidence-img" />
                    ) : (
                      <div className="evidence-placeholder">
                        <span>📷 Tidak ada gambar bukti dilampirkan.</span>
                      </div>
                    )}
                  </div>
                </div>

                <h4 style={{ margin: '2rem 0 1rem 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Detail Profil Warga Pelapor</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <div className="detail-label">Nama Pelapor</div>
                    <div className="detail-value">{selectedComplaint.reporterName}</div>
                  </div>
                  <div>
                    <div className="detail-label">NIK</div>
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
                  <div className="detail-label">Alamat Pelapor</div>
                  <div className="detail-value">{selectedComplaint.address}</div>
                </div>
              </div>

              {/* Right Panel Timeline */}
              <div className="panel" style={{ minHeight: 'auto' }}>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={20} color="var(--primary-purple)" /> Riwayat Timeline Penanganan
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

        {/* 5. REPORTS VIEW */}
        {activeMenu === 'reports' && (
          <div className="dashboard-grid">
            <div className="panel" style={{ minHeight: 'auto' }} id="print-area">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem' }}>Rekapitulasi Pengaduan Bantuan Sosial</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Pilih opsi ekspor laporan penanganan pengaduan</p>
                </div>
                <div className="nav-buttons" id="report-actions">
                  <button className="btn btn-secondary" onClick={handlePrintPDF}>
                    <Printer size={18} /> Cetak PDF (Print)
                  </button>
                  <button className="btn btn-primary" onClick={handleExportCSV}>
                    <Download size={18} /> Ekspor Excel (CSV)
                  </button>
                </div>
              </div>

              {/* Printable Header */}
              <div style={{ display: 'none', textAlign: 'center', marginBottom: '2rem' }} className="print-header-only">
                <h2 style={{ fontSize: '1.8rem', textTransform: 'uppercase' }}>{systemSettings.systemName}</h2>
                <h3 style={{ fontWeight: 500, fontSize: '1.1rem', margin: '0.5rem 0' }}>REKAPITULASI DOKUMEN LAPORAN MASYARAKAT</h3>
                <p style={{ fontSize: '0.85rem' }}>{systemSettings.address} | Hotline: {systemSettings.hotline}</p>
                <div style={{ height: '3px', background: 'black', margin: '1rem 0' }}></div>
              </div>

              {/* Statistics Table */}
              <h4 style={{ marginBottom: '1rem', fontFamily: 'Outfit' }}>1. Rekapitulasi Berdasarkan Kategori Aduan</h4>
              <div className="table-container" style={{ marginBottom: '2.5rem' }}>
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Nama Kategori Pengaduan</th>
                      <th style={{ textAlign: 'center' }}>Total Aduan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(categoryStats).length === 0 ? (
                      <tr>
                        <td colSpan="2" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada data kategori.</td>
                      </tr>
                    ) : (
                      Object.keys(categoryStats).map((catName) => (
                        <tr key={catName}>
                          <td style={{ fontWeight: 600 }}>{catName}</td>
                          <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--primary-blue)' }}>{categoryStats[catName]}</td>
                        </tr>
                      ))
                    )}
                    <tr style={{ background: '#f8fafc', fontWeight: 800, borderTop: '2px solid var(--border-color)' }}>
                      <td>Total Keseluruhan Laporan Masuk</td>
                      <td style={{ textAlign: 'center', fontSize: '1.1rem', color: 'var(--primary-purple-dark)' }}>{stats.total}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h4 style={{ marginBottom: '1rem', fontFamily: 'Outfit' }}>2. Ringkasan Status Penanganan Pengaduan</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }} className="print-stats-summary">
                <div style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Menunggu</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--status-pending-text)' }}>{stats.pending}</div>
                </div>
                <div style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Diproses</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--status-processing-text)' }}>{stats.processing}</div>
                </div>
                <div style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Selesai</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--status-completed-text)' }}>{stats.completed}</div>
                </div>
                <div style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Ditolak</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>{stats.rejected}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. SYSTEM CONFIG SETTINGS VIEW */}
        {activeMenu === 'settings' && (
          <div className="dashboard-grid">
            <div className="panel" style={{ minHeight: 'auto' }}>
              <form onSubmit={handleSettingsSubmit}>
                <h3 style={{ fontSize: '1.15rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Informasi Sistem SIMPUB</h3>

                <div className="form-group">
                  <label className="form-label form-label-light" htmlFor="setSysName">Nama Instansi / Nama Aplikasi</label>
                  <input
                    id="setSysName"
                    type="text"
                    className="form-control form-control-light"
                    value={settingsForm.systemName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, systemName: e.target.value })}
                  />
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label className="form-label form-label-light" htmlFor="setSysEmail">Email Layanan Sistem</label>
                    <input
                      id="setSysEmail"
                      type="email"
                      className="form-control form-control-light"
                      value={settingsForm.systemEmail}
                      onChange={(e) => setSettingsForm({ ...settingsForm, systemEmail: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-light" htmlFor="setSysHotline">Nomor Hotline / WA Dinas</label>
                    <input
                      id="setSysHotline"
                      type="text"
                      className="form-control form-control-light"
                      value={settingsForm.hotline}
                      onChange={(e) => setSettingsForm({ ...settingsForm, hotline: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label form-label-light" htmlFor="setSysAddr">Alamat Kantor Dinas Sosial</label>
                  <textarea
                    id="setSysAddr"
                    className="form-control form-control-light"
                    rows="3"
                    value={settingsForm.address}
                    onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  ></textarea>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={settingsLoading}
                  >
                    {settingsLoading ? 'Menyimpan...' : 'Simpan Pengaturan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 7. PROFILE VIEW */}
        {activeMenu === 'profile' && (
          <div className="dashboard-grid">
            <div className="panel" style={{ minHeight: 'auto' }}>
              <div className="profile-avatar-edit-container">
                <div className="profile-avatar-large" style={{ background: 'var(--gradient-primary)' }}>
                  A
                </div>
                <div>
                  <h3 style={{ fontSize: '1.35rem' }}>{user.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user.email} • Administrator</p>
                  <span className="badge badge-active" style={{ marginTop: '0.5rem' }}>AKUN ADMIN AKTIF</span>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit}>
                <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>Data Pribadi</h4>

                <div className="form-group-row">
                  <div className="form-group">
                    <label className="form-label form-label-light" htmlFor="admName">Nama Lengkap</label>
                    <input
                      id="admName"
                      name="name"
                      type="text"
                      className="form-control form-control-light"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    />
                    {profileErrors.name && <span className="form-error">{profileErrors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-light" htmlFor="admPhone">Nomor Telepon</label>
                    <input
                      id="admPhone"
                      name="phone"
                      type="text"
                      className="form-control form-control-light"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                    {profileErrors.phone && <span className="form-error">{profileErrors.phone}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label form-label-light" htmlFor="admEmail">Email Admin</label>
                  <input
                    id="admEmail"
                    name="email"
                    type="email"
                    className="form-control form-control-light"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                  {profileErrors.email && <span className="form-error">{profileErrors.email}</span>}
                </div>

                <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: '2.5rem', marginBottom: '1.25rem' }}>Ubah Password Keamanan</h4>

                <div className="form-group">
                  <label className="form-label form-label-light" htmlFor="admCurrPass">Password Saat Ini</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
                      <Lock size={16} />
                    </span>
                    <input
                      id="admCurrPass"
                      name="currentPassword"
                      type="password"
                      className="form-control form-control-light"
                      style={{ paddingLeft: '2.5rem' }}
                      placeholder="Masukkan password admin sekarang"
                      value={profileForm.currentPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                    />
                  </div>
                  {profileErrors.currentPassword && <span className="form-error">{profileErrors.currentPassword}</span>}
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label className="form-label form-label-light" htmlFor="admNewPass">Password Baru</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
                        <Lock size={16} />
                      </span>
                      <input
                        id="admNewPass"
                        name="newPassword"
                        type="password"
                        className="form-control form-control-light"
                        style={{ paddingLeft: '2.5rem' }}
                        placeholder="Minimal 6 karakter"
                        value={profileForm.newPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                      />
                    </div>
                    {profileErrors.newPassword && <span className="form-error">{profileErrors.newPassword}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-light" htmlFor="admConfPass">Konfirmasi Password Baru</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
                        <Lock size={16} />
                      </span>
                      <input
                        id="admConfPass"
                        name="confirmNewPassword"
                        type="password"
                        className="form-control form-control-light"
                        style={{ paddingLeft: '2.5rem' }}
                        placeholder="Ulangi password baru"
                        value={profileForm.confirmNewPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, confirmNewPassword: e.target.value })}
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
