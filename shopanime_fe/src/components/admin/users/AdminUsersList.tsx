import { memo } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import type { User } from '../../../lib/types';
import { AdminPanel, adminIconButtonClass } from '../AdminUI';

interface AdminUsersListProps {
  users: User[];
  onEdit: (user: User) => void;
  onRemove: (user: User) => void;
}

export const AdminUsersList = memo(function AdminUsersList({ users, onEdit, onRemove }: AdminUsersListProps) {
  return (
    <AdminPanel>
      <div className="overflow-x-auto">
        <div className="grid min-w-[860px] grid-cols-[70px_1fr_1fr_1fr_120px_120px_100px] px-4 py-3 bg-[#111216] font-bold text-zinc-300 text-sm">
          <span>ID</span><span>Username</span><span>Email</span><span>Name</span><span>Role</span><span>Status</span><span>Actions</span>
        </div>
        {users.map((user) => (
          <div key={user.id} className="grid min-w-[860px] grid-cols-[70px_1fr_1fr_1fr_120px_120px_100px] px-4 py-3 border-t border-zinc-800 text-sm text-zinc-200">
            <span>{user.id}</span>
            <span className="text-white">{user.username}</span>
            <span>{user.email}</span>
            <span>{user.full_name || 'N/A'}</span>
            <span>{user.role}</span>
            <span>{user.status}</span>
            <span className="flex gap-3">
              <button onClick={() => onEdit(user)} className={adminIconButtonClass}><Edit className="h-4 w-4" /></button>
              <button onClick={() => onRemove(user)} className={adminIconButtonClass}><Trash2 className="h-4 w-4" /></button>
            </span>
          </div>
        ))}
      </div>
    </AdminPanel>
  );
});
