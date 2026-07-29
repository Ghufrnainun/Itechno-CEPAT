export interface SkillItem {
  value: string;
  label: string;
  emoji: string;
}

export const SKILL_CATEGORIES: SkillItem[] = [
  { value: "fotografi", label: "Fotografi & Videografi", emoji: "📸" },
  { value: "data_entry", label: "Data Entry & Administrasi", emoji: "💻" },
  { value: "desain_grafis", label: "Desain Grafis", emoji: "🎨" },
  { value: "penulisan", label: "Penulisan & Konten", emoji: "✍️" },
  { value: "jaga_booth", label: "Jaga Booth / Event Helper", emoji: "📦" },
  { value: "kurir", label: "Kurir / Antar Barang", emoji: "🚚" },
  { value: "teknis", label: "IT Support / Teknis (IT, setup device)", emoji: "🔧" },
  { value: "social_media", label: "Social Media Management", emoji: "📱" },
  { value: "riset_survei", label: "Riset & Survei", emoji: "📊" },
  { value: "tutoring", label: "Tutoring / Les Privat", emoji: "🎓" },
  { value: "kebersihan", label: "Kebersihan & Penataan", emoji: "🧹" },
  { value: "belanja", label: "Belanja / Titip Beli", emoji: "🛒" },
];
