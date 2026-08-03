import Link from "next/link";
import { LandingNavbar } from "@/components/landing/LandingNavbar";

export const metadata = {
  title: "Bantuan — CEPAT",
  description:
    "Temukan jawaban atas pertanyaan umum tentang cara menggunakan CEPAT, mulai dari daftar akun, posting tugas, sampai sistem poin.",
};

const FAQ_CATEGORIES = [
  {
    id: "memulai",
    icon: "person_add",
    title: "Memulai di CEPAT",
    items: [
      {
        q: "Siapa yang bisa daftar di CEPAT?",
        a: "Siapa saja yang berusia 17 tahun ke atas. CEPAT dirancang untuk mahasiswa dan pelaku UMKM lokal, tapi tidak ada batasan ketat soal profil pengguna.",
      },
      {
        q: "Bagaimana cara daftar?",
        a: "Buka halaman Daftar, masukkan nama lengkap, email, dan password. Kamu juga perlu memilih apakah bergabung sebagai Pekerja (worker) atau Pemberi Tugas (requester). Setelah daftar, kamu langsung diarahkan ke halaman onboarding untuk melengkapi profil.",
      },
      {
        q: "Apakah bisa punya dua peran sekaligus?",
        a: "Untuk saat ini, satu akun hanya untuk satu peran. Kalau kamu ingin posting tugas sekaligus menerima tugas, pilih peran yang paling sering kamu gunakan. Kami sedang mempertimbangkan fitur dual-role di pembaruan mendatang.",
      },
      {
        q: "Kenapa saya perlu mengizinkan akses lokasi?",
        a: "Fitur utama CEPAT adalah menampilkan tugas terdekat dari posisimu. Tanpa akses lokasi, kamu tidak akan bisa melihat tugas berdasarkan jarak. Lokasi hanya dibaca saat aplikasi aktif, tidak dilacak terus-menerus di background.",
      },
    ],
  },
  {
    id: "tugas",
    icon: "task_alt",
    title: "Posting & Mencari Tugas",
    items: [
      {
        q: "Bagaimana cara posting tugas?",
        a: "Masuk ke akun Pemberi Tugas, klik tombol 'Post Tugas Baru', lalu isi judul, deskripsi, kategori skill, lokasi, estimasi waktu, dan kompensasi. Tugas yang deskripsinya jelas cenderung lebih cepat dapat pekerja.",
      },
      {
        q: "Tugas apa saja yang bisa diposting?",
        a: "Kategori yang tersedia antara lain: Fotografi, Input Data, Desain, Survei, Jaga Booth, Editing, Administrasi, dan beberapa kategori lainnya. Tugas harus legal, jelas cakupannya, dan bisa diselesaikan dalam waktu singkat (biasanya hitungan jam sampai beberapa hari).",
      },
      {
        q: "Bagaimana cara menemukan tugas terdekat?",
        a: "Buka halaman Feed atau Cari Tugas. Tugas ditampilkan berdasarkan jarak dari posisimu saat ini. Kamu bisa filter berdasarkan radius (1 km, 3 km, 5 km, atau lebih) dan kategori skill.",
      },
      {
        q: "Apa yang terjadi setelah saya apply tugas?",
        a: "Pemberi tugas akan mendapat notifikasi dan melihat profilmu. Mereka bisa menerima atau melewati lamaranmu. Kalau diterima, kamu dapat notifikasi dan bisa langsung mulai koordinasi lewat chat in-app.",
      },
      {
        q: "Bisakah saya membatalkan apply yang sudah terkirim?",
        a: "Bisa, selama pemberi tugas belum menerima lamaranmu. Buka detail tugas dan pilih opsi batalkan lamaran.",
      },
    ],
  },
  {
    id: "poin",
    icon: "payments",
    title: "Poin & Kompensasi",
    items: [
      {
        q: "Apa itu poin CEPAT?",
        a: "Poin adalah unit kompensasi internal di platform. Pemberi tugas menetapkan jumlah poin saat posting tugas, dan poin itu masuk ke saldo pekerja setelah tugas dikonfirmasi selesai.",
      },
      {
        q: "Kapan poin masuk ke saldo saya?",
        a: "Poin masuk setelah pemberi tugas menekan tombol konfirmasi selesai. Kalau pemberi tugas tidak mengkonfirmasi dalam 72 jam setelah kamu tandai selesai, silakan hubungi kami.",
      },
      {
        q: "Bagaimana cara melihat saldo poin saya?",
        a: "Saldo poin terlihat di halaman Profil dan di pojok kiri sidebar (versi desktop). Rincian riwayat transaksi bisa dilihat di halaman Dompet.",
      },
      {
        q: "Apakah poin bisa dicairkan ke uang?",
        a: "Sistem penukaran poin masih dalam pengembangan. Untuk saat ini, poin berfungsi sebagai catatan kompensasi internal. Kami akan mengumumkan mekanisme penukaran ketika sudah siap.",
      },
    ],
  },
  {
    id: "rating",
    icon: "star",
    title: "Rating & Reputasi",
    items: [
      {
        q: "Bagaimana sistem rating bekerja?",
        a: "Setelah tugas selesai dan dikonfirmasi, kedua pihak bisa saling memberi rating dari 1 sampai 5 bintang beserta ulasan singkat. Rating rata-rata ditampilkan di profil publik kamu.",
      },
      {
        q: "Apakah rating bisa dihapus?",
        a: "Rating tidak bisa dihapus sendiri. Jika kamu yakin ada rating yang tidak adil atau palsu, hubungi kami dengan menyertakan ID tugas. Kami akan meninjau kasusnya.",
      },
      {
        q: "Kenapa rating penting?",
        a: "Rating tinggi membuat profilmu lebih menarik bagi calon pemberi tugas atau pekerja. Pemberi tugas sering mempertimbangkan rating sebelum menerima lamaran, terutama untuk tugas dengan kompensasi lebih besar.",
      },
    ],
  },
  {
    id: "teknis",
    icon: "build",
    title: "Masalah Teknis",
    items: [
      {
        q: "Aplikasi tidak bisa akses lokasi saya, kenapa?",
        a: "Periksa pengaturan izin lokasi di browser atau perangkat kamu. Pastikan izin untuk situs ini disetel ke 'Izinkan'. Kalau sudah diizinkan tapi tetap tidak bisa, coba refresh halaman atau clear cache browser.",
      },
      {
        q: "Notifikasi tidak masuk padahal sudah mengizinkan.",
        a: "Notifikasi push memerlukan browser yang mendukung service worker (Chrome, Firefox, Edge). Browser Safari di iOS memiliki keterbatasan. Coba reload halaman setelah mengizinkan notifikasi, atau gunakan Chrome untuk pengalaman terbaik.",
      },
      {
        q: "Saya tidak bisa login padahal password sudah benar.",
        a: "Coba gunakan fitur 'Lupa Password' untuk reset password. Kalau masih bermasalah, pastikan kamu menggunakan email yang sama saat mendaftar dan coba dari browser lain.",
      },
      {
        q: "Halaman lambat atau tidak termuat.",
        a: "Periksa koneksi internet kamu. CEPAT membutuhkan koneksi yang stabil terutama untuk fitur peta. Kalau koneksi stabil tapi masih lambat, hubungi kami karena mungkin ada gangguan dari sisi server.",
      },
    ],
  },
  {
    id: "lainnya",
    icon: "help",
    title: "Lainnya",
    items: [
      {
        q: "Bagaimana cara melaporkan pengguna yang bermasalah?",
        a: "Di halaman profil pengguna tersebut, cari opsi 'Laporkan'. Sertakan alasan dan detail kejadian. Tim kami akan meninjau laporan dalam 2 hari kerja.",
      },
      {
        q: "Bagaimana cara hapus akun saya?",
        a: "Kirim permintaan penghapusan akun ke bantuan@cepat.id dari alamat email yang terdaftar. Sertakan alasan penghapusan. Data akan dihapus dalam 30 hari kerja.",
      },
      {
        q: "Apakah CEPAT tersedia di semua kota?",
        a: "Saat ini CEPAT sedang dalam tahap awal dengan fokus di area Semarang. Ekspansi ke kota lain sedang dipertimbangkan berdasarkan antusiasme pengguna.",
      },
    ],
  },
];

