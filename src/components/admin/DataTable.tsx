'use client';

import { ReactNode, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  pageSize?: number;
  emptyMessage?: string;
}

export default function DataTable<T extends { id: string | number }>({
  columns,
  data,
  onRowClick,
  pageSize = 5,
  emptyMessage = 'Tidak ada data ditemukan',
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const currentData = data.slice(startIndex, startIndex + pageSize);

  return (
    <div className="bg-white border border-card-border rounded-2xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left font-sans text-xs">
          <thead className="bg-surface-container-low border-b border-card-border font-mono text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={cn("px-5 py-3.5", col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-card-border">
            {currentData.length > 0 ? (
              currentData.map((item) => (
                <tr
                  key={item.id}
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? "button" : undefined}
                  onClick={() => onRowClick && onRowClick(item)}
                  onKeyDown={(e) => {
                    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onRowClick(item);
                    }
                  }}
                  className={cn(
                    "transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-none focus-visible:bg-surface-container-low",
                    onRowClick
                      ? "cursor-pointer hover:bg-black/5 active:scale-[0.99]"
                      : "hover:bg-black/[0.02]"
                  )}
                >
                  {columns.map((col, idx) => (
                    <td key={idx} className={cn("px-5 py-4 text-on-surface", col.className)}>
                      {col.cell
                        ? col.cell(item)
                        : col.accessorKey
                        ? String(item[col.accessorKey] ?? '')
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-12 text-center text-on-surface-variant text-xs font-sans"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-surface-container-low border-t border-card-border font-sans text-xs text-on-surface-variant">
        <div>
          Menampilkan <span className="font-bold text-on-surface tabular-nums font-mono">{data.length > 0 ? startIndex + 1 : 0}</span> sampai{' '}
          <span className="font-bold text-on-surface tabular-nums font-mono">
            {Math.min(startIndex + pageSize, data.length)}
          </span>{' '}
          dari <span className="font-bold text-on-surface tabular-nums font-mono">{data.length}</span> data
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="w-9 h-9 rounded-lg border border-card-border text-on-surface-variant hover:text-on-surface hover:bg-black/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.95] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer"
            title="Halaman Sebelumnya"
            aria-label="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-2 font-semibold tabular-nums">
            Halaman {currentPage} dari {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="w-9 h-9 rounded-lg border border-card-border text-on-surface-variant hover:text-on-surface hover:bg-black/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.95] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer"
            title="Halaman Selanjutnya"
            aria-label="Halaman Selanjutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
