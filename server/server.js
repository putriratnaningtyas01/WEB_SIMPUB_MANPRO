import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
  readDB, 
  writeDB, 
  getTable, 
  getById, 
  insert, 
  update, 
  remove, 
  getSettings, 
  updateSettings 
} from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = 'simpub_secret_key_super_secure_998877';

// Middleware
app.use(cors());
// Set limit lebih besar untuk mendukung upload base64 bukti gambar
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// JWT Authentication Middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan.' });
  }
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Sesi kedaluwarsa atau token tidak valid.' });
  }
};

// RBAC Middleware
const roleMiddleware = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Akses ditolak. Anda tidak memiliki wewenang.' });
    }
    next();
  };
};

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

// Register Masyarakat
app.post('/api/auth/register', (req, res) => {
  const { name, nik, email, phone, password, confirmPassword } = req.body;

  // Validasi Input
  if (!name || !nik || !email || !phone || !password || !confirmPassword) {
    return res.status(400).json({ message: 'Semua field wajib diisi.' });
  }
  if (nik.length !== 16 || isNaN(nik)) {
    return res.status(400).json({ message: 'NIK harus terdiri dari 16 digit angka.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Password dan konfirmasi password tidak cocok.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password minimal harus 6 karakter.' });
  }

  const users = getTable('users');
  
  // Cek apakah email sudah terdaftar
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'Email sudah terdaftar.' });
  }
  // Cek apakah NIK sudah terdaftar
  if (users.find(u => u.nik === nik)) {
    return res.status(400).json({ message: 'NIK sudah terdaftar.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  const newUser = {
    name,
    nik,
    email,
    phone,
    password: hashedPassword,
    role: 'masyarakat',
    status: 'aktif',
    createdAt: new Date().toISOString()
  };

  const createdUser = insert('users', newUser);
  
  // Create Token
  const token = jwt.sign({ id: createdUser.id, role: createdUser.role, name: createdUser.name }, SECRET_KEY, { expiresIn: '1d' });

  // Hapus password dari respons
  const { password: _, ...userWithoutPassword } = createdUser;
  res.status(201).json({
    message: 'Registrasi berhasil!',
    token,
    user: userWithoutPassword
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi.' });
  }

  const users = getTable('users');
  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(400).json({ message: 'Email atau password salah.' });
  }

  if (user.status !== 'aktif') {
    return res.status(403).json({ message: 'Akun Anda dinonaktifkan. Silakan hubungi administrator.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Email atau password salah.' });
  }

  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '1d' });

  const { password: _, ...userWithoutPassword } = user;
  res.json({
    message: 'Login berhasil!',
    token,
    user: userWithoutPassword
  });
});

// Get Current User Profile
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = getById('users', req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User tidak ditemukan.' });
  }
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Update Profile & Password
app.put('/api/auth/profile', authMiddleware, (req, res) => {
  const { name, email, phone, currentPassword, newPassword, bidang } = req.body;
  const user = getById('users', req.user.id);

  if (!user) {
    return res.status(404).json({ message: 'User tidak ditemukan.' });
  }

  // Validasi email unik jika berubah
  const users = getTable('users');
  if (email && email !== user.email && users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'Email sudah digunakan oleh akun lain.' });
  }

  const updateData = { name, email, phone };
  
  if (user.role === 'petugas' && bidang) {
    updateData.bidang = bidang;
  }

  // Jika ingin ganti password
  if (newPassword) {
    if (!currentPassword) {
      return res.status(400).json({ message: 'Password saat ini wajib diisi untuk mengubah password.' });
    }
    const isMatch = bcrypt.compareSync(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password saat ini salah.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password baru minimal harus 6 karakter.' });
    }
    const salt = bcrypt.genSaltSync(10);
    updateData.password = bcrypt.hashSync(newPassword, salt);
  }

  const updatedUser = update('users', user.id, updateData);
  const { password: _, ...userWithoutPassword } = updatedUser;
  res.json({
    message: 'Profil berhasil diperbarui!',
    user: userWithoutPassword
  });
});


// ==========================================
// 2. COMPLAINT (PENGADUAN) ENDPOINTS
// ==========================================

// Get All/Filtered Complaints
app.get('/api/complaints', authMiddleware, (req, res) => {
  let complaints = getTable('complaints');

  // Filter berdasarkan role (Masyarakat hanya bisa lihat miliknya)
  if (req.user.role === 'masyarakat') {
    complaints = complaints.filter(c => c.userId === req.user.id);
  }

  // Pencarian (Search)
  const { search, status, category, page = 1, limit = 5 } = req.query;
  
  if (search) {
    const q = search.toLowerCase();
    complaints = complaints.filter(c => 
      c.id.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.reporterName.toLowerCase().includes(q) ||
      c.nik.toLowerCase().includes(q) ||
      (c.details && c.details.toLowerCase().includes(q))
    );
  }

  // Filter Status
  if (status && status !== 'Semua') {
    complaints = complaints.filter(c => c.status.toLowerCase() === status.toLowerCase());
  }

  // Filter Kategori
  if (category && category !== 'Semua') {
    complaints = complaints.filter(c => c.category.toLowerCase() === category.toLowerCase());
  }

  // Sort dari yang terbaru
  complaints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Pagination
  const totalItems = complaints.length;
  const totalPages = Math.ceil(totalItems / limit);
  const offset = (page - 1) * limit;
  const paginatedComplaints = complaints.slice(offset, offset + Number(limit));

  res.json({
    complaints: paginatedComplaints,
    pagination: {
      totalItems,
      totalPages,
      currentPage: Number(page),
      limit: Number(limit)
    }
  });
});

