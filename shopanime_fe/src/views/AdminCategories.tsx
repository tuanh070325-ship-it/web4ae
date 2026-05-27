import type { FormEvent} from 'react';
import { useCallback, useEffect, useState } from 'react';
import { createSlugPreview } from '../lib/slug';
import { apiDelete, apiGet, apiPost, apiPut } from '../lib/api';
import type { ApiMutationResponse, ApiResponse, Category } from '../lib/types';
import { AdminPage, adminFormClass, adminInputClass, adminPrimaryButtonClass, adminTextareaClass } from '../components/admin/AdminUI';
import { AdminCategoriesList } from '../components/admin/categories/AdminCategoriesList';

interface CategoryForm {
  id?: number;
  name: string;
  parent_id: string;
  description: string;
  status: string;
}

const emptyForm: CategoryForm = { name: '', parent_id: '', description: '', status: 'ACTIVE' };

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    const response = await apiGet<ApiResponse<Category[]>>('/categories');
    setCategories(response.data);
  }, []);

  useEffect(() => {
    void loadCategories();
  }, []);

  const updateField = useCallback((name: keyof CategoryForm, value: string) => setForm((current) => ({ ...current, [name]: value })), []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      name: form.name,
      parent_id: form.parent_id ? Number(form.parent_id) : null,
      description: form.description || null,
      status: form.status,
    };
    const expectedSlug = createSlugPreview(form.name, 'category');
    let savedSlug: string | undefined;
    if (form.id) {
      const response = await apiPut<ApiMutationResponse<{ slug?: string }>>(`/categories/${form.id}`, payload);
      savedSlug = response.data?.slug;
      setMessage(savedSlug && savedSlug !== expectedSlug ? `Category updated. Slug adjusted to ${savedSlug} to avoid duplicate.` : `Category updated. Slug: ${savedSlug || expectedSlug}`);
    } else {
      const response = await apiPost<ApiMutationResponse<{ slug?: string }>>('/categories', payload);
      savedSlug = response.data?.slug;
      setMessage(savedSlug && savedSlug !== expectedSlug ? `Category created. Slug adjusted to ${savedSlug} to avoid duplicate.` : `Category created. Slug: ${savedSlug || expectedSlug}`);
    }
    setForm(emptyForm);
    await loadCategories();
  };

  const edit = useCallback((category: Category) => setForm({
    id: category.id,
    name: category.name,
    parent_id: category.parent_id ? String(category.parent_id) : '',
    description: category.description || '',
    status: category.status || 'ACTIVE',
  }), []);

  const remove = useCallback(async (category: Category) => {
    if (!window.confirm(`Delete ${category.name}?`)) {return;}
    await apiDelete(`/categories/${category.id}`);
    setMessage('Category deleted');
    await loadCategories();
  }, [loadCategories]);

  const handleRemove = useCallback((category: Category) => {
    void remove(category);
  }, [remove]);

  return (
    <AdminPage title="Categories" description="Manage product categories and catalog grouping." message={message}>

      <form onSubmit={submit} className={`${adminFormClass} md:grid-cols-5`}>
        <input required value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Name" className={adminInputClass} />
        <div className="rounded border border-[#2e333d] bg-[#101115] px-3 py-2 text-xs text-zinc-500">
          Auto slug: <span className="font-semibold text-zinc-300">{createSlugPreview(form.name, 'category')}</span>
        </div>
        <input value={form.parent_id} onChange={(event) => updateField('parent_id', event.target.value)} placeholder="Parent ID" className={adminInputClass} />
        <select value={form.status} onChange={(event) => updateField('status', event.target.value)} className={adminInputClass}>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
        <button className={adminPrimaryButtonClass}>{form.id ? 'Update' : 'Create'}</button>
        <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Description" className={`md:col-span-5 ${adminTextareaClass}`} />
      </form>

      <AdminCategoriesList categories={categories} onEdit={edit} onRemove={handleRemove} />
    </AdminPage>
  );
}
