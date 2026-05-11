import { FormEvent, useEffect, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { apiDelete, apiGet, apiPost, apiPut } from "../lib/api";
import type { ApiResponse, Author } from "../lib/types";
import { AdminPage, AdminPanel, adminFormClass, adminIconButtonClass, adminInputClass, adminPrimaryButtonClass, adminTextareaClass } from "../components/admin/AdminUI";

interface AuthorForm {
  id?: number;
  name: string;
  slug: string;
  bio: string;
  avatar_url: string;
  country: string;
}

const emptyForm: AuthorForm = { name: "", slug: "", bio: "", avatar_url: "", country: "" };

export function AdminAuthors() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [form, setForm] = useState<AuthorForm>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);

  const loadAuthors = async () => {
    const response = await apiGet<ApiResponse<Author[]>>("/authors");
    setAuthors(response.data);
  };

  useEffect(() => {
    void loadAuthors();
  }, []);

  const updateField = (name: keyof AuthorForm, value: string) => setForm((current) => ({ ...current, [name]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replaceAll(" ", "-"),
      bio: form.bio || null,
      avatar_url: form.avatar_url || null,
      country: form.country || null,
    };
    if (form.id) {
      await apiPut(`/authors/${form.id}`, payload);
      setMessage("Author updated");
    } else {
      await apiPost("/authors", payload);
      setMessage("Author created");
    }
    setForm(emptyForm);
    await loadAuthors();
  };

  const edit = (author: Author) => setForm({
    id: author.id,
    name: author.name,
    slug: author.slug || "",
    bio: author.bio || "",
    avatar_url: author.avatar_url || "",
    country: author.country || "",
  });

  const remove = async (author: Author) => {
    if (!window.confirm(`Delete ${author.name}?`)) return;
    await apiDelete(`/authors/${author.id}`);
    setMessage("Author deleted");
    await loadAuthors();
  };

  return (
    <AdminPage title="Authors" description="Manage author profiles and metadata." message={message}>

      <form onSubmit={submit} className={`${adminFormClass} md:grid-cols-5`}>
        <input required value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Name" className={adminInputClass} />
        <input value={form.slug} onChange={(event) => updateField("slug", event.target.value)} placeholder="Slug" className={adminInputClass} />
        <input value={form.country} onChange={(event) => updateField("country", event.target.value)} placeholder="Country" className={adminInputClass} />
        <input value={form.avatar_url} onChange={(event) => updateField("avatar_url", event.target.value)} placeholder="Avatar URL" className={adminInputClass} />
        <button className={adminPrimaryButtonClass}>{form.id ? "Update" : "Create"}</button>
        <textarea value={form.bio} onChange={(event) => updateField("bio", event.target.value)} placeholder="Bio" className={`md:col-span-5 ${adminTextareaClass}`} />
      </form>

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
            <span>{author.country || "N/A"}</span>
            <span className="flex gap-3">
              <button onClick={() => edit(author)} className={adminIconButtonClass}><Edit className="h-4 w-4" /></button>
              <button onClick={() => void remove(author)} className={adminIconButtonClass}><Trash2 className="h-4 w-4" /></button>
            </span>
          </div>
        ))}
        </div>
      </AdminPanel>
    </AdminPage>
  );
}
