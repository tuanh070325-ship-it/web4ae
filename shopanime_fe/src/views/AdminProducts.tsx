import type { FormEvent} from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { apiDelete, apiGet, apiPost, apiPut } from '../lib/api';
import { createSlugPreview } from '../lib/slug';
import { formatShippingFee, formatUsd, getProductDiscountPercent, getProductOriginalPrice, getProductShippingDiscountPercent, getProductShippingFee, toNumber } from '../lib/format';
import type { ApiMutationResponse, ApiResponse, Author, Category, PaginatedApiResponse, PaginationMeta, Product } from '../lib/types';
import {
  AdminPage,
  AdminToast,
  type AdminToastState,
  adminFormClass,
  adminHelperTextClass,
  adminInlineLabelClass,
  adminInputClass,
  adminLabelClass,
  adminPrimaryButtonClass,
  adminReadOnlyFieldClass,
  adminSecondaryButtonClass,
} from '../components/admin/AdminUI';
import { Pagination } from '../components/ui/Pagination';
import { ProductDescriptionAi } from '../components/admin/ProductDescriptionAi';
import { ProductImageUpload } from '../components/admin/ProductImageUpload';
import { ProductTable } from '../components/admin/products/ProductTable';

interface ProductForm {
  id?: number;
  name: string;
  category_ids: string[];
  author_id: string;
  original_price: string;
  discount_percent: string;
  shipping_fee: string;
  shipping_discount_percent: string;
  stock_quantity: string;
  image_url: string;
  description: string;
  status: string;
}

const emptyForm: ProductForm = {
  name: '',
  category_ids: [],
  author_id: '',
  original_price: '',
  discount_percent: '0',
  shipping_fee: '0',
  shipping_discount_percent: '0',
  stock_quantity: '0',
  image_url: '',
  description: '',
  status: 'ACTIVE',
};


function calculateFinalPrice(originalPrice: string, discountPercent: string) {
  const original = Number(originalPrice);
  const discount = Number(discountPercent || 0);
  if (!Number.isFinite(original) || original <= 0 || !Number.isFinite(discount) || discount < 0) {
    return 0;
  }
  return Math.round(original * (1 - Math.min(discount, 95) / 100) * 100) / 100;
}

