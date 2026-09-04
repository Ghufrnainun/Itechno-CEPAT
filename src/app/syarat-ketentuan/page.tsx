import Link from "next/link";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Syarat & Ketentuan: CEPAT",
  description:
    "Baca syarat dan ketentuan penggunaan platform CEPAT sebelum mendaftar sebagai pemberi tugas atau pekerja.",
};

const SECTIONS = [
  {
    id: "penerimaan",
    title: "Penerimaan Ketentuan",
    content: `Dengan membuat akun di CEPAT, kamu setuju dengan syarat dan ketentuan ini. Jika tidak setuju dengan salah satu poin, jangan gunakan platform ini.

Kami bisa memperbarui ketentuan ini sewaktu-waktu. Jika ada perubahan penting, kami akan kirim notifikasi ke email kamu minimal 7 hari sebelum berlaku. Melanjutkan penggunaan setelah tanggal berlaku artinya kamu menerima ketentuan yang diperbarui.`,
  },
  {
    id: "platform",
    title: "Tentang Platform",
    content: `CEPAT adalah platform micro-freelancing berbasis lokasi yang menghubungkan mahasiswa dengan UMKM lokal dan sesama mahasiswa yang membutuhkan bantuan tugas singkat di sekitar area kampus.

CEPAT bukan agensi tenaga kerja. Kami menyediakan teknologi untuk mempertemukan dua pihak, tapi tidak menjamin ketersediaan tugas, kelancaran pembayaran di luar platform, atau hasil kerja yang dihasilkan pekerja.`,
  },
  {
    id: "akun",
    title: "Persyaratan Akun",
    content: `Untuk menggunakan CEPAT, kamu harus:

- Berusia minimal 17 tahun atau sudah terdaftar sebagai mahasiswa aktif.
- Memberikan informasi yang akurat saat mendaftar. Akun dengan data palsu bisa kami nonaktifkan tanpa pemberitahuan.
- Menjaga kerahasiaan password. Segala aktivitas yang terjadi di bawah akunmu menjadi tanggung jawabmu.
- Tidak membuat lebih dari satu akun untuk menghindari sanksi atau memanipulasi sistem rating.

Satu nomor telepon hanya bisa terdaftar untuk satu akun.`,
  },
  {
    id: "pemberi-tugas",
    title: "Kewajiban Pemberi Tugas",
    content: `Jika kamu memposting tugas di CEPAT, kamu bertanggung jawab untuk:

- Mendeskripsikan tugas secara jelas, termasuk estimasi waktu dan lokasi yang akurat.
- Menyebutkan kompensasi yang jujur sebelum ada pekerja yang apply.
- Merespons lamaran masuk dalam waktu wajar (disarankan maksimal 24 jam).
- Memberikan konfirmasi penyelesaian tugas segera setelah tugas selesai, bukan menunda-nunda.
- Membayar kompensasi yang disepakati. Tidak membayar setelah tugas selesai adalah pelanggaran yang bisa menyebabkan akunmu dibekukan.

Tugas yang melanggar hukum, mengandung penipuan, atau bersifat eksploitatif tidak diizinkan dan akan dihapus.`,
  },
  {
    id: "pekerja",
    title: "Kewajiban Pekerja",
    content: `Jika kamu menerima tugas di CEPAT, kamu bertanggung jawab untuk:

- Hanya apply tugas yang benar-benar kamu bisa dan mampu selesaikan.
- Menyelesaikan tugas sesuai deskripsi dan tenggat yang disepakati.
- Mengkomunikasikan kendala sejak dini, bukan tiba-tiba menghilang setelah accept.
- Tidak membatalkan tugas yang sudah diterima tanpa alasan yang jelas. Pembatalan berulang akan menurunkan rating dan membatasi akses ke tugas baru.

Pekerja yang tidak menyelesaikan tugas tanpa konfirmasi bisa dikenai pembatasan akun.`,
  },
  {
    id: "kompensasi",
    title: "Kompensasi",
    content: `Kompensasi di CEPAT menggunakan sistem poin internal. Poin diperoleh pekerja setelah pemberi tugas mengkonfirmasi tugas selesai.

Nilai dan cara penukaran poin akan kami informasikan secara terpisah. Untuk sementara, poin dicatat sebagai saldo di profil kamu.

CEPAT tidak bertanggung jawab atas kesepakatan pembayaran di luar platform. Jika ada sengketa terkait kompensasi, kami hanya bisa membantu berdasarkan data yang tercatat di sistem.`,
  },
  {
    id: "larangan",
    title: "Yang Tidak Diizinkan",
    content: `Penggunaan berikut ini dilarang di platform CEPAT:

- Memposting tugas yang bertujuan penipuan, pelecehan, atau merugikan pihak lain.
- Memanipulasi rating dengan cara apa pun, termasuk meminta teman untuk memberi ulasan palsu.
- Menggunakan data pengguna lain (kontak, foto profil, lokasi) untuk tujuan di luar tugas yang disepakati.
- Menghubungi pengguna lain untuk menawarkan transaksi di luar platform dengan tujuan menghindari sistem.
- Membuat bot atau skrip otomatis untuk mengakses atau memanipulasi layanan.

Pelanggaran bisa berujung pada penangguhan atau penghapusan akun permanen.`,
  },
  {
    id: "tanggung-jawab",
    title: "Batasan Tanggung Jawab",
    content: `CEPAT tidak bertanggung jawab atas:

- Kerugian yang timbul dari transaksi antara pemberi tugas dan pekerja.
- Keakuratan informasi yang dimasukkan pengguna di profil atau deskripsi tugas.
- Gangguan layanan akibat pemeliharaan sistem, force majeure, atau hal di luar kendali kami.
- Konten yang diunggah pengguna, termasuk foto hasil kerja atau pesan di chat.

Kami menyediakan platform sebagaimana adanya. Gunakan dengan pertimbangan sendiri.`,
  },
  {
    id: "penyelesaian-sengketa",
    title: "Penyelesaian Sengketa",
    content: `Jika ada perselisihan antara pemberi tugas dan pekerja, langkah yang kami sarankan:

1. Coba selesaikan langsung melalui fitur chat in-app.
2. Jika tidak berhasil, ajukan aduan melalui menu Laporkan Masalah atau Pusat Sengketa di aplikasi dengan menyertakan ID tugas dan ringkasan masalah.
3. Kami akan meninjau riwayat percakapan dan data tugas, lalu memberikan rekomendasi penyelesaian dalam 3 hari kerja.

Keputusan akhir dari tim CEPAT bersifat final dalam konteks penggunaan platform ini.`,
  },
  {
    id: "hukum",
    title: "Hukum yang Berlaku",
    content: `Ketentuan ini diatur oleh hukum Republik Indonesia. Segala sengketa yang tidak bisa diselesaikan secara internal akan diserahkan ke pengadilan yang berwenang di wilayah Kota Semarang.`,
  },
];

