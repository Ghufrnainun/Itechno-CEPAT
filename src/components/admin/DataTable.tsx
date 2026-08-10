'use client';

import { ReactNode, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left font-sans text-xs">
          <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] font-mono text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-5 py-3.5 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E2E8F0]">
            {currentData.length > 0 ? (
              currentData.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`transition-colors ${
                    onRowClick
                      ? 'cursor-pointer hover:bg-[#F1F5F9]'
                      : 'hover:bg-[#F8FAFC]'
                  }`}
                >
                  {columns.map((col, idx) => (
                    <td key={idx} className={`px-5 py-4 ${col.className || ''}`}>
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
                  className="px-5 py-12 text-center text-[#64748B] text-xs font-sans"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] font-sans text-xs text-[#64748B]">
        <div>
          Menampilkan <span className="font-bold text-[#0C1F16]">{data.length > 0 ? startIndex + 1 : 0}</span> sampai{' '}
          <span className="font-bold text-[#0C1F16]">
            {Math.min(startIndex + pageSize, data.length)}
          </span>{' '}
          dari <span className="font-bold text-[#0C1F16]">{data.length}</span> data
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-md border border-[#E2E8F0] text-[#64748B] hover:text-[#0C1F16] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-2 font-semibold">
            Halaman {currentPage} dari {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-md border border-[#E2E8F0] text-[#64748B] hover:text-[#0C1F16] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
            title="Halaman Selanjutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