// Get Complaint Detail
app.get('/api/complaints/:id', authMiddleware, (req, res) => {
  const complaint = getById('complaints', req.params.id);
  if (!complaint) {
    return res.status(404).json({ message: 'Pengaduan tidak ditemukan.' });
  }

  // Pastikan masyarakat tidak mengakses pengaduan orang lain
  if (req.user.role === 'masyarakat' && complaint.userId !== req.user.id) {
    return res.status(403).json({ message: 'Akses ditolak.' });
  }

  res.json(complaint);
});

// Create Complaint
app.post('/api/complaints', authMiddleware, roleMiddleware(['masyarakat']), (req, res) => {
  const { 
    reporterName, 
    nik, 
    phone, 
    email, 
    address, 
    title, 
    category, 
    subcategory, 
    details, 
    evidence 
  } = req.body;

  // Validasi
  if (!reporterName || !nik || !phone || !email || !address || !title || !category || !subcategory || !details) {
    return res.status(400).json({ message: 'Semua field wajib diisi kecuali bukti foto.' });
  }

  const complaints = getTable('complaints');
  
  // Format ID Pengaduan: PMB-YYYYMMDD-XXX
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `PMB-${dateStr}-`;
  
  const todayComplaints = complaints.filter(c => c.id.startsWith(prefix));
  const count = todayComplaints.length + 1;
  const complaintId = `${prefix}${String(count).padStart(3, '0')}`;

  const newComplaint = {
    id: complaintId,
    reporterName,
    nik,
    phone,
    email,
    address,
    title,
    category,
    subcategory,
    details,
    evidence: evidence || "", // simpan base64 string
    status: 'Menunggu',
    userId: req.user.id,
    createdAt: new Date().toISOString(),
    timeline: [
      {
        status: 'Menunggu',
        note: 'Pengaduan berhasil dikirim oleh masyarakat dan sedang menunggu verifikasi.',
        updatedAt: new Date().toISOString(),
        updatedBy: req.user.name
      }
    ]
  };

  const createdComplaint = insert('complaints', newComplaint);
  res.status(201).json({
    message: 'Pengaduan berhasil diajukan!',
    complaint: createdComplaint
  });
});

// Update Complaint Status (Verifikasi & Catatan Tindak Lanjut)
app.put('/api/complaints/:id/status', authMiddleware, roleMiddleware(['petugas', 'admin']), (req, res) => {
  const { status, note } = req.body;
  
  if (!status || !note) {
    return res.status(400).json({ message: 'Status dan catatan tindak lanjut wajib diisi.' });
  }

  const validStatuses = ['Menunggu', 'Diproses', 'Selesai', 'Ditolak'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Status tidak valid.' });
  }

  const complaint = getById('complaints', req.params.id);
  if (!complaint) {
    return res.status(404).json({ message: 'Pengaduan tidak ditemukan.' });
  }

  // Update status dan tambahkan timeline baru
  const newTimelineItem = {
    status,
    note,
    updatedAt: new Date().toISOString(),
    updatedBy: req.user.name
  };

  const updatedTimeline = [...complaint.timeline, newTimelineItem];
  
  const updatedComplaint = update('complaints', req.params.id, {
    status,
    timeline: updatedTimeline
  });

  res.json({
    message: `Status aduan berhasil diperbarui menjadi "${status}"`,
    complaint: updatedComplaint
  });
});


// ==========================================
// 3. ADMIN MANAGEMENT ENDPOINTS
// ==========================================

// Kelola User (GET, POST, PUT, DELETE)
app.get('/api/admin/users', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const users = getTable('users');
  const { search, role } = req.query;
  
  let filtered = [...users];

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(u => 
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.nik && u.nik.includes(q))
    );
  }

  if (role && role !== 'Semua') {
    filtered = filtered.filter(u => u.role.toLowerCase() === role.toLowerCase());
  }

  // Hilangkan password demi keamanan
  const usersResponse = filtered.map(({ password, ...u }) => u);
  res.json(usersResponse);
});

