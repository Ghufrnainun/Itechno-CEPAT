export interface AdminUser {
  id: string;
  nama_lengkap: string;
  username: string;
  email: string;
  role: 'Requester' | 'Worker' | 'Admin' | 'Dual-Role';
  rating_avg: number;
  total_completed: number;
  total_balance: number;
  held_balance: number;
  joined_at: string;
  avatar_url?: string;
  no_telpon?: string;
  alamat?: string;
  bio?: string;
  skills?: string[];
}

export interface AdminTask {
  id: string;
  judul_tugas: string;
  deskripsi_tugas: string;
  requester_name: string;
  requester_email: string;
  worker_assigned?: string;
  status: 'open' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  kategori: string;
  kompensasi: number;
  estimasi_waktu: string;
  created_at: string;
  applicants_count: number;
  lokasi_label: string;
}

export interface AdminCategory {
  id: string;
  nama_kategori: string;
  icon: string; // Icon key identifier (e.g., 'camera', 'laptop', 'palette')
  total_tasks: number;
  created_at: string;
}

export interface AdminSkill {
  id: string;
  nama_skill: string;
  total_users: number;
  created_at: string;
}

export const MOCK_ADMIN_USERS: AdminUser[] = [
  {
    id: 'usr-001',
    nama_lengkap: 'Andi Pratama',
    username: 'andipratama',
    email: 'andi.pratama@mahasiswa.ac.id',
    role: 'Worker',
    rating_avg: 4.9,
    total_completed: 18,
    total_balance: 450,
    held_balance: 0,
    joined_at: '2026-07-10',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    no_telpon: '081234567890',
    alamat: 'Kec. Sukasari, Bandung (Radius 0.5km)',
    bio: 'Mahasiswa DKV semester 6. Spesialis foto produk, desain banner, dan videografi acara.',
    skills: ['Fotografi & Videografi', 'Desain Grafis']
  },
  {
    id: 'usr-002',
    nama_lengkap: 'Bu Ani (Toko Kue Lezat)',
    username: 'kuelezat_ani',
    email: 'buani@kuelezat.com',
    role: 'Requester',
    rating_avg: 4.8,
    total_completed: 24,
    total_balance: 1200,
    held_balance: 150,
    joined_at: '2026-06-15',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    no_telpon: '085678901234',
    alamat: 'Jl. Dipatiukur No. 45, Bandung',
    bio: 'Pemilik UMKM Toko Kue Lezat dekat kampus Unpad Dipatiukur.',
    skills: []
  },
  {
    id: 'usr-003',
    nama_lengkap: 'Budi Santoso',
    username: 'budisantoso',
    email: 'budi.s@mahasiswa.ac.id',
    role: 'Dual-Role',
    rating_avg: 4.7,
    total_completed: 12,
    total_balance: 280,
    held_balance: 50,
    joined_at: '2026-07-01',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    no_telpon: '087812345678',
    alamat: 'Jl. Coblong No. 12, Bandung',
    bio: 'Suka bantu-bantu entry data dan les privat matematika/fisika.',
    skills: ['Data Entry & Administrasi', 'Tutoring / Les Privat']
  },
  {
    id: 'usr-004',
    nama_lengkap: 'Citra Dewi',
    username: 'citradewi',
    email: 'citra.dewi@mahasiswa.ac.id',
    role: 'Worker',
    rating_avg: 5.0,
    total_completed: 22,
    total_balance: 620,
    held_balance: 0,
    joined_at: '2026-05-20',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    no_telpon: '089612345678',
    alamat: 'Jl. Ganesha No. 10, Bandung',
    bio: 'Social media manager & copywriter lepas. Fast response!',
    skills: ['Social Media Management', 'Penulisan & Konten']
  },
  {
    id: 'usr-005',
    nama_lengkap: 'Super Admin ITechno',
    username: 'admin_itechno',
    email: 'admin@itechno.id',
    role: 'Admin',
    rating_avg: 5.0,
    total_completed: 0,
    total_balance: 9999,
    held_balance: 0,
    joined_at: '2026-05-01',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    no_telpon: '081100001111',
    alamat: 'HQ CEPAT Platform',
    bio: 'System Administrator & Content Moderator CEPAT.',
    skills: ['Teknis (IT support, setup perangkat)']
  }
];