function calculateFinalShippingFee(shippingFee: string, shippingDiscountPercent: string) {
  const fee = Number(shippingFee || 0);
  const discount = Number(shippingDiscountPercent || 0);
  if (!Number.isFinite(fee) || fee < 0 || !Number.isFinite(discount) || discount < 0) {
    return 0;
  }
  return Math.round(fee * (1 - Math.min(discount, 100) / 100) * 100) / 100;
}

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [toast, setToast] = useState<AdminToastState | null>(null);
  const didMount = useRef(false);

  const loadProducts = async (nextPage = page, search = query, status = statusFilter) => {
    const params = new URLSearchParams({
      page: String(nextPage),
      limit: '10',
      sort: 'newest',
    });
    const keyword = search.trim();
    if (keyword) {
      params.set('search', keyword);
    }
    if (status !== 'ALL') {
      params.set('status', status);
    }
    const response = await apiGet<PaginatedApiResponse<Product[]>>(`/admin/products?${params.toString()}`);
    setProducts(response.data);
    setPagination(response.meta);
  };

  useEffect(() => {
    void Promise.all([
      loadProducts(1, ''),
      apiGet<ApiResponse<Category[]>>('/categories').then((response) => setCategories(response.data)),
      apiGet<ApiResponse<Author[]>>('/authors').then((response) => setAuthors(response.data)),
    ]);
  }, []);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    const timer = window.setTimeout(() => {
      setPage(1);
      void loadProducts(1, query, statusFilter);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query, statusFilter]);

  useEffect(() => {
    if (!toast) {return;}
    const timer = window.setTimeout(() => setToast(null), 4600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const visibleProducts = useMemo(() => products, [products]);
  const previewFinalPrice = useMemo(
    () => calculateFinalPrice(form.original_price, form.discount_percent),
    [form.discount_percent, form.original_price],
  );
  const previewFinalShippingFee = useMemo(
    () => calculateFinalShippingFee(form.shipping_fee, form.shipping_discount_percent),
    [form.shipping_discount_percent, form.shipping_fee],
  );
  const selectedCategory = useMemo(
    () => categories.find((category) => String(category.id) === form.category_ids[0]),
    [categories, form.category_ids],
  );
  const selectedAuthor = useMemo(
    () => authors.find((author) => String(author.id) === form.author_id),
    [authors, form.author_id],
  );
  const aiProductContext = useMemo(
    () => ({
      name: form.name,
      category: selectedCategory?.name || '',
      author: selectedAuthor?.name || '',
      price: previewFinalPrice,
    }),
    [form.name, previewFinalPrice, selectedAuthor?.name, selectedCategory?.name],
  );

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    void loadProducts(nextPage, query, statusFilter);
  };

  const openCreateForm = useCallback(() => {
    setForm(emptyForm);
    setFormOpen(true);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }, []);

  const closeProductForm = useCallback(() => {
    setForm(emptyForm);
    setFormOpen(false);
  }, []);

  const updateField = useCallback((name: keyof ProductForm, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
  }, []);
  const toggleProductCategory = useCallback((categoryId: string) => {
    setForm((current) => ({
      ...current,
      category_ids: current.category_ids.includes(categoryId)
        ? current.category_ids.filter((currentCategoryId) => currentCategoryId !== categoryId)
        : [...current.category_ids, categoryId],
    }));
  }, []);

  const submitProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const editing = Boolean(form.id);
    const payload = {
      name: form.name.trim(),
      category_id: form.category_ids[0] ? Number(form.category_ids[0]) : null,
      category_ids: form.category_ids.map((categoryId) => Number(categoryId)),
      author_id: form.author_id ? Number(form.author_id) : null,
      original_price: Number(form.original_price),
      discount_percent: Number(form.discount_percent || 0),
      shipping_fee: Number(form.shipping_fee || 0),
      shipping_discount_percent: Number(form.shipping_discount_percent || 0),
      stock_quantity: Number(form.stock_quantity),
      image_url: form.image_url.trim() || null,
      description: form.description.trim() || null,
      status: form.status,
    };

    const expectedSlug = createSlugPreview(form.name, 'product');
    let savedSlug: string | undefined;
    if (form.id) {
      const response = await apiPut<ApiMutationResponse<{ slug?: string }>>(`/products/${form.id}`, payload);
      savedSlug = response.data?.slug;
    } else {
      const response = await apiPost<ApiMutationResponse<{ slug?: string }>>('/products', payload);
      savedSlug = response.data?.slug;
    }

    setForm(emptyForm);
    setFormOpen(false);
    setToast({
      type: 'success',
      title: editing ? 'Product updated' : 'Product created',
      description: savedSlug && savedSlug !== expectedSlug ? `Slug adjusted to ${savedSlug} to avoid duplicate.` : `Slug: ${savedSlug || expectedSlug}`,
    });
    await loadProducts(page, query, statusFilter);
  };

  const editProduct = useCallback((product: Product) => {
    setForm({
      id: product.id,
      name: product.name,
      category_ids: (product.category_ids && product.category_ids.length > 0
        ? product.category_ids
        : [product.category_id, ...(product.secondary_category_ids || [])].filter((categoryId): categoryId is number => Boolean(categoryId))
      ).map((categoryId) => String(categoryId)),
      author_id: product.author_id ? String(product.author_id) : '',
      original_price: String(getProductOriginalPrice(product)),
      discount_percent: String(toNumber(product.discount_percent, getProductDiscountPercent(product))),
      shipping_fee: String(getProductShippingFee(product)),
      shipping_discount_percent: String(toNumber(product.shipping_discount_percent, getProductShippingDiscountPercent(product))),
      stock_quantity: String(product.stock_quantity),
      image_url: product.image_url || product.image || '',
      description: product.description || '',
      status: product.status || 'ACTIVE',
    });
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const deleteProduct = useCallback(async (product: Product) => {
    if (!window.confirm(`Delete ${product.name}?`)) {return;}
    await apiDelete(`/products/${product.id}`);
    setToast({ type: 'success', title: 'Product deleted', description: `${product.name} has been removed from inventory.` });
    await loadProducts(page, query, statusFilter);
  }, [page, query, statusFilter]);
  const handleDeleteProduct = useCallback((product: Product) => {
    void deleteProduct(product);
  }, [deleteProduct]);

  return (
    <AdminPage title="Products" description="Manage manga, books, figures and merchandise inventory.">
      <AdminToast toast={toast} onClose={() => setToast(null)} />

      <div className="mb-5 flex flex-col gap-3 rounded bg-[#171d21] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.22)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-black uppercase tracking-wide text-white">Inventory workspace</div>
          <div className="mt-1 text-sm text-zinc-500">Review products first. Open the editor only when creating or updating an item.</div>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex h-11 items-center justify-center gap-2 rounded bg-[#e63946] px-4 text-sm font-black text-white shadow-[0_14px_28px_rgba(230,57,70,0.2)] transition-all hover:-translate-y-0.5 hover:bg-red-500 hover:shadow-[0_18px_34px_rgba(230,57,70,0.28)]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.4} />
          Add product
        </button>
      </div>

      {formOpen && <form onSubmit={submitProduct} className={`${adminFormClass} gap-4 md:grid-cols-12`}>
        <div className="md:col-span-12 flex flex-col gap-3 border-b border-[#273037] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-black text-white">{form.id ? 'Edit product' : 'Add new product'}</div>
            <div className="mt-1 text-sm text-zinc-500">Complete the product details, categories, image and selling status.</div>
          </div>
          <button
            type="button"
            onClick={closeProductForm}
            className="inline-flex h-10 items-center justify-center gap-2 rounded border border-[#343d43] bg-[#101417] px-4 text-sm font-black text-zinc-300 transition-colors hover:border-red-500/70 hover:bg-red-500/10 hover:text-white"
          >
            <X className="h-4 w-4" />
            Close
          </button>
        </div>

        <div className="md:col-span-5">
          <label className={adminLabelClass}>Product name</label>
          <input required value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Name" className={`${adminInputClass} w-full`} />
        </div>

        <div className="md:col-span-4">
          <label className={adminLabelClass}>Slug</label>
          <div className={adminReadOnlyFieldClass}>
            <span className="truncate">{createSlugPreview(form.name, 'product')}</span>
          </div>
        </div>

        <div className="md:col-span-3">
          <label className={adminLabelClass}>Author</label>
          <select value={form.author_id} onChange={(event) => updateField('author_id', event.target.value)} className={`${adminInputClass} w-full`}>
            <option value="">No author</option>
            {authors.map((author) => (
              <option key={author.id} value={author.id}>{author.name}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-12 rounded bg-[#101417]/65 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label className={adminInlineLabelClass}>Product categories</label>
            <span className={adminHelperTextClass}>{form.category_ids.length} selected</span>
          </div>
          <div className="grid max-h-32 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => {
              const categoryId = String(category.id);
              const selected = form.category_ids.includes(categoryId);
              return (
                <label key={category.id} className={`flex h-9 cursor-pointer items-center gap-2 rounded border px-3 text-sm ${selected ? 'border-[#e63946] bg-[#e63946]/10 text-white' : 'border-[#343d43] bg-[#101417] text-zinc-300 hover:border-[#e63946] hover:text-white'}`}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleProductCategory(categoryId)}
                    className="h-4 w-4 rounded border-[#4a5568] bg-[#181a1f] accent-[#e63946]"
                  />
                  <span className="truncate">{category.name}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-3">
          <label className={adminLabelClass}>Original price</label>
          <input required value={form.original_price} onChange={(event) => updateField('original_price', event.target.value)} placeholder="0.00" type="number" min="0.01" step="0.01" className={`${adminInputClass} w-full`} />
        </div>
        <div className="md:col-span-3">
          <label className={adminLabelClass}>Discount</label>
          <input value={form.discount_percent} onChange={(event) => updateField('discount_percent', event.target.value)} placeholder="0" type="number" min="0" max="95" step="0.01" className={`${adminInputClass} w-full`} />
        </div>
        <div className="md:col-span-3">
          <label className={adminLabelClass}>Stock</label>
          <input value={form.stock_quantity} onChange={(event) => updateField('stock_quantity', event.target.value)} placeholder="0" type="number" min="0" className={`${adminInputClass} w-full`} />
        </div>
        <div className="md:col-span-3">
          <label className={adminLabelClass}>Status</label>
          <select value={form.status} onChange={(event) => updateField('status', event.target.value)} className={`${adminInputClass} w-full`}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="DRAFT">Draft</option>
            <option value="OUT_OF_STOCK">Out of stock</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <label className={adminLabelClass}>Shipping fee</label>
          <input value={form.shipping_fee} onChange={(event) => updateField('shipping_fee', event.target.value)} placeholder="0.00" type="number" min="0" step="0.01" className={`${adminInputClass} w-full`} />
        </div>
        <div className="md:col-span-3">
          <label className={adminLabelClass}>Ship discount</label>
          <input value={form.shipping_discount_percent} onChange={(event) => updateField('shipping_discount_percent', event.target.value)} placeholder="0" type="number" min="0" max="100" step="0.01" className={`${adminInputClass} w-full`} />
        </div>
        <div className="flex min-h-10 items-center justify-between gap-3 rounded border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-zinc-300 md:col-span-3">
          <div className={adminInlineLabelClass}>Final price</div>
          <div className="shrink-0 font-black text-red-300">{formatUsd(previewFinalPrice)}</div>
        </div>
        <div className="flex min-h-10 items-center justify-between gap-3 rounded border border-[#5ea5c8]/30 bg-[#5ea5c8]/5 px-3 py-2 text-sm text-zinc-300 md:col-span-3">
          <div className={adminInlineLabelClass}>Final shipping</div>
          <div className="shrink-0 font-black text-[#9bdcff]">{formatShippingFee(previewFinalShippingFee)}</div>
        </div>

        <ProductImageUpload value={form.image_url} onChange={(value) => updateField('image_url', value)} />
        <div className="md:col-span-7">
          <ProductDescriptionAi
            value={form.description}
            onChange={(value) => updateField('description', value)}
            product={aiProductContext}
          />
        </div>

        <div className="md:col-span-12 flex gap-3">
          <button className={`${adminPrimaryButtonClass} shadow-[0_14px_28px_rgba(230,57,70,0.18)] hover:-translate-y-0.5`}>
            {form.id ? 'Update Product' : 'Add Product'}
          </button>
          <button type="button" onClick={closeProductForm} className={adminSecondaryButtonClass}>
            <X className="h-4 w-4" /> Close
          </button>
        </div>
      </form>}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid w-full gap-3 sm:grid-cols-[minmax(260px,384px)_180px] lg:w-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" className={`${adminInputClass} w-full pl-9`} />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className={`${adminInputClass} w-full min-w-[180px]`}
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="DRAFT">Draft</option>
            <option value="OUT_OF_STOCK">Out of stock</option>
          </select>
        </div>
        <span className="shrink-0 text-sm text-zinc-500">{pagination?.total ?? visibleProducts.length} products</span>
      </div>

      <ProductTable products={visibleProducts} onEdit={editProduct} onDelete={handleDeleteProduct} />
      {pagination && (
        <Pagination meta={pagination} onPageChange={changePage} variant="admin" />
      )}
    </AdminPage>
  );
}
