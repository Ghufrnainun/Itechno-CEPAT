'use client';

import { useState, useEffect } from 'react';
import AdminTopbar from '@/components/admin/AdminTopbar';
import DataTable, { Column } from '@/components/admin/DataTable';
import AdminModal from '@/components/admin/AdminModal';
import AdminSelect, { SelectOption } from '@/components/admin/AdminSelect';
import { Button } from '@/components/ui/Button';
import {
  Plus,
  Edit2,
  Trash2,
  Tags,
  Sparkles,
  AlertCircle,
  Search,
} from 'lucide-react';
import { renderIcon } from '@/lib/icon-map';
import { CATEGORY_ICON_OPTIONS_RAW } from '@/lib/constants';
import { Skeleton } from '@/components/ui/Skeleton';

export interface APICategory {
  id: string;
  nama_kategori: string;
  icon: string | null;
  total_tasks: number;
}

export interface APISkill {
  id: string;
  nama_skill: string;
  icon: string | null;
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
      if (!res.ok) return;
      const json = await res.json().catch(() => ({}));
      if (json.success && Array.isArray(json.data)) {
        setSkills(
          json.data.map((skl: any) => ({
            id: skl.id_skill_master,
            nama_skill: skl.nama_skill,
            icon: skl.icon,
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
      if (!res.ok) return;
      const json = await res.json().catch(() => ({}));
      if (json.success && Array.isArray(json.data)) {
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
    if (typeof window !== 'undefined') {
      const searchFromUrl = new URLSearchParams(window.location.search).get('search');
      if (searchFromUrl) {
        setSearchQuery(searchFromUrl);
      }
    }
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
  const [skillIcon, setSkillIcon] = useState('Sparkles');

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'skill'; id: string; name: string } | null>(null);

  const iconOptions: SelectOption[] = CATEGORY_ICON_OPTIONS_RAW.map(opt => ({ ...opt, icon: renderIcon(opt.value, "w-3.5 h-3.5 text-primary") }));

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
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          setErrorMessage(data.message || 'Gagal mengubah kategori.');
          return;
        }
      } else {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nama_kategori: catName, icon: catIcon }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          setErrorMessage(data.message || 'Gagal menambah kategori.');
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
    setSkillIcon('Sparkles');
    setIsSkillModalOpen(true);
  };

  const handleOpenEditSkill = (skl: APISkill) => {
    setEditingSkill(skl);
    setSkillName(skl.nama_skill);
    setSkillIcon(skl.icon || 'Sparkles');
    setIsSkillModalOpen(true);
  };

  const handleSaveSkill = async () => {
    if (!skillName.trim()) return;

    try {
      if (editingSkill) {
        const res = await fetch(`/api/skills/${editingSkill.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nama_skill: skillName, icon: skillIcon }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          setErrorMessage(data.message || 'Gagal mengubah skill.');
          return;
        }
      } else {
        const res = await fetch('/api/skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nama_skill: skillName, icon: skillIcon }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          setErrorMessage(data.message || 'Gagal menambah skill.');
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
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          setErrorMessage(data.message || 'Gagal menghapus kategori.');
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
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          setErrorMessage(data.message || 'Gagal menghapus skill.');
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
        <div className="flex items-center gap-2.5 font-bold text-on-surface font-headline text-sm">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
            {renderIcon(cat.icon, "w-4 h-4 text-primary")}
          </div>
          <span>{cat.nama_kategori}</span>
        </div>
      ),
    },
    {
      header: 'Total Tasks',
      cell: (cat) => (
        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 tabular-nums">
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
            className="w-8 h-8 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            title="Edit Kategori"
            aria-label="Edit Kategori"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget({ type: 'category', id: cat.id, name: cat.nama_kategori });
            }}
            className="w-8 h-8 rounded-lg text-error hover:bg-error-container/40 flex items-center justify-center transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40"
            title="Hapus Kategori"
            aria-label="Hapus Kategori"
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
        <div className="flex items-center gap-2.5 font-bold text-on-surface font-headline text-sm">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
            {renderIcon(skl.icon, "w-4 h-4 text-primary")}
          </div>
          <span>{skl.nama_skill}</span>
        </div>
      ),
    },
    {
      header: 'Users Registered',
      cell: (skl) => (
        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-secondary-container/50 text-secondary border border-secondary/25 tabular-nums">
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
            className="w-8 h-8 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            title="Edit Skill"
            aria-label="Edit Skill"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget({ type: 'skill', id: skl.id, name: skl.nama_skill });
            }}
            className="w-8 h-8 rounded-lg text-error hover:bg-error-container/40 flex items-center justify-center transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40"
            title="Hapus Skill"
            aria-label="Hapus Skill"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 font-sans">
      <AdminTopbar title="Category &amp; Skills Governance" />

      <main className="flex-1 px-4 sm:px-8 py-8 lg:py-12 space-y-8 max-w-[1400px] w-full mx-auto">
        {/* Header Tabs & Add Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-card-border shadow-xs">
          {/* Tab buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-surface-container-low border border-card-border rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-white text-on-surface shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Tags className="w-3.5 h-3.5" />
              Task Categories ({categories.length})
            </button>

            <button
              onClick={() => setActiveTab('skills')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer ${
                activeTab === 'skills'
                  ? 'bg-white text-on-surface shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Master Skills ({skills.length})
            </button>
          </div>

          <div className="flex-1 max-w-sm w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Cari kategori atau skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-card-border rounded-xl text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
            />
          </div>

          {/* Add Button */}
          {activeTab === 'categories' ? (
            <Button
              size="sm"
              onClick={handleOpenAddCategory}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Tambah Kategori Task
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleOpenAddSkill}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Tambah Master Skill
            </Button>
          )}
        </div>

        {/* Data Tables / Loading Skeleton */}
        {activeTab === 'categories' ? (
          loading ? (
            <div className="bg-white border border-card-border rounded-2xl p-6 shadow-xs space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-2.5 border-b border-card-border/40 last:border-0">
                  <div className="flex items-center gap-3 w-1/3 min-w-[180px]">
                    <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                    <Skeleton className="h-4 w-3/4 rounded" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <div className="flex gap-2">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <Skeleton className="w-8 h-8 rounded-lg" />
                  </div>
                </div>
              ))}
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
            <div className="bg-white border border-card-border rounded-2xl p-6 shadow-xs space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-2.5 border-b border-card-border/40 last:border-0">
                  <div className="flex items-center gap-3 w-1/3 min-w-[180px]">
                    <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                    <Skeleton className="h-4 w-3/4 rounded" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <div className="flex gap-2">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <Skeleton className="w-8 h-8 rounded-lg" />
                  </div>
                </div>
              ))}
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
              options={iconOptions}
              value={catIcon}
              onChange={setCatIcon}
            />

            <div>
              <label className="block font-bold text-on-surface mb-1.5">
                Nama Kategori
              </label>
              <input
                type="text"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="misal: Fotografi & Videografi"
                className="w-full min-h-[42px] px-3.5 py-2.5 bg-surface-container-low border border-card-border rounded-xl text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all shadow-2xs"
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
            <AdminSelect
              label="Ikon Skill"
              options={iconOptions}
              value={skillIcon}
              onChange={setSkillIcon}
            />
            <div>
              <label className="block font-bold text-on-surface mb-1.5">
                Nama Skill
              </label>
              <input
                type="text"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                placeholder="misal: Adobe Photoshop / Illustrator"
                className="w-full min-h-[42px] px-3.5 py-2.5 bg-surface-container-low border border-card-border rounded-xl text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all shadow-2xs"
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
          <div className="flex items-start gap-3 p-3.5 bg-error-container/40 rounded-lg border border-error/25 text-xs text-error font-sans">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Apakah kamu yakin ingin menghapus "{deleteTarget?.name}"?</p>
              <p className="mt-1 text-[11px] opacity-90 leading-relaxed">
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
            <div className="w-14 h-14 rounded-full bg-error-container flex items-center justify-center mb-5 ring-4 ring-error/10">
              <AlertCircle className="w-7 h-7 text-error" />
            </div>
            <h4 className="font-bold text-on-surface text-base mb-2 font-headline">Tindakan Ditolak</h4>
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed max-w-sm">{errorMessage}</p>
            <Button
              variant="primary"
              fullWidth
              onClick={() => setErrorMessage(null)}
            >
              Saya Mengerti
            </Button>
          </div>
        </AdminModal>
      </main>
    </div>
  );
}
