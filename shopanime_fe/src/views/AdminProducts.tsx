import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Edit, Search, Trash2, X } from "lucide-react";
import { apiDelete, apiGet, apiPost, apiPut } from "../lib/api";
import { formatShippingFee, formatUsd, getProductDiscountPercent, getProductFinalPrice, getProductFinalShippingFee, getProductImage, getProductOriginalPrice, getProductShippingDiscountPercent, getProductShippingFee, hasProductDiscount, toNumber } from "../lib/format";
import type { ApiResponse, Author, Category, PaginatedApiResponse, PaginationMeta, Product } from "../lib/types";
import { AdminPage, AdminTable, adminFormClass, adminIconButtonClass, adminInputClass, adminPrimaryButtonClass, adminSecondaryButtonClass, adminTdClass, adminTextareaClass, adminThClass } from "../components/admin/AdminUI";
import { Pagination } from "../components/ui/Pagination";

interface ProductForm {
  id?: number;
  name: string;
  slug: string;
  category_id: string;
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
  name: "",
  slug: "",
  category_id: "",
  author_id: "",
  original_price: "",
  discount_percent: "0",
  shipping_fee: "0",
  shipping_discount_percent: "0",
  stock_quantity: "0",
  image_url: "",
  description: "",
  status: "ACTIVE",
};

function makeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const didMount = useRef(false);

  const loadProducts = async (nextPage = page, search = query) => {
    const params = new URLSearchParams({
      page: String(nextPage),
      limit: "10",
      sort: "newest",
    });
    const keyword = search.trim();
    if (keyword) {
      params.set("search", keyword);
    }
    const response = await apiGet<PaginatedApiResponse<Product[]>>(`/products?${params.toString()}`);
    setProducts(response.data);
    setPagination(response.meta);
  };

  useEffect(() => {
    void Promise.all([
      loadProducts(1, ""),
      apiGet<ApiResponse<Category[]>>("/categories").then((response) => setCategories(response.data)),
      apiGet<ApiResponse<Author[]>>("/authors").then((response) => setAuthors(response.data)),
    ]);
  }, []);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    const timer = window.setTimeout(() => {
      setPage(1);
      void loadProducts(1, query);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const visibleProducts = useMemo(() => products, [products]);
  const previewFinalPrice = calculateFinalPrice(form.original_price, form.discount_percent);
  const previewFinalShippingFee = calculateFinalShippingFee(form.shipping_fee, form.shipping_discount_percent);

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    void loadProducts(nextPage, query);
  };

  const updateField = (name: keyof ProductForm, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submitProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || makeSlug(form.name),
      category_id: form.category_id ? Number(form.category_id) : null,
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

    if (form.id) {
      await apiPut(`/products/${form.id}`, payload);
      setMessage("Product updated");
    } else {
      await apiPost("/products", payload);
      setMessage("Product created");
    }

    setForm(emptyForm);
    await loadProducts(page, query);
  };

  const editProduct = (product: Product) => {
    setForm({
      id: product.id,
      name: product.name,
      slug: product.slug || "",
      category_id: product.category_id ? String(product.category_id) : "",
      author_id: product.author_id ? String(product.author_id) : "",
      original_price: String(getProductOriginalPrice(product)),
      discount_percent: String(toNumber(product.discount_percent, getProductDiscountPercent(product))),
      shipping_fee: String(getProductShippingFee(product)),
      shipping_discount_percent: String(toNumber(product.shipping_discount_percent, getProductShippingDiscountPercent(product))),
      stock_quantity: String(product.stock_quantity),
      image_url: product.image_url || product.image || "",
      description: product.description || "",
      status: product.status || "ACTIVE",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteProduct = async (product: Product) => {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    await apiDelete(`/products/${product.id}`);
    setMessage("Product deleted");
    await loadProducts(page, query);
  };

  return (
    <AdminPage title="Products" description="Manage manga, books, figures and merchandise inventory." message={message}>

      <form onSubmit={submitProduct} className={`${adminFormClass} md:grid-cols-4`}>
        <input required value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Name" className={adminInputClass} />
        <input value={form.slug} onChange={(event) => updateField("slug", event.target.value)} placeholder="Slug" className={adminInputClass} />
        <select value={form.category_id} onChange={(event) => updateField("category_id", event.target.value)} className={adminInputClass}>
          <option value="">No category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <select value={form.author_id} onChange={(event) => updateField("author_id", event.target.value)} className={adminInputClass}>
          <option value="">No author</option>
          {authors.map((author) => (
            <option key={author.id} value={author.id}>{author.name}</option>
          ))}
        </select>
        <input required value={form.original_price} onChange={(event) => updateField("original_price", event.target.value)} placeholder="Original price" type="number" min="0.01" step="0.01" className={adminInputClass} />
        <input value={form.discount_percent} onChange={(event) => updateField("discount_percent", event.target.value)} placeholder="Discount %" type="number" min="0" max="95" step="0.01" className={adminInputClass} />
        <input value={form.shipping_fee} onChange={(event) => updateField("shipping_fee", event.target.value)} placeholder="Shipping fee" type="number" min="0" step="0.01" className={adminInputClass} />
        <input value={form.shipping_discount_percent} onChange={(event) => updateField("shipping_discount_percent", event.target.value)} placeholder="Ship discount %" type="number" min="0" max="100" step="0.01" className={adminInputClass} />
        <input value={form.stock_quantity} onChange={(event) => updateField("stock_quantity", event.target.value)} placeholder="Stock" type="number" min="0" className={adminInputClass} />
        <select value={form.status} onChange={(event) => updateField("status", event.target.value)} className={adminInputClass}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="DRAFT">Draft</option>
        </select>
        <input value={form.image_url} onChange={(event) => updateField("image_url", event.target.value)} placeholder="Image URL" className={`md:col-span-2 ${adminInputClass}`} />
        <textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="Description" className={`md:col-span-2 ${adminTextareaClass}`} />
        <div className="md:col-span-4 rounded border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-zinc-300">
          <span className="font-semibold text-white">Auto price preview:</span>{" "}
          <span className="font-black text-red-300">{formatUsd(previewFinalPrice)}</span>
          {Number(form.discount_percent || 0) > 0 && (
            <span className="ml-2 text-zinc-500">
              from <span className="line-through">{formatUsd(Number(form.original_price || 0))}</span>
            </span>
          )}
        </div>
        <div className="md:col-span-4 rounded border border-[#5ea5c8]/30 bg-[#5ea5c8]/5 px-4 py-3 text-sm text-zinc-300">
          <span className="font-semibold text-white">Auto shipping preview:</span>{" "}
          <span className="font-black text-[#9bdcff]">{formatShippingFee(previewFinalShippingFee)}</span>
          {Number(form.shipping_discount_percent || 0) > 0 && Number(form.shipping_fee || 0) > 0 && (
            <span className="ml-2 text-zinc-500">
              from <span className="line-through">{formatUsd(Number(form.shipping_fee || 0))}</span>
              <span className="ml-2 text-[#9bdcff]">-{Math.round(Number(form.shipping_discount_percent || 0))}% ship</span>
            </span>
          )}
        </div>
        <div className="md:col-span-4 flex gap-3">
          <button className={adminPrimaryButtonClass}>
            {form.id ? "Update Product" : "Add Product"}
          </button>
          {form.id && (
            <button type="button" onClick={() => setForm(emptyForm)} className={adminSecondaryButtonClass}>
              <X className="h-4 w-4" /> Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" className={`${adminInputClass} w-full pl-9`} />
        </div>
        <span className="text-sm text-zinc-500">{pagination?.total ?? visibleProducts.length} products</span>
      </div>

      <AdminTable>
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-[#2e333d] bg-[#16171d] text-xs uppercase text-zinc-500">
            <tr>
              <th className={adminThClass}>Product</th>
              <th className={adminThClass}>Category</th>
              <th className={adminThClass}>Author</th>
              <th className={adminThClass}>Price</th>
              <th className={adminThClass}>Stock</th>
              <th className={adminThClass}>Status</th>
              <th className={`${adminThClass} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e333d]">
            {visibleProducts.map((product) => (
              <tr key={product.id} className="hover:bg-white/[0.03]">
                <td className={adminTdClass}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-11 items-center justify-center overflow-hidden rounded bg-white p-1">
                      <img src={getProductImage(product)} alt={product.name} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">{product.name}</div>
                      <div className="text-xs text-zinc-500">{product.slug || `#${product.id}`}</div>
                    </div>
                  </div>
                </td>
                <td className={adminTdClass}>{product.category_name || "N/A"}</td>
                <td className={adminTdClass}>{product.author_name || product.author || "N/A"}</td>
                <td className={`${adminTdClass} text-white`}>
                  <div className="font-semibold">{formatUsd(getProductFinalPrice(product))}</div>
                  {hasProductDiscount(product) && (
                    <div className="text-xs text-red-300">
                      <span className="text-zinc-500 line-through">{formatUsd(getProductOriginalPrice(product))}</span>
                      <span className="ml-1">-{getProductDiscountPercent(product)}%</span>
                    </div>
                  )}
                  <div className="mt-1 text-xs text-[#9bdcff]">
                    Ship: {formatShippingFee(getProductFinalShippingFee(product))}
                    {getProductShippingDiscountPercent(product) > 0 && (
                      <span className="ml-1 text-zinc-500">
                        <span className="line-through">{formatUsd(getProductShippingFee(product))}</span>
                        <span className="ml-1 text-[#9bdcff]">-{getProductShippingDiscountPercent(product)}%</span>
                      </span>
                    )}
                  </div>
                </td>
                <td className={adminTdClass}>{product.stock_quantity}</td>
                <td className={adminTdClass}>
                  <span className="rounded bg-white/5 px-2.5 py-1 text-xs font-semibold text-zinc-300">{product.status || "ACTIVE"}</span>
                </td>
                <td className={adminTdClass}>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => editProduct(product)} className={adminIconButtonClass} aria-label={`Edit ${product.name}`}>
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => void deleteProduct(product)} className={adminIconButtonClass} aria-label={`Delete ${product.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTable>
      {pagination && (
        <Pagination meta={pagination} onPageChange={changePage} variant="admin" />
      )}
    </AdminPage>
  );
}
