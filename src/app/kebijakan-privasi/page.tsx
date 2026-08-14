import Link from "next/link";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Kebijakan Privasi — CEPAT",
  description:
    "Pelajari bagaimana CEPAT mengumpulkan, menggunakan, dan melindungi data pribadi kamu sebagai pengguna platform.",
};

const SECTIONS = [
  {
    id: "data-dikumpulkan",
    title: "Data yang Kami Kumpulkan",
    content: [
      {
        subtitle: "Data Akun",
        text: "Saat kamu mendaftar, kami mengumpulkan nama lengkap, alamat email, nomor telepon, dan foto profil. Data ini digunakan untuk mengidentifikasi kamu sebagai pengguna dan membangun kepercayaan antara pemberi tugas dan pekerja.",
      },
      {
        subtitle: "Data Lokasi",
        text: "CEPAT menggunakan lokasi perangkat kamu untuk menampilkan tugas-tugas yang tersedia di sekitar area kamu. Lokasi hanya dibaca saat kamu membuka aplikasi dan tidak disimpan secara permanen di server kami.",
      },
      {
        subtitle: "Data Aktivitas",
        text: "Kami menyimpan riwayat tugas yang kamu posting, lamar, dan selesaikan. Data ini digunakan untuk menghitung rating, total pekerjaan selesai, dan menampilkan portofolio kerjamu kepada calon pemberi tugas.",
      },
      {
        subtitle: "Data Komunikasi",
        text: "Pesan dalam fitur chat in-app antara pemberi tugas dan pekerja disimpan selama 90 hari setelah tugas selesai, untuk keperluan penyelesaian sengketa jika diperlukan.",
      },
    ],
  },
  {
    id: "penggunaan-data",
    title: "Bagaimana Kami Menggunakan Data",
    content: [
      {
        subtitle: "Menjalankan Platform",
        text: "Data kamu digunakan untuk mencocokkan tugas dengan pekerja yang relevan berdasarkan lokasi, skill, dan ketersediaan — bukan dijual ke pihak ketiga.",
      },
      {
        subtitle: "Keamanan Transaksi",
        text: "Nomor telepon dan data verifikasi digunakan untuk mencegah penipuan dan memastikan setiap pengguna adalah orang nyata yang bisa dihubungi.",
      },
      {
        subtitle: "Notifikasi",
        text: "Kami mengirim notifikasi push tentang status tugas, lamaran baru, dan pesan chat. Kamu bisa menonaktifkan notifikasi kapan saja dari pengaturan perangkat.",
      },
      {
        subtitle: "Peningkatan Layanan",
        text: "Data agregat (tanpa identitas pribadi) digunakan untuk memahami pola penggunaan dan memperbaiki fitur platform secara berkelanjutan.",
      },
    ],
  },
  {
    id: "keamanan",
    title: "Keamanan Data",
    content: [
      {
        subtitle: "Enkripsi",
        text: "Semua data yang dikirim antara perangkat kamu dan server kami dienkripsi menggunakan protokol HTTPS/TLS. Password tidak pernah disimpan dalam bentuk terbaca.",
      },
      {
        subtitle: "Akses Terbatas",
        text: "Hanya tim teknis inti yang memiliki akses ke database pengguna, dan setiap akses dicatat untuk keperluan audit keamanan.",
      },
      {
        subtitle: "Otentikasi",
        text: "Kami menggunakan layanan otentikasi Supabase Auth yang memenuhi standar keamanan industri. Sesi login memiliki batas waktu otomatis untuk melindungi akunmu.",
      },
    ],
  },
  {
    id: "hak-pengguna",
    title: "Hak Kamu sebagai Pengguna",
    content: [
      {
        subtitle: "Akses Data",
        text: "Kamu bisa melihat semua data profil yang kami simpan melalui halaman Profil di dalam aplikasi.",
      },
      {
        subtitle: "Koreksi Data",
        text: "Kamu bisa memperbarui nama, foto profil, bio, dan informasi kontak kapan saja dari halaman Edit Profil.",
      },
      {
        subtitle: "Hapus Akun",
        text: "Kamu bisa meminta penghapusan akun dengan menghubungi kami melalui email. Data akan dihapus dalam 30 hari kerja, kecuali data yang diperlukan untuk kepentingan hukum.",
      },
    ],
  },
  {
    id: "pihak-ketiga",
    title: "Layanan Pihak Ketiga",
    content: [
      {
        subtitle: "Supabase",
        text: "Kami menggunakan Supabase untuk otentikasi dan database. Supabase beroperasi di infrastruktur yang memenuhi standar SOC 2.",
      },
      {
        subtitle: "Google Maps / Leaflet",
        text: "Fitur peta menggunakan layanan tile peta pihak ketiga. Penggunaan peta tunduk pada kebijakan privasi penyedia masing-masing.",
      },
      {
        subtitle: "Firebase",
        text: "Notifikasi push dikirimkan melalui Firebase Cloud Messaging (FCM) dari Google. Token FCM hanya digunakan untuk mengirim notifikasi dan tidak digunakan untuk profiling.",
      },
    ],
  },
];

export default function KebijakanPrivasiPage() {
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
            Kebijakan Privasi
          </h1>
          <p className="text-base text-on-surface-variant leading-relaxed max-w-prose">
            Kami membangun CEPAT di atas kepercayaan. Halaman ini menjelaskan
            secara jelas data apa yang kami kumpulkan, mengapa kami
            mengumpulkannya, dan bagaimana kami melindunginya.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id}>
              <h2 className="text-lg font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant">
                {section.title}
              </h2>
              <div className="space-y-5">
                {section.content.map((item, i) => (
                  <div key={i}>
                    <h3 className="text-sm font-semibold text-on-surface mb-1">
                      {item.subtitle}
                    </h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* Contact */}
          <section id="kontak">
            <h2 className="text-lg font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant">
              Pertanyaan tentang Privasi
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Jika kamu punya pertanyaan tentang kebijakan ini atau ingin
              mengajukan permintaan terkait data pribadimu, hubungi kami di{" "}
              <a
                href="mailto:privasi@cepat.id"
                className="text-primary hover:underline font-medium"
              >
                privasi@cepat.id
              </a>
              . Kami akan merespons dalam 5 hari kerja.
            </p>
          </section>
        </div>

        {/* Back link */}
        <div className="mt-14 pt-6 border-t border-card-border flex items-center gap-6 text-xs font-semibold">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
          <Link
            href="/syarat-ketentuan"
            className="text-on-surface-variant hover:text-primary transition-colors"
          >
            Syarat &amp; Ketentuan →
          </Link>
        </div>
      </main>
    </div>
  );
}
