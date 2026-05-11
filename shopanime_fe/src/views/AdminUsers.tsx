import { FormEvent, useEffect, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { apiDelete, apiGet, apiPost, apiPut } from "../lib/api";
import type { ApiResponse, User } from "../lib/types";
import { AdminPage, AdminPanel, adminFormClass, adminIconButtonClass, adminInputClass, adminPrimaryButtonClass } from "../components/admin/AdminUI";

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
  username: "",
  email: "",
  password: "password123",
  full_name: "",
  phone: "",
  role: "CUSTOMER",
  status: "ACTIVE",
};

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);

  const loadUsers = async () => {
    const response = await apiGet<ApiResponse<User[]>>("/users");
    setUsers(response.data);
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const updateField = (name: keyof UserForm, value: string) => setForm((current) => ({ ...current, [name]: value }));

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
      setMessage("User updated");
    } else {
      await apiPost("/users", payload);
      setMessage("User created");
    }
    setForm(emptyForm);
    await loadUsers();
  };

  const edit = (user: User) => setForm({
    id: user.id,
    username: user.username,
    email: user.email,
    password: "",
    full_name: user.full_name || "",
    phone: user.phone || "",
    role: user.role,
    status: user.status,
  });

  const remove = async (user: User) => {
    if (!window.confirm(`Delete ${user.email}?`)) return;
    await apiDelete(`/users/${user.id}`);
    setMessage("User deleted");
    await loadUsers();
  };

  return (
    <AdminPage title="Users" description="Create, update and remove user accounts." message={message}>

      <form onSubmit={submit} className={`${adminFormClass} md:grid-cols-7`}>
        <input required value={form.username} onChange={(event) => updateField("username", event.target.value)} placeholder="Username" disabled={Boolean(form.id)} className={adminInputClass} />
        <input required value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="Email" disabled={Boolean(form.id)} className={adminInputClass} />
        {!form.id && <input required value={form.password} onChange={(event) => updateField("password", event.target.value)} placeholder="Password" className={adminInputClass} />}
        <input value={form.full_name} onChange={(event) => updateField("full_name", event.target.value)} placeholder="Full name" className={adminInputClass} />
        <input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="Phone" className={adminInputClass} />
        <select value={form.role} onChange={(event) => updateField("role", event.target.value)} className={adminInputClass}>
          <option value="CUSTOMER">CUSTOMER</option>
          <option value="ADMIN">ADMIN</option>
          <option value="MANAGER">MANAGER</option>
        </select>
        <select value={form.status} onChange={(event) => updateField("status", event.target.value)} className={adminInputClass}>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="LOCKED">LOCKED</option>
        </select>
        <button className={adminPrimaryButtonClass}>{form.id ? "Update" : "Create"}</button>
      </form>

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
            <span>{user.full_name || "N/A"}</span>
            <span>{user.role}</span>
            <span>{user.status}</span>
            <span className="flex gap-3">
              <button onClick={() => edit(user)} className={adminIconButtonClass}><Edit className="h-4 w-4" /></button>
              <button onClick={() => void remove(user)} className={adminIconButtonClass}><Trash2 className="h-4 w-4" /></button>
            </span>
          </div>
        ))}
        </div>
      </AdminPanel>
    </AdminPage>
  );
}
