import { memo } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import type { Category } from '../../../lib/types';
import { AdminPanel, adminIconButtonClass } from '../AdminUI';

interface AdminCategoriesListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onRemove: (category: Category) => void;
}

export const AdminCategoriesList = memo(function AdminCategoriesList({ categories, onEdit, onRemove }: AdminCategoriesListProps) {
  return (
    <AdminPanel>
      <div className="overflow-x-auto">
        <div className="grid min-w-[680px] grid-cols-[80px_1fr_1fr_120px_100px] px-4 py-3 bg-[#111216] font-bold text-zinc-300 text-sm">
          <span>ID</span><span>Name</span><span>Slug</span><span>Status</span><span>Actions</span>
        </div>
        {categories.map((category) => (
          <div key={category.id} className="grid min-w-[680px] grid-cols-[80px_1fr_1fr_120px_100px] px-4 py-3 border-t border-zinc-800 text-sm text-zinc-200">
            <span>{category.id}</span>
            <span className="text-white">{category.name}</span>
            <span>{category.slug}</span>
            <span>{category.status}</span>
            <span className="flex gap-3">
              <button onClick={() => onEdit(category)} className={adminIconButtonClass}><Edit className="h-4 w-4" /></button>
              <button onClick={() => onRemove(category)} className={adminIconButtonClass}><Trash2 className="h-4 w-4" /></button>
            </span>
          </div>
        ))}
      </div>
    </AdminPanel>
  );
});
