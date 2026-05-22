import type { FormEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPost, apiPut } from '../lib/api';
import type { ApiResponse, User } from '../lib/types';
import { AdminPage, adminFormClass, adminInputClass, adminPrimaryButtonClass } from '../components/admin/AdminUI';
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
      password: form.password,
      full_name: form.full_name,
      phone: form.phone || null,
      role: form.role,
      status: form.status,
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

  return (
    <AdminPage title="Users" description="Create, update and remove user accounts." message={message}>

      <form onSubmit={submit} className={`${adminFormClass} md:grid-cols-7`}>
        <input required value={form.username} onChange={(event) => updateField('username', event.target.value)} placeholder="Username" disabled={Boolean(form.id)} className={adminInputClass} />
        <input required value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="Email" disabled={Boolean(form.id)} className={adminInputClass} />
        {!form.id && (
          <div className="md:col-span-1">
            <input
              required
              type="password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              placeholder="Password"
              autoComplete="new-password"
              className={adminInputClass}
            />
            <p className="mt-2 text-[11px] font-semibold text-zinc-500">
              Stored as Base64-wrapped scrypt hash.
            </p>
          </div>
        )}
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

      <AdminUsersList users={users} onEdit={edit} onRemove={handleRemove} />
    </AdminPage>
  );
}