export const MOCK_ADMIN_TASKS: AdminTask[] = [
  {
    id: 'tsk-101',
    judul_tugas: 'Foto 20 Produk Kue untuk Instagram UMKM',
    deskripsi_tugas: 'Dibutuhkan mahasiswa yang punya kamera/HP bagus untuk foto 20 varian kue kering di toko kami. Termasuk editing ringan & retouch warna.',
    requester_name: 'Bu Ani (Toko Kue Lezat)',
    requester_email: 'buani@kuelezat.com',
    worker_assigned: 'Andi Pratama',
    status: 'in_progress',
    kategori: 'Fotografi & Videografi',
    kompensasi: 75,
    estimasi_waktu: '2 Jam',
    created_at: '2026-08-09 14:30',
    applicants_count: 4,
    lokasi_label: 'Jl. Dipatiukur No. 45 (Radius 0.8 km)'
  },
  {
    id: 'tsk-102',
    judul_tugas: 'Bantuan Jaga Booth Stand Bazar Kampus',
    deskripsi_tugas: 'Butuh 1 orang mahasiswa penunggu stand makanan di Lapangan Futsal Kampus selama sesi sore jam 15:00 - 18:00.',
    requester_name: 'Budi Santoso',
    requester_email: 'budi.s@mahasiswa.ac.id',
    worker_assigned: undefined,
    status: 'open',
    kategori: 'Jaga Booth / Event Helper',
    kompensasi: 50,
    estimasi_waktu: '3 Jam',
    created_at: '2026-08-10 09:15',
    applicants_count: 2,
    lokasi_label: 'Lapangan Futsal Kampus (Radius 0.3 km)'
  },
  {
    id: 'tsk-103',
    judul_tugas: 'Design Poster Event Webinar Nasional',
    deskripsi_tugas: 'Buat 1 flyer utama + 3 feeds Instagram untuk acara webinar Himpunan Mahasiswa. Asset logo dan teks sudah siap.',
    requester_name: 'Budi Santoso',
    requester_email: 'budi.s@mahasiswa.ac.id',
    worker_assigned: 'Citra Dewi',
    status: 'completed',
    kategori: 'Desain Grafis',
    kompensasi: 60,
    estimasi_waktu: '1 Hari',
    created_at: '2026-08-07 10:00',
    applicants_count: 5,
    lokasi_label: 'Online / Remote'
  },
  {
    id: 'tsk-104',
    judul_tugas: 'Entry 100 Data Transaksi Toko ke Excel',
    deskripsi_tugas: 'Salin data struk fisik penjualan harian ke dalam format spreadsheet Excel yang sudah disediakan template-nya.',
    requester_name: 'Bu Ani (Toko Kue Lezat)',
    requester_email: 'buani@kuelezat.com',
    worker_assigned: 'Budi Santoso',
    status: 'accepted',
    kategori: 'Data Entry & Administrasi',
    kompensasi: 40,
    estimasi_waktu: '3 Jam',
    created_at: '2026-08-09 18:20',
    applicants_count: 3,
    lokasi_label: 'Jl. Dipatiukur No. 45 (Radius 0.8 km)'
  },
  {
    id: 'tsk-105',
    judul_tugas: 'Antar Berkas Dokumen Penting ke Rektorat',
    deskripsi_tugas: 'Antar map dokumen pengesahan proposal dari Gedung Dekanat ke Lantai 2 Gedung Rektorat Utama.',
    requester_name: 'Citra Dewi',
    requester_email: 'citra.dewi@mahasiswa.ac.id',
    worker_assigned: undefined,
    status: 'cancelled',
    kategori: 'Kurir / Antar Barang',
    kompensasi: 25,
    estimasi_waktu: '30 Menit',
    created_at: '2026-08-06 11:45',
    applicants_count: 0,
    lokasi_label: 'Area Kampus Utama (Radius 0.2 km)'
  }
];