export default function SyaratKetentuanPage() {
  return (
    <div className="landing-page min-h-screen bg-layout-bg font-sans">
      <LandingNavbar />

      <main className="max-w-3xl mx-auto px-4 md:px-6 pt-28 pb-20">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-outline-variant bg-white/60 text-xs text-on-surface-variant mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Terakhir diperbarui: Agustus 2026
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight mb-3">
            Syarat &amp; Ketentuan
          </h1>
          <p className="text-base text-on-surface-variant leading-relaxed max-w-prose">
            Baca halaman ini sebelum menggunakan CEPAT. Dengan mendaftar, kamu
            setuju dengan semua poin di bawah ini, baik sebagai pemberi tugas
            maupun pekerja.
          </p>
        </div>

        {/* Table of contents */}
        <nav className="mb-10 p-4 rounded-xl bg-surface-container border border-outline-variant">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
            Daftar Isi
          </p>
          <ol className="space-y-1.5">
            {SECTIONS.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-sm text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2"
                >
                  <span className="text-xs font-mono text-outline w-5 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Sections */}
        <div className="space-y-10">
          {SECTIONS.map((section, i) => (
            <section key={section.id} id={section.id}>
              <h2 className="text-lg font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant flex items-center gap-3">
                <span className="text-xs font-mono text-outline">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {section.title}
              </h2>
              <div className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-10 p-4 rounded-xl bg-surface-container border border-outline-variant">
          <p className="text-sm text-on-surface-variant">
            Ada pertanyaan tentang ketentuan ini? Ajukan melalui menu{" "}
            <Link href="/bantuan" className="text-primary hover:underline font-medium">
              Pusat Bantuan
            </Link>{" "}
            atau laporkan langsung via fitur Laporan di aplikasi (email kontak:{" "}
            <span className="text-primary font-medium font-mono">bantuan@cepat.id</span>).
          </p>
        </div>

        {/* Back link */}
        <div className="mt-10 pt-6 border-t border-card-border flex items-center gap-6 text-xs font-semibold">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
          <Link
            href="/bantuan"
            className="text-on-surface-variant hover:text-primary transition-colors"
          >
            Bantuan →
          </Link>
        </div>
      </main>
    </div>
  );
}
