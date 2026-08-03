export interface SkillItem {
  value: string;
  label: string;
  icon: string;
}

export const SKILL_CATEGORIES: SkillItem[] = [
  { value: "fotografi", label: "Fotografi & Videografi", icon: "photo_camera" },
  { value: "data_entry", label: "Data Entry & Administrasi", icon: "computer" },
  { value: "desain_grafis", label: "Desain Grafis", icon: "palette" },
  { value: "penulisan", label: "Penulisan & Konten", icon: "edit_note" },
  { value: "jaga_booth", label: "Jaga Booth / Event Helper", icon: "inventory_2" },
  { value: "kurir", label: "Kurir / Antar Barang", icon: "local_shipping" },
  { value: "teknis", label: "IT Support / Teknis (IT, setup device)", icon: "build" },
  { value: "social_media", label: "Social Media Management", icon: "smartphone" },
  { value: "riset_survei", label: "Riset & Survei", icon: "analytics" },
  { value: "tutoring", label: "Tutoring / Les Privat", icon: "school" },
  { value: "kebersihan", label: "Kebersihan & Penataan", icon: "cleaning_services" },
  { value: "belanja", label: "Belanja / Titip Beli", icon: "shopping_cart" },
];
