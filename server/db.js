import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'data', 'db.json');

// Pastikan direktori data ada
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Data awal (Seed Data)
const getInitialData = () => {
  const salt = bcrypt.genSaltSync(10);

  const defaultUsers = [
    {
      id: 1,
      name: "Administrator SIMPUB",
      nik: "0000000000000000",
      email: "admin@simpub.go.id",
      phone: "081122334455",
      password: bcrypt.hashSync("admin123", salt),
      role: "admin",
      status: "aktif",
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: "Budi Santoso",
      nik: "3201020304050001",
      email: "petugas@simpub.go.id",
      phone: "081234567890",
      password: bcrypt.hashSync("petugas123", salt),
      role: "petugas",
      bidang: "Bantuan Sosial Tunai",
      status: "aktif",
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      name: "Siti Rahma",
      nik: "3201020304050002",
      email: "masyarakat@gmail.com",
      phone: "085711223344",
      password: bcrypt.hashSync("user123", salt),
      role: "masyarakat",
      status: "aktif",
      createdAt: new Date().toISOString()
    }
  ];

  const defaultComplaints = [
    {
      id: "PMB-20260627-001",
      reporterName: "Siti Rahma",
      nik: "3201020304050002",
      phone: "085711223344",
      email: "masyarakat@gmail.com",
      address: "Jl. Mawar Merah No. 45, Depok",
      title: "Bantuan PKH Bulan Ini Belum Diterima",
      category: "Bantuan Sosial",
      subcategory: "Program Keluarga Harapan (PKH)",
      details: "Selamat siang, saya terdaftar sebagai penerima PKH, namun bantuan untuk triwulan kedua tahun ini belum juga masuk ke rekening KKS saya. Mohon bantuan untuk melakukan pengecekan.",
      evidence: "",
      status: "Diproses",
      userId: 3,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 hari lalu
      timeline: [
        {
          status: "Menunggu",
          note: "Pengaduan berhasil diajukan oleh masyarakat.",
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedBy: "Siti Rahma"
        },
        {
          status: "Diproses",
          note: "Laporan terverifikasi. Sedang kami koordinasikan dengan pendamping PKH kecamatan.",
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updatedBy: "Budi Santoso"
        }
      ]
    },
    {
      id: "PMB-20260627-002",
      reporterName: "Joko Anggoro",
      nik: "3201020304050003",
      phone: "089988776655",
      email: "joko@gmail.com",
      address: "Kampung Baru RT 02/RW 05, Kelurahan Pancoran Mas",
      title: "Salah Sasaran Penerima BLT BBM",
      category: "Salah Sasaran",
      subcategory: "BLT Bahan Bakar Minyak",
      details: "Tetangga saya yang memiliki mobil dan rumah mewah mendapatkan kartu BLT BBM, sementara warga miskin lainnya tidak terdaftar. Mohon verifikasi ulang data penerima di wilayah kami.",
      evidence: "",
      status: "Menunggu",
      userId: 3,
      createdAt: new Date().toISOString(),
      timeline: [
        {
          status: "Menunggu",
          note: "Pengaduan diajukan.",
          updatedAt: new Date().toISOString(),
          updatedBy: "Siti Rahma"
        }
      ]
    }
  ];

  const defaultSettings = {
    systemName: "SIMPUB Dinsos",
    systemEmail: "dinsos.aduan@pemda.go.id",
    hotline: "0812-3456-7890",
    address: "Jl. Raya Jenderal Sudirman No. 12, Lantai 3, Gedung Pelayanan Sosial, DKI Jakarta"
  };

  return {
    users: defaultUsers,
    complaints: defaultComplaints,
    settings: defaultSettings
  };
};

// Baca Database
export const readDB = () => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initial = getInitialData();
      writeDB(initial);
      return initial;
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database file", err);
    return getInitialData();
  }
};

// Tulis Database
export const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error("Error writing to database file", err);
    return false;
  }
};

// Helper Helper CRUD
export const getTable = (tableName) => {
  const db = readDB();
  return db[tableName] || [];
};

export const getById = (tableName, id) => {
  const table = getTable(tableName);
  return table.find(item => item.id == id);
};

export const insert = (tableName, item) => {
  const db = readDB();
  if (!db[tableName]) db[tableName] = [];

  // Auto-increment ID jika berupa angka
  if (tableName === 'users') {
    const maxId = db[tableName].reduce((max, u) => u.id > max ? u.id : max, 0);
    item.id = maxId + 1;
  }

  db[tableName].push(item);
  writeDB(db);
  return item;
};

export const update = (tableName, id, updatedData) => {
  const db = readDB();
  if (!db[tableName]) return null;

  const index = db[tableName].findIndex(item => item.id == id);
  if (index === -1) return null;

  // Merge data lama dan data baru
  db[tableName][index] = { ...db[tableName][index], ...updatedData };
  writeDB(db);
  return db[tableName][index];
};

export const remove = (tableName, id) => {
  const db = readDB();
  if (!db[tableName]) return false;

  const index = db[tableName].findIndex(item => item.id == id);
  if (index === -1) return false;

  db[tableName].splice(index, 1);
  writeDB(db);
  return true;
};

export const getSettings = () => {
  const db = readDB();
  return db.settings || {};
};

export const updateSettings = (newSettings) => {
  const db = readDB();
  db.settings = { ...db.settings, ...newSettings };
  writeDB(db);
  return db.settings;
};