// Admin Add User
app.post('/api/admin/users', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const { name, email, phone, nik, role, password, bidang } = req.body;

  if (!name || !email || !phone || !role || !password) {
    return res.status(400).json({ message: 'Field wajib diisi: Nama, Email, Telepon, Role, Password' });
  }

  const users = getTable('users');
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'Email sudah terdaftar.' });
  }

  if (role === 'masyarakat' && (!nik || nik.length !== 16)) {
    return res.status(400).json({ message: 'NIK 16 digit diperlukan untuk role Masyarakat.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  const newUser = {
    name,
    email,
    phone,
    nik: nik || "",
    role,
    password: hashedPassword,
    status: 'aktif',
    createdAt: new Date().toISOString()
  };

  if (role === 'petugas' && bidang) {
    newUser.bidang = bidang;
  }

  const created = insert('users', newUser);
  const { password: _, ...userWithoutPassword } = created;
  
  res.status(201).json({
    message: 'User baru berhasil dibuat!',
    user: userWithoutPassword
  });
});

// Admin Edit User
app.put('/api/admin/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const { name, email, phone, nik, role, status, password, bidang } = req.body;
  const targetId = Number(req.params.id);

  const user = getById('users', targetId);
  if (!user) {
    return res.status(404).json({ message: 'User tidak ditemukan.' });
  }

  // Prevent changing own admin status or role
  if (user.id === req.user.id && (status === 'nonaktif' || role !== 'admin')) {
    return res.status(400).json({ message: 'Anda tidak bisa menonaktifkan atau mengubah role akun Admin Anda sendiri.' });
  }

  const updateData = { name, email, phone, role, status };

  if (nik !== undefined) updateData.nik = nik;
  if (role === 'petugas') {
    updateData.bidang = bidang || "";
  }

  if (password && password.trim() !== '') {
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password minimal harus 6 karakter.' });
    }
    const salt = bcrypt.genSaltSync(10);
    updateData.password = bcrypt.hashSync(password, salt);
  }

  const updated = update('users', targetId, updateData);
  const { password: _, ...userWithoutPassword } = updated;
  
  res.json({
    message: 'Data user berhasil diperbarui!',
    user: userWithoutPassword
  });
});

// Admin Delete User
app.delete('/api/admin/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const targetId = Number(req.params.id);

  if (targetId === req.user.id) {
    return res.status(400).json({ message: 'Anda tidak dapat menghapus akun Anda sendiri.' });
  }

  const success = remove('users', targetId);
  if (!success) {
    return res.status(404).json({ message: 'User tidak ditemukan.' });
  }

  res.json({ message: 'User berhasil dihapus!' });
});


// System Settings Endpoints
app.get('/api/admin/settings', authMiddleware, (req, res) => {
  res.json(getSettings());
});

app.put('/api/admin/settings', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const { systemName, systemEmail, hotline, address } = req.body;
  if (!systemName || !systemEmail || !hotline || !address) {
    return res.status(400).json({ message: 'Semua pengaturan sistem wajib diisi.' });
  }
  const updated = updateSettings({ systemName, systemEmail, hotline, address });
  res.json({
    message: 'Pengaturan sistem berhasil diperbarui!',
    settings: updated
  });
});


// ==========================================
// 4. REPORTS & STATISTICS ENDPOINTS
// ==========================================

app.get('/api/reports/stats', authMiddleware, (req, res) => {
  const complaints = getTable('complaints');
  const users = getTable('users');

  // Count pengaduan berdasarkan status
  const totalComplaints = complaints.length;
  const pending = complaints.filter(c => c.status === 'Menunggu').length;
  const processing = complaints.filter(c => c.status === 'Diproses').length;
  const completed = complaints.filter(c => c.status === 'Selesai').length;
  const rejected = complaints.filter(c => c.status === 'Ditolak').length;

  // Filter statistik per role jika login sebagai masyarakat
  let userStats = {};
  if (req.user.role === 'masyarakat') {
    const userComplaints = complaints.filter(c => c.userId === req.user.id);
    userStats = {
      total: userComplaints.length,
      pending: userComplaints.filter(c => c.status === 'Menunggu').length,
      processing: userComplaints.filter(c => c.status === 'Diproses').length,
      completed: userComplaints.filter(c => c.status === 'Selesai').length
    };
  }

  // Hitung jumlah user (Khusus Admin/Petugas)
  const totalUsers = users.filter(u => u.role === 'masyarakat').length;
  const totalStaff = users.filter(u => u.role === 'petugas').length;

  // Statistik kategori
  const categoriesCount = complaints.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {});

  // Mengembalikan data statistik sesuai role
  res.json({
    overall: {
      total: totalComplaints,
      pending,
      processing,
      completed,
      rejected,
      totalUsers,
      totalStaff
    },
    userStats,
    categories: categoriesCount,
    // data bulanan statik/simulasi untuk grafik
    monthlyStats: [
      { month: 'Jan', total: 5, selesai: 4 },
      { month: 'Feb', total: 8, selesai: 6 },
      { month: 'Mar', total: 12, selesai: 9 },
      { month: 'Apr', total: 15, selesai: 12 },
      { month: 'May', total: 10, selesai: 9 },
      { month: 'Jun', total: totalComplaints, selesai: completed }
    ]
  });
});

// Menjalankan Server
app.listen(PORT, () => {
  console.log(`Server SIMPUB berjalan di port ${PORT}`);
});
