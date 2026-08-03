export interface SkillItem {
  value: string;
  label: string;
  icon: string;
  emoji?: string;
}

export const SKILL_CATEGORIES: SkillItem[] = [
  { value: "fotografi", label: "Fotografi & Videografi", icon: "photo_camera", emoji: "📸" },
  { value: "data_entry", label: "Data Entry & Administrasi", icon: "computer", emoji: "💻" },
  { value: "desain_grafis", label: "Desain Grafis", icon: "palette", emoji: "🎨" },
  { value: "penulisan", label: "Penulisan & Konten", icon: "edit_note", emoji: "✍️" },
  { value: "jaga_booth", label: "Jaga Booth / Event Helper", icon: "inventory_2", emoji: "📦" },
  { value: "kurir", label: "Kurir / Antar Barang", icon: "local_shipping", emoji: "🚚" },
  { value: "teknis", label: "IT Support / Teknis (IT, setup device)", icon: "build", emoji: "🔧" },
  { value: "social_media", label: "Social Media Management", icon: "smartphone", emoji: "📱" },
  { value: "riset_survei", label: "Riset & Survei", icon: "analytics", emoji: "📊" },
  { value: "tutoring", label: "Tutoring / Les Privat", icon: "school", emoji: "🎓" },
  { value: "kebersihan", label: "Kebersihan & Penataan", icon: "cleaning_services", emoji: "🧹" },
  { value: "belanja", label: "Belanja / Titip Beli", icon: "shopping_cart", emoji: "🛒" },
];
