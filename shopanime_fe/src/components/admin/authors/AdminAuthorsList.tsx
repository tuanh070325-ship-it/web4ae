import { memo } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import type { Author } from '../../../lib/types';
import { AdminPanel, adminIconButtonClass } from '../AdminUI';

interface AdminAuthorsListProps {
  authors: Author[];
  onEdit: (author: Author) => void;
  onRemove: (author: Author) => void;
}

export const AdminAuthorsList = memo(function AdminAuthorsList({ authors, onEdit, onRemove }: AdminAuthorsListProps) {
  return (
    <AdminPanel>
      <div className="overflow-x-auto">
        <div className="grid min-w-[760px] grid-cols-[80px_1fr_1fr_1fr_100px] px-4 py-3 bg-[#111216] font-bold text-zinc-300 text-sm">
          <span>ID</span><span>Name</span><span>Slug</span><span>Country</span><span>Actions</span>
        </div>
        {authors.map((author) => (
          <div key={author.id} className="grid min-w-[760px] grid-cols-[80px_1fr_1fr_1fr_100px] px-4 py-3 border-t border-zinc-800 text-sm text-zinc-200">
            <span>{author.id}</span>
            <span className="text-white">{author.name}</span>
            <span>{author.slug}</span>
            <span>{author.country || 'N/A'}</span>
            <span className="flex gap-3">
              <button onClick={() => onEdit(author)} className={adminIconButtonClass}><Edit className="h-4 w-4" /></button>
              <button onClick={() => onRemove(author)} className={adminIconButtonClass}><Trash2 className="h-4 w-4" /></button>
            </span>
          </div>
        ))}
      </div>
    </AdminPanel>
  );
});
