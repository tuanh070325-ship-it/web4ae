import type { FormEvent} from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { apiDelete, apiGet, apiPost, apiPut } from '../lib/api';
import type { ApiResponse, Author } from '../lib/types';
import { AdminEmptyState, AdminPage, AdminPaginationBar, AdminToolbar, adminFormClass, adminInputClass, adminPrimaryButtonClass, adminSecondaryButtonClass, adminTextareaClass } from '../components/admin/AdminUI';
import { AdminAuthorsList } from '../components/admin/authors/AdminAuthorsList';

interface AuthorForm {
  id?: number;
  name: string;
  slug: string;
  bio: string;
  avatar_url: string;
  country: string;
}

const emptyForm: AuthorForm = { name: '', slug: '', bio: '', avatar_url: '', country: '' };

export function AdminAuthors() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [form, setForm] = useState<AuthorForm>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const loadAuthors = useCallback(async () => {
    const response = await apiGet<ApiResponse<Author[]>>('/authors');
    setAuthors(response.data);
  }, []);

  useEffect(() => {
    void loadAuthors();
  }, []);

  const updateField = useCallback((name: keyof AuthorForm, value: string) => setForm((current) => ({ ...current, [name]: value })), []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replaceAll(' ', '-'),
      bio: form.bio || null,
      avatar_url: form.avatar_url || null,
      country: form.country || null,
    };
    if (form.id) {
      await apiPut(`/authors/${form.id}`, payload);
      setMessage('Author updated');
    } else {
      await apiPost('/authors', payload);
      setMessage('Author created');
    }
    setForm(emptyForm);
    await loadAuthors();
  };

  const edit = useCallback((author: Author) => setForm({
    id: author.id,
    name: author.name,
    slug: author.slug || '',
    bio: author.bio || '',
    avatar_url: author.avatar_url || '',
    country: author.country || '',
  }), []);

  const remove = useCallback(async (author: Author) => {
    if (!window.confirm(`Delete ${author.name}?`)) {return;}
    await apiDelete(`/authors/${author.id}`);
    setMessage('Author deleted');
    await loadAuthors();
  }, [loadAuthors]);

  const handleRemove = useCallback((author: Author) => {
    void remove(author);
  }, [remove]);

  const countries = useMemo(() => [...new Set(authors.map((author) => author.country).filter((country): country is string => Boolean(country)))].sort(), [authors]);
  const filteredAuthors = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return authors
      .filter((author) => {
        const matchesCountry = countryFilter === 'ALL' || author.country === countryFilter;
        const matchesKeyword = !keyword || [author.name, author.slug, author.country, author.bio]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
        return matchesCountry && matchesKeyword;
      })
      .sort((left, right) => {
        if (sort === 'newest') {return right.id - left.id;}
        if (sort === 'country') {return String(left.country || '').localeCompare(String(right.country || '')) || left.name.localeCompare(right.name);}
        return left.name.localeCompare(right.name);
      });
  }, [authors, countryFilter, query, sort]);
  const totalPages = Math.max(1, Math.ceil(filteredAuthors.length / limit));
  const currentPage = Math.min(page, totalPages);
  const visibleAuthors = filteredAuthors.slice((currentPage - 1) * limit, currentPage * limit);
  const resetFilters = () => {
    setQuery('');
    setCountryFilter('ALL');
    setSort('name');
    setPage(1);
  };

  return (
    <AdminPage title="Authors" description="Manage author profiles and metadata." message={message}>

      <form onSubmit={submit} className={`${adminFormClass} md:grid-cols-5`}>
        <input required value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Name" className={adminInputClass} />
        <input value={form.slug} onChange={(event) => updateField('slug', event.target.value)} placeholder="Slug" className={adminInputClass} />
        <input value={form.country} onChange={(event) => updateField('country', event.target.value)} placeholder="Country" className={adminInputClass} />
        <input value={form.avatar_url} onChange={(event) => updateField('avatar_url', event.target.value)} placeholder="Avatar URL" className={adminInputClass} />
        <button className={adminPrimaryButtonClass}>{form.id ? 'Update' : 'Create'}</button>
        <textarea value={form.bio} onChange={(event) => updateField('bio', event.target.value)} placeholder="Bio" className={`md:col-span-5 ${adminTextareaClass}`} />
      </form>

      <AdminToolbar>
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search name, slug, country" className={`${adminInputClass} w-full pl-9`} />
        </div>
        <select value={countryFilter} onChange={(event) => { setCountryFilter(event.target.value); setPage(1); }} className={adminInputClass}>
          <option value="ALL">All countries</option>
          {countries.map((country) => <option key={country} value={country}>{country}</option>)}
        </select>
        <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} className={adminInputClass}>
          <option value="name">Name A-Z</option>
          <option value="newest">Newest</option>
          <option value="country">Country</option>
        </select>
        <select value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }} className={adminInputClass}>
          <option value={10}>10 rows</option>
          <option value={20}>20 rows</option>
          <option value={50}>50 rows</option>
        </select>
        <button type="button" onClick={resetFilters} className={adminSecondaryButtonClass}><X className="h-4 w-4" /> Reset</button>
      </AdminToolbar>

      {visibleAuthors.length > 0 ? <AdminAuthorsList authors={visibleAuthors} onEdit={edit} onRemove={handleRemove} /> : <AdminEmptyState message="No authors match the current filters." />}
      <AdminPaginationBar meta={{ page: currentPage, limit, total: filteredAuthors.length }} onPageChange={setPage} />
    </AdminPage>
  );
}
