'use client';

import { useState } from 'react';
import AdminTopbar from '@/components/admin/AdminTopbar';
import DataTable, { Column } from '@/components/admin/DataTable';
import AdminModal from '@/components/admin/AdminModal';
import AdminSelect, { SelectOption } from '@/components/admin/AdminSelect';
import {
  MOCK_ADMIN_CATEGORIES,
  MOCK_ADMIN_SKILLS,
  AdminCategory,
  AdminSkill,
} from '@/lib/admin/mock-data';
import {
  Plus,
  Edit2,
  Trash2,
  Tags,
  Sparkles,
  AlertCircle,
  Camera,
  Laptop,
  Palette,
  FileText,
  Box,
  Truck,
  Wrench,
  Smartphone,
  GraduationCap,
  Folder,
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  Camera,
  Laptop,
  Palette,
  FileText,
  Box,
  Truck,
  Wrench,
  Smartphone,
  GraduationCap,
};

function renderCategoryIcon(iconName: string) {
  const IconComponent = ICON_MAP[iconName] || Folder;
  return <IconComponent className="w-4 h-4 text-[#0F766E]" />;
}

export default function CategorySkillsManagementPage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'skills'>('categories');

  // Datasets
  const [categories, setCategories] = useState<AdminCategory[]>(MOCK_ADMIN_CATEGORIES);
  const [skills, setSkills] = useState<AdminSkill[]>(MOCK_ADMIN_SKILLS);

  // Modal States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('Folder');

  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<AdminSkill | null>(null);
  const [skillName, setSkillName] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'skill'; id: string; name: string } | null>(null);

  const categoryIconOptions: SelectOption[] = [
    { value: 'Camera', label: 'Camera (Fotografi)', icon: <Camera className="w-3.5 h-3.5 text-[#0F766E]" /> },
    { value: 'Laptop', label: 'Laptop (Data Entry)', icon: <Laptop className="w-3.5 h-3.5 text-[#0F766E]" /> },
    { value: 'Palette', label: 'Palette (Desain)', icon: <Palette className="w-3.5 h-3.5 text-[#0F766E]" /> },
    { value: 'FileText', label: 'FileText (Penulisan)', icon: <FileText className="w-3.5 h-3.5 text-[#0F766E]" /> },
    { value: 'Box', label: 'Box (Jaga Booth)', icon: <Box className="w-3.5 h-3.5 text-[#0F766E]" /> },
    { value: 'Truck', label: 'Truck (Kurir)', icon: <Truck className="w-3.5 h-3.5 text-[#0F766E]" /> },
    { value: 'Wrench', label: 'Wrench (Teknis IT)', icon: <Wrench className="w-3.5 h-3.5 text-[#0F766E]" /> },
    { value: 'Smartphone', label: 'Smartphone (Social Media)', icon: <Smartphone className="w-3.5 h-3.5 text-[#0F766E]" /> },
    { value: 'GraduationCap', label: 'GraduationCap (Tutoring)', icon: <GraduationCap className="w-3.5 h-3.5 text-[#0F766E]" /> },
    { value: 'Folder', label: 'Folder (Umum)', icon: <Folder className="w-3.5 h-3.5 text-[#0F766E]" /> },
  ];

  // Category Handlers
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatIcon('Folder');
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: AdminCategory) => {
    setEditingCategory(cat);
    setCatName(cat.nama_kategori);
    setCatIcon(cat.icon || 'Folder');
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = () => {
    if (!catName.trim()) return;

    if (editingCategory) {
      setCategories(categories.map((c) => (c.id === editingCategory.id ? { ...c, nama_kategori: catName, icon: catIcon } : c)));
    } else {
      const newCat: AdminCategory = {
        id: `cat-${Date.now()}`,
        nama_kategori: catName,
        icon: catIcon || 'Folder',
        total_tasks: 0,
        created_at: new Date().toISOString().split('T')[0],
      };
      setCategories([newCat, ...categories]);
    }
    setIsCategoryModalOpen(false);
  };

  // Skill Handlers
  const handleOpenAddSkill = () => {
    setEditingSkill(null);
    setSkillName('');
    setIsSkillModalOpen(true);
  };

  const handleOpenEditSkill = (skl: AdminSkill) => {
    setEditingSkill(skl);
    setSkillName(skl.nama_skill);
    setIsSkillModalOpen(true);
  };

  const handleSaveSkill = () => {
    if (!skillName.trim()) return;

    if (editingSkill) {
      setSkills(skills.map((s) => (s.id === editingSkill.id ? { ...s, nama_skill: skillName } : s)));
    } else {
      const newSkill: AdminSkill = {
        id: `skl-${Date.now()}`,
        nama_skill: skillName,
        total_users: 0,
        created_at: new Date().toISOString().split('T')[0],
      };
      setSkills([newSkill, ...skills]);
    }
    setIsSkillModalOpen(false);
  };

  // Delete Handler
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'category') {
      setCategories(categories.filter((c) => c.id !== deleteTarget.id));
    } else {
      setSkills(skills.filter((s) => s.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  };

  // Category Columns
  const categoryColumns: Column<AdminCategory>[] = [
    {
      header: 'Category Icon & Name',
      cell: (cat) => (
        <div className="flex items-center gap-2.5 font-bold text-[#0C1F16] font-sans">
          <div className="p-1.5 rounded-lg bg-[#E6F4F1] border border-[#0F766E]/20">
            {renderCategoryIcon(cat.icon)}
          </div>
          <span>{cat.nama_kategori}</span>
        </div>
      ),
    },
    {
      header: 'Total Tasks',
      cell: (cat) => (
        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-[#E6F4F1] text-[#0F766E] border border-[#0F766E]/20">
          {cat.total_tasks} Tasks
        </span>
      ),
    },
    {
      header: 'Created Date',
      accessorKey: 'created_at',
      cell: (cat) => <span className="font-mono text-xs text-[#64748B]">{cat.created_at}</span>,
    },
    {
      header: 'Actions',
      cell: (cat) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEditCategory(cat);
            }}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0C1F16] hover:bg-[#F1F5F9] transition-colors"
            title="Edit Kategori"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget({ type: 'category', id: cat.id, name: cat.nama_kategori });
            }}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
            title="Hapus Kategori"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // Skill Columns
  const skillColumns: Column<AdminSkill>[] = [
    {
      header: 'Skill Name',
      cell: (skl) => (
        <div className="flex items-center gap-2 font-bold text-[#0C1F16] font-sans">
          <Sparkles className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
          <span>{skl.nama_skill}</span>
        </div>
      ),
    },
    {
      header: 'Users Registered',
      cell: (skl) => (
        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
          {skl.total_users} Users
        </span>
      ),
    },
    {
      header: 'Created Date',
      accessorKey: 'created_at',
      cell: (skl) => <span className="font-mono text-xs text-[#64748B]">{skl.created_at}</span>,
    },
    {
      header: 'Actions',
      cell: (skl) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEditSkill(skl);
            }}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0C1F16] hover:bg-[#F1F5F9] transition-colors"
            title="Edit Skill"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget({ type: 'skill', id: skl.id, name: skl.nama_skill });
            }}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
            title="Hapus Skill"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 font-sans">
      <AdminTopbar title="Category & Skills Governance" />

      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Header Tabs & Add Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs">
          {/* Tab buttons */}
          <div className="flex items-center gap-1 p-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                activeTab === 'categories'
                  ? 'bg-white text-[#0C1F16] shadow-2xs'
                  : 'text-[#64748B] hover:text-[#0C1F16]'
              }`}
            >
              <Tags className="w-3.5 h-3.5" />
              Task Categories ({categories.length})
            </button>

            <button
              onClick={() => setActiveTab('skills')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                activeTab === 'skills'
                  ? 'bg-white text-[#0C1F16] shadow-2xs'
                  : 'text-[#64748B] hover:text-[#0C1F16]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Master Skills ({skills.length})
            </button>
          </div>

          {/* Add Button */}
          {activeTab === 'categories' ? (
            <button
              onClick={handleOpenAddCategory}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0F766E] hover:bg-[#005C55] text-white text-xs font-bold rounded-lg transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Kategori Task
            </button>
          ) : (
            <button
              onClick={handleOpenAddSkill}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0F766E] hover:bg-[#005C55] text-white text-xs font-bold rounded-lg transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Master Skill
            </button>
          )}
        </div>

        {/* Data Tables */}
        {activeTab === 'categories' ? (
          <DataTable columns={categoryColumns} data={categories} pageSize={10} />
        ) : (
          <DataTable columns={skillColumns} data={skills} pageSize={10} />
        )}

        {/* Category Add/Edit Modal */}
        <AdminModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          title={editingCategory ? 'Edit Kategori Task' : 'Tambah Kategori Task Baru'}
          onConfirm={handleSaveCategory}
          confirmLabel={editingCategory ? 'Update Kategori' : 'Buat Kategori'}
        >
          <div className="space-y-4 text-xs font-sans">
            <AdminSelect
              label="Ikon Kategori"
              options={categoryIconOptions}
              value={catIcon}
              onChange={setCatIcon}
            />

            <div>
              <label className="block font-bold text-[#0C1F16] mb-1">
                Nama Kategori
              </label>
              <input
                type="text"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="misal: Fotografi & Videografi"
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0C1F16] placeholder-[#94A3B8] outline-none focus:border-[#0F766E] focus:bg-white"
              />
            </div>
          </div>
        </AdminModal>

        {/* Skill Add/Edit Modal */}
        <AdminModal
          isOpen={isSkillModalOpen}
          onClose={() => setIsSkillModalOpen(false)}
          title={editingSkill ? 'Edit Master Skill' : 'Tambah Master Skill Baru'}
          onConfirm={handleSaveSkill}
          confirmLabel={editingSkill ? 'Update Skill' : 'Buat Skill'}
        >
          <div className="space-y-4 text-xs font-sans">
            <div>
              <label className="block font-bold text-[#0C1F16] mb-1">
                Nama Skill
              </label>
              <input
                type="text"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                placeholder="misal: Adobe Photoshop / Illustrator"
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0C1F16] placeholder-[#94A3B8] outline-none focus:border-[#0F766E] focus:bg-white"
              />
            </div>
          </div>
        </AdminModal>

        {/* Delete Confirmation Modal */}
        <AdminModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title={`Hapus ${deleteTarget?.type === 'category' ? 'Kategori' : 'Skill'}`}
          onConfirm={handleConfirmDelete}
          confirmLabel="Ya, Hapus Permanen"
          confirmVariant="danger"
        >
          <div className="flex items-start gap-3 p-3 bg-rose-50 rounded-lg border border-rose-200 text-xs text-rose-800 font-sans">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-bold">Apakah kamu yakin ingin menghapus "{deleteTarget?.name}"?</p>
              <p className="mt-1 text-[11px] opacity-90">
                Tindakan ini tidak dapat dibatalkan. Seluruh data task atau profil user yang menggunakan item ini akan kehilangan referensi tag terkait.
              </p>
            </div>
          </div>
        </AdminModal>
      </main>
    </div>
  );
}
