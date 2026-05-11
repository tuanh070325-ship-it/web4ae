import { FormEvent, useEffect, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { apiDelete, apiGet, apiPost, apiPut } from "../lib/api";
import type { ApiResponse, Category } from "../lib/types";
import { AdminPage, AdminPanel, adminFormClass, adminIconButtonClass, adminInputClass, adminPrimaryButtonClass, adminTextareaClass } from "../components/admin/AdminUI";

interface CategoryForm {
  id?: number;
  name: string;
  slug: string;
  parent_id: string;
  description: string;
  status: string;
}

const emptyForm: CategoryForm = { name: "", slug: "", parent_id: "", description: "", status: "ACTIVE" };

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);

  const loadCategories = async () => {
    const response = await apiGet<ApiResponse<Category[]>>("/categories");
    setCategories(response.data);
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  const updateField = (name: keyof CategoryForm, value: string) => setForm((current) => ({ ...current, [name]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replaceAll(" ", "-"),
      parent_id: form.parent_id ? Number(form.parent_id) : null,
      description: form.description || null,
      status: form.status,
    };
    if (form.id) {
      await apiPut(`/categories/${form.id}`, payload);
      setMessage("Category updated");
    } else {
      await apiPost("/categories", payload);
      setMessage("Category created");
    }
    setForm(emptyForm);
    await loadCategories();
  };

  const edit = (category: Category) => setForm({
    id: category.id,
    name: category.name,
    slug: category.slug,
    parent_id: category.parent_id ? String(category.parent_id) : "",
    description: category.description || "",
    status: category.status || "ACTIVE",
  });

  const remove = async (category: Category) => {
    if (!window.confirm(`Delete ${category.name}?`)) return;
    await apiDelete(`/categories/${category.id}`);
    setMessage("Category deleted");
    await loadCategories();
  };

  return (
    <AdminPage title="Categories" description="Manage product categories and catalog grouping." message={message}>

      <form onSubmit={submit} className={`${adminFormClass} md:grid-cols-5`}>
        <input required value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Name" className={adminInputClass} />
        <input value={form.slug} onChange={(event) => updateField("slug", event.target.value)} placeholder="Slug" className={adminInputClass} />
        <input value={form.parent_id} onChange={(event) => updateField("parent_id", event.target.value)} placeholder="Parent ID" className={adminInputClass} />
        <select value={form.status} onChange={(event) => updateField("status", event.target.value)} className={adminInputClass}>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
        <button className={adminPrimaryButtonClass}>{form.id ? "Update" : "Create"}</button>
        <textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="Description" className={`md:col-span-5 ${adminTextareaClass}`} />
      </form>

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
              <button onClick={() => edit(category)} className={adminIconButtonClass}><Edit className="h-4 w-4" /></button>
              <button onClick={() => void remove(category)} className={adminIconButtonClass}><Trash2 className="h-4 w-4" /></button>
            </span>
          </div>
        ))}
        </div>
      </AdminPanel>
    </AdminPage>
  );
}