export const MOCK_ADMIN_CATEGORIES: AdminCategory[] = [
  { id: 'cat-01', nama_kategori: 'Fotografi & Videografi', icon: 'Camera', total_tasks: 42, created_at: '2026-05-01' },
  { id: 'cat-02', nama_kategori: 'Data Entry & Administrasi', icon: 'Laptop', total_tasks: 58, created_at: '2026-05-01' },
  { id: 'cat-03', nama_kategori: 'Desain Grafis', icon: 'Palette', total_tasks: 64, created_at: '2026-05-01' },
  { id: 'cat-04', nama_kategori: 'Penulisan & Konten', icon: 'FileText', total_tasks: 31, created_at: '2026-05-01' },
  { id: 'cat-05', nama_kategori: 'Jaga Booth / Event Helper', icon: 'Box', total_tasks: 25, created_at: '2026-05-01' },
  { id: 'cat-06', nama_kategori: 'Kurir / Antar Barang', icon: 'Truck', total_tasks: 19, created_at: '2026-05-01' },
  { id: 'cat-07', nama_kategori: 'Teknis (IT support, setup)', icon: 'Wrench', total_tasks: 14, created_at: '2026-05-01' },
  { id: 'cat-08', nama_kategori: 'Social Media Management', icon: 'Smartphone', total_tasks: 37, created_at: '2026-05-01' },
  { id: 'cat-09', nama_kategori: 'Tutoring / Les Privat', icon: 'GraduationCap', total_tasks: 22, created_at: '2026-05-01' }
];

export const MOCK_ADMIN_SKILLS: AdminSkill[] = [
  { id: 'skl-01', nama_skill: 'Fotografi Produk', total_users: 34, created_at: '2026-05-01' },
  { id: 'skl-02', nama_skill: 'Adobe Photoshop / Illustrator', total_users: 52, created_at: '2026-05-01' },
  { id: 'skl-03', nama_skill: 'Microsoft Excel & Data Entry', total_users: 78, created_at: '2026-05-01' },
  { id: 'skl-04', nama_skill: 'Copywriting & Content Writing', total_users: 41, created_at: '2026-05-01' },
  { id: 'skl-05', nama_skill: 'Video Editing (CapCut/Premiere)', total_users: 39, created_at: '2026-05-01' },
  { id: 'skl-06', nama_skill: 'Public Speaking & Event Guard', total_users: 29, created_at: '2026-05-01' },
  { id: 'skl-07', nama_skill: 'Troubleshooting PC & Laptop', total_users: 18, created_at: '2026-05-01' }
];

export const MOCK_CHART_TASK_TRENDS = [
  { date: '04 Aug', open: 8, completed: 5, total: 13 },
  { date: '05 Aug', open: 12, completed: 9, total: 21 },
  { date: '06 Aug', open: 15, completed: 12, total: 27 },
  { date: '07 Aug', open: 11, completed: 14, total: 25 },
  { date: '08 Aug', open: 18, completed: 16, total: 34 },
  { date: '09 Aug', open: 22, completed: 19, total: 41 },
  { date: '10 Aug', open: 26, completed: 21, total: 47 }
];

export const MOCK_CHART_STATUS_DISTRIBUTION = [
  { name: 'Open', value: 35, color: '#0f766e' },
  { name: 'Accepted', value: 20, color: '#1F6C9F' },
  { name: 'In Progress', value: 25, color: '#956400' },
  { name: 'Completed', value: 45, color: '#346538' },
  { name: 'Cancelled', value: 8, color: '#9F2F2D' }
];
