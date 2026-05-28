import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { apiDelete, apiGet, apiPost, apiPut } from '../lib/api';
import type { ApiResponse, User } from '../lib/types';
import { AdminEmptyState, AdminPage, AdminPaginationBar, AdminToolbar, adminFormClass, adminInputClass, adminPrimaryButtonClass, adminSecondaryButtonClass } from '../components/admin/AdminUI';
import { AdminUsersList } from '../components/admin/users/AdminUsersList';

interface UserForm {
  id?: number;
  username: string;
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: string;
  status: string;
}

const emptyForm: UserForm = {
  username: '',
  email: '',
  password: 'password123',
  full_name: '',
  phone: '',
  role: 'CUSTOMER',
  status: 'ACTIVE',
};

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const loadUsers = useCallback(async () => {
    const response = await apiGet<ApiResponse<User[]>>('/users');
    setUsers(response.data);
  }, []);

  useEffect(() => {
    void loadUsers();
  }, []);

  const updateField = useCallback((name: keyof UserForm, value: string) => setForm((current) => ({ ...current, [name]: value })), []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      username: form.username,
      email: form.email,
      full_name: form.full_name,
      phone: form.phone || null,
      role: form.role,
      status: form.status,
      ...(form.id && !form.password.trim() ? {} : { password: form.password }),
    };
    if (form.id) {
      await apiPut(`/users/${form.id}`, payload);
      setMessage('User updated');
    } else {
      await apiPost('/users', payload);
      setMessage('User created');
    }
    setForm(emptyForm);
    await loadUsers();
  };

  const edit = useCallback((user: User) => setForm({
    id: user.id,
    username: user.username,
    email: user.email,
    password: '',
    full_name: user.full_name || '',
    phone: user.phone || '',
    role: user.role,
    status: user.status,
  }), []);

  const remove = useCallback(async (user: User) => {
    if (!window.confirm(`Delete ${user.email}?`)) {return;}
    await apiDelete(`/users/${user.id}`);
    setMessage('User deleted');
    await loadUsers();
  }, [loadUsers]);

  const handleRemove = useCallback((user: User) => {
    void remove(user);
  }, [remove]);

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return users
      .filter((user) => {
        const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
        const matchesKeyword = !keyword || [user.username, user.email, user.full_name, user.phone, user.role, user.status]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
        return matchesRole && matchesStatus && matchesKeyword;
      })
      .sort((left, right) => {
        if (sort === 'username') {return left.username.localeCompare(right.username);}
        if (sort === 'role') {return left.role.localeCompare(right.role) || left.username.localeCompare(right.username);}
        if (sort === 'status') {return left.status.localeCompare(right.status) || left.username.localeCompare(right.username);}
        return right.id - left.id;
      });
  }, [query, roleFilter, sort, statusFilter, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / limit));
  const currentPage = Math.min(page, totalPages);
  const visibleUsers = filteredUsers.slice((currentPage - 1) * limit, currentPage * limit);
  const resetFilters = () => {
    setQuery('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setSort('newest');
    setPage(1);
  };

  return (
    <AdminPage title="Users" description="Create, update and remove user accounts." message={message}>

      <form onSubmit={submit} className={`${adminFormClass} md:grid-cols-7`}>
        <input required value={form.username} onChange={(event) => updateField('username', event.target.value)} placeholder="Username" className={adminInputClass} />
        <input required value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="Email" className={adminInputClass} />
        <div className="md:col-span-1">
          <input
            required={!form.id}
            type="password"
            value={form.password}
            onChange={(event) => updateField('password', event.target.value)}
            placeholder={form.id ? 'New password' : 'Password'}
            autoComplete="new-password"
            className={adminInputClass}
          />
          <p className="mt-2 text-[11px] font-semibold text-zinc-500">
            Stored as Base64-wrapped scrypt hash.
          </p>
        </div>
        <input value={form.full_name} onChange={(event) => updateField('full_name', event.target.value)} placeholder="Full name" className={adminInputClass} />
        <input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="Phone" className={adminInputClass} />
        <select value={form.role} onChange={(event) => updateField('role', event.target.value)} className={adminInputClass}>
          <option value="CUSTOMER">CUSTOMER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <select value={form.status} onChange={(event) => updateField('status', event.target.value)} className={adminInputClass}>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="LOCKED">LOCKED</option>
        </select>
        <button className={adminPrimaryButtonClass}>{form.id ? 'Update' : 'Create'}</button>
      </form>

      <AdminToolbar>
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search username, email, phone" className={`${adminInputClass} w-full pl-9`} />
        </div>
        <select value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value); setPage(1); }} className={adminInputClass}>
          <option value="ALL">All roles</option>
          <option value="ADMIN">ADMIN</option>
          <option value="CUSTOMER">CUSTOMER</option>
        </select>
        <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className={adminInputClass}>
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="LOCKED">LOCKED</option>
        </select>
        <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} className={adminInputClass}>
          <option value="newest">Newest</option>
          <option value="username">Username A-Z</option>
          <option value="role">Role</option>
          <option value="status">Status</option>
        </select>
        <select value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }} className={adminInputClass}>
          <option value={10}>10 rows</option>
          <option value={20}>20 rows</option>
          <option value={50}>50 rows</option>
        </select>
        <button type="button" onClick={resetFilters} className={adminSecondaryButtonClass}><X className="h-4 w-4" /> Reset</button>
      </AdminToolbar>

      {visibleUsers.length > 0 ? <AdminUsersList users={visibleUsers} onEdit={edit} onRemove={handleRemove} /> : <AdminEmptyState message="No users match the current filters." />}
      <AdminPaginationBar meta={{ page: currentPage, limit, total: filteredUsers.length }} onPageChange={setPage} />
    </AdminPage>
  );
}
