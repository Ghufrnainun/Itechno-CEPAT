'use client';

import { useState, useEffect } from 'react';
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
  Search,
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

function renderCategoryIcon(iconName: string | null) {
  const IconComponent = (iconName && ICON_MAP[iconName]) || Folder;
  return <IconComponent className="w-4 h-4 text-[#0F766E]" />;
}

export interface APICategory {
  id: string; // mapped from id_category
  nama_kategori: string;
  icon: string | null;
  total_tasks: number;
}

export interface APISkill {
  id: string; // mapped from id_skill_master
  nama_skill: string;
  total_users: number;
}

export default function CategorySkillsManagementPage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'skills'>('categories');
  const [searchQuery, setSearchQuery] = useState('');

  // Datasets
  const [categories, setCategories] = useState<APICategory[]>([]);
  const [skills, setSkills] = useState<APISkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/skills', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setSkills(
          json.data.map((skl: any) => ({
            id: skl.id_skill_master,
            nama_skill: skl.nama_skill,
            total_users: skl._count?.skills_user || 0,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/categories', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setCategories(
          json.data.map((cat: any) => ({
            id: cat.id_category,
            nama_kategori: cat.nama_kategori,
            icon: cat.icon,
            total_tasks: cat._count?.tasks || 0,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchSkills();
  }, []);

  // Modal States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<APICategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('Folder');

  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<APISkill | null>(null);
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

  const handleOpenEditCategory = (cat: APICategory) => {
    setEditingCategory(cat);
    setCatName(cat.nama_kategori);
    setCatIcon(cat.icon || 'Folder');
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!catName.trim()) return;

    try {
      if (editingCategory) {
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nama_kategori: catName, icon: catIcon }),
        });
        const data = await res.json();
        if (!data.success) {
          setErrorMessage(data.message);
          return;
        }
      } else {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nama_kategori: catName, icon: catIcon }),
        });
        const data = await res.json();
        if (!data.success) {
          setErrorMessage(data.message);
          return;
        }
      }
      setIsCategoryModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      setErrorMessage('Terjadi kesalahan saat menyimpan kategori.');
    }
  };

  // Skill Handlers
  const handleOpenAddSkill = () => {
    setEditingSkill(null);
    setSkillName('');
    setIsSkillModalOpen(true);
  };

  const handleOpenEditSkill = (skl: APISkill) => {
    setEditingSkill(skl);
    setSkillName(skl.nama_skill);
    setIsSkillModalOpen(true);
  };

  const handleSaveSkill = async () => {
    if (!skillName.trim()) return;

    try {
      if (editingSkill) {
        const res = await fetch(`/api/skills/${editingSkill.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nama_skill: skillName }),
        });
        const data = await res.json();
        if (!data.success) {
          setErrorMessage(data.message);
          return;
        }
      } else {
        const res = await fetch('/api/skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nama_skill: skillName }),
        });
        const data = await res.json();
        if (!data.success) {
          setErrorMessage(data.message);
          return;
        }
      }
      setIsSkillModalOpen(false);
      fetchSkills();
    } catch (error) {
      console.error('Error saving skill:', error);
      setErrorMessage('Terjadi kesalahan saat menyimpan skill.');
    }
  };

  // Delete Handler
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'category') {
      try {
        const res = await fetch(`/api/categories/${deleteTarget.id}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (!data.success) {
          setErrorMessage(data.message);
        } else {
          fetchCategories();
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        setErrorMessage('Terjadi kesalahan saat menghapus kategori.');
      }
    } else {
      try {
        const res = await fetch(`/api/skills/${deleteTarget.id}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (!data.success) {
          setErrorMessage(data.message);
        } else {
          fetchSkills();
        }
      } catch (error) {
        console.error('Error deleting skill:', error);
        setErrorMessage('Terjadi kesalahan saat menghapus skill.');
      }
    }
    setDeleteTarget(null);
  };

  // Category Columns
  const categoryColumns: Column<APICategory>[] = [
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
  const skillColumns: Column<APISkill>[] = [
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

          <div className="flex-1 max-w-sm w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Cari kategori atau skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0C1F16] placeholder-[#94A3B8] outline-none focus:border-[#0F766E] focus:bg-white transition-all"
            />
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
          loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-4 border-[#0F766E] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <DataTable 
              columns={categoryColumns} 
              data={categories.filter(c => c.nama_kategori.toLowerCase().includes(searchQuery.toLowerCase()))} 
              pageSize={10} 
            />
          )
        ) : (
          loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-4 border-[#0F766E] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <DataTable 
              columns={skillColumns} 
              data={skills.filter(s => s.nama_skill.toLowerCase().includes(searchQuery.toLowerCase()))} 
              pageSize={10} 
            />
          )
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

        {/* Error Notification Modal */}
        <AdminModal
          isOpen={!!errorMessage}
          onClose={() => setErrorMessage(null)}
          title="Pemberitahuan"
        >
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mb-5 ring-4 ring-rose-50">
              <AlertCircle className="w-7 h-7 text-rose-600" />
            </div>
            <h4 className="font-bold text-[#0C1F16] text-base mb-2">Tindakan Ditolak</h4>
            <p className="text-sm text-[#64748B] mb-6 leading-relaxed max-w-sm">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage(null)}
              className="w-full py-2.5 bg-[#0C1F16] hover:bg-[#1E293B] text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              Saya Mengerti
            </button>
          </div>
        </AdminModal>
      </main>
    </div>
  );
}
