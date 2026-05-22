import type { FormEvent} from 'react';
import { useCallback, useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPost, apiPut } from '../lib/api';
import type { ApiResponse, Author } from '../lib/types';
import { AdminPage, adminFormClass, adminInputClass, adminPrimaryButtonClass, adminTextareaClass } from '../components/admin/AdminUI';
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

      <AdminAuthorsList authors={authors} onEdit={edit} onRemove={handleRemove} />
    </AdminPage>
  );
}