export default function BantuanPage() {
  return (
    <div className="landing-page min-h-screen bg-layout-bg font-sans">
      <LandingNavbar />

      <main className="max-w-3xl mx-auto px-4 md:px-6 pt-28 pb-20">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight mb-3">
            Bantuan
          </h1>
          <p className="text-base text-on-surface-variant leading-relaxed max-w-prose">
            Temukan jawaban atas pertanyaan umum di bawah ini. Kalau tidak
            ketemu, hubungi kami langsung.
          </p>
        </div>

        {/* Contact CTA */}
        <div className="mb-10 p-5 rounded-xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-on-surface mb-1">
              Butuh bantuan lebih lanjut?
            </p>
            <p className="text-sm text-on-surface-variant">
              Tim kami merespons dalam 1 hari kerja.
            </p>
          </div>
          <a
            href="mailto:bantuan@cepat.id"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-on-primary font-semibold text-sm hover:bg-primary/90 transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">mail</span>
            bantuan@cepat.id
          </a>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-10">
          {FAQ_CATEGORIES.map((cat) => (
            <section key={cat.id} id={cat.id}>
              <div className="flex items-center gap-3 mb-5 pb-2 border-b border-outline-variant">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span
                    className="material-symbols-outlined text-primary text-[18px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {cat.icon}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-on-surface">{cat.title}</h2>
              </div>

              <div className="space-y-5">
                {cat.items.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="pt-0.5 shrink-0">
                      <div className="w-5 h-5 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center">
                        <span className="text-[10px] font-bold text-on-surface-variant">
                          {i + 1}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-on-surface mb-1">
                        {item.q}
                      </h3>
                      <p className="text-sm text-on-surface-variant leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Back link */}
        <div className="mt-14 pt-6 border-t border-outline-variant flex items-center gap-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Kembali ke Beranda
          </Link>
          <Link
            href="/kebijakan-privasi"
            className="text-sm text-on-surface-variant hover:text-primary transition-colors"
          >
            Kebijakan Privasi →
          </Link>
        </div>
      </main>
    </div>
  );
}
