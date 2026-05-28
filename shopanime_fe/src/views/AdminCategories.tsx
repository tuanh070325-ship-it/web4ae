import type { FormEvent} from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { createSlugPreview } from '../lib/slug';
import { apiDelete, apiGet, apiPost, apiPut } from '../lib/api';
import type { ApiMutationResponse, ApiResponse, Category } from '../lib/types';
import { AdminEmptyState, AdminPage, AdminPaginationBar, AdminToolbar, adminFormClass, adminInputClass, adminPrimaryButtonClass, adminSecondaryButtonClass, adminTextareaClass } from '../components/admin/AdminUI';
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
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [parentFilter, setParentFilter] = useState('ALL');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [formOpen, setFormOpen] = useState(false);

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
    setFormOpen(false);
    await loadCategories();
  };

  const openCreateForm = useCallback(() => {
    setForm(emptyForm);
    setFormOpen(true);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }, []);

  const closeForm = useCallback(() => {
    setForm(emptyForm);
    setFormOpen(false);
  }, []);

  const edit = useCallback((category: Category) => {
    setForm({
      id: category.id,
      name: category.name,
      parent_id: category.parent_id ? String(category.parent_id) : '',
      description: category.description || '',
      status: category.status || 'ACTIVE',
    });
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const remove = useCallback(async (category: Category) => {
    if (!window.confirm(`Delete ${category.name}?`)) {return;}
    await apiDelete(`/categories/${category.id}`);
    setMessage('Category deleted');
    await loadCategories();
  }, [loadCategories]);

  const handleRemove = useCallback((category: Category) => {
    void remove(category);
  }, [remove]);

  const filteredCategories = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return categories
      .filter((category) => {
        const matchesStatus = statusFilter === 'ALL' || category.status === statusFilter;
        const matchesParent = parentFilter === 'ALL'
          || (parentFilter === 'ROOT' && !category.parent_id)
          || (parentFilter === 'CHILD' && Boolean(category.parent_id));
        const matchesKeyword = !keyword || [category.name, category.slug, category.description]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
        return matchesStatus && matchesParent && matchesKeyword;
      })
      .sort((left, right) => {
        if (sort === 'newest') {return right.id - left.id;}
        if (sort === 'status') {return String(left.status || '').localeCompare(String(right.status || '')) || left.name.localeCompare(right.name);}
        if (sort === 'sort_order') {return Number(left.sort_order || 0) - Number(right.sort_order || 0) || left.name.localeCompare(right.name);}
        return left.name.localeCompare(right.name);
      });
  }, [categories, parentFilter, query, sort, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / limit));
  const currentPage = Math.min(page, totalPages);
  const visibleCategories = filteredCategories.slice((currentPage - 1) * limit, currentPage * limit);
  const resetFilters = () => {
    setQuery('');
    setStatusFilter('ALL');
    setParentFilter('ALL');
    setSort('name');
    setPage(1);
  };

  return (
    <AdminPage title="Categories" description="Manage product categories and catalog grouping." message={message}>

      <div className="mb-5 flex flex-col gap-3 rounded bg-[#171d21] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.22)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-black uppercase tracking-wide text-white">Category workspace</div>
          <div className="mt-1 text-sm text-zinc-500">Browse taxonomy first. Open the editor only when creating or updating a category.</div>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex h-11 items-center justify-center gap-2 rounded bg-[#e63946] px-4 text-sm font-black text-white shadow-[0_14px_28px_rgba(230,57,70,0.2)] transition-all hover:-translate-y-0.5 hover:bg-red-500 hover:shadow-[0_18px_34px_rgba(230,57,70,0.28)]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.4} />
          Add category
        </button>
      </div>

      {formOpen && <form onSubmit={submit} className={`${adminFormClass} gap-4 md:grid-cols-5`}>
        <div className="md:col-span-5 flex flex-col gap-3 border-b border-[#273037] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-black text-white">{form.id ? 'Edit category' : 'Add new category'}</div>
            <div className="mt-1 text-sm text-zinc-500">Define catalog grouping, parent relationship and visibility status.</div>
          </div>
          <button type="button" onClick={closeForm} className="inline-flex h-10 items-center justify-center gap-2 rounded border border-[#343d43] bg-[#101417] px-4 text-sm font-black text-zinc-300 transition-colors hover:border-red-500/70 hover:bg-red-500/10 hover:text-white">
            <X className="h-4 w-4" />
            Close
          </button>
        </div>
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
      </form>}

      <AdminToolbar>
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search name, slug, description" className={`${adminInputClass} w-full pl-9`} />
        </div>
        <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className={adminInputClass}>
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
        <select value={parentFilter} onChange={(event) => { setParentFilter(event.target.value); setPage(1); }} className={adminInputClass}>
          <option value="ALL">All levels</option>
          <option value="ROOT">Root categories</option>
          <option value="CHILD">Child categories</option>
        </select>
        <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} className={adminInputClass}>
          <option value="name">Name A-Z</option>
          <option value="newest">Newest</option>
          <option value="status">Status</option>
          <option value="sort_order">Sort order</option>
        </select>
        <select value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }} className={adminInputClass}>
          <option value={10}>10 rows</option>
          <option value={20}>20 rows</option>
          <option value={50}>50 rows</option>
        </select>
        <button type="button" onClick={resetFilters} className={adminSecondaryButtonClass}><X className="h-4 w-4" /> Reset</button>
      </AdminToolbar>

      {visibleCategories.length > 0 ? <AdminCategoriesList categories={visibleCategories} onEdit={edit} onRemove={handleRemove} /> : <AdminEmptyState message="No categories match the current filters." />}
      <AdminPaginationBar meta={{ page: currentPage, limit, total: filteredCategories.length }} onPageChange={setPage} />
    </AdminPage>
  );
}
