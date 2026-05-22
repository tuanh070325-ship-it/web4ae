import { memo } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import {
  formatShippingFee,
  formatUsd,
  getProductDiscountPercent,
  getProductFinalPrice,
  getProductFinalShippingFee,
  getProductImage,
  getProductOriginalPrice,
  getProductShippingDiscountPercent,
  getProductShippingFee,
  hasProductDiscount,
} from '../../../lib/format';
import type { Product } from '../../../lib/types';
import {
  AdminTable,
  adminIconButtonClass,
  adminTdClass,
  adminThClass,
} from '../AdminUI';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export const ProductTable = memo(function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  return (
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
          {products.map((product) => (
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
              <td className={adminTdClass}>{product.category_name || 'N/A'}</td>
              <td className={adminTdClass}>{product.author_name || product.author || 'N/A'}</td>
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
                <span className="rounded bg-white/5 px-2.5 py-1 text-xs font-semibold text-zinc-300">{product.status || 'ACTIVE'}</span>
              </td>
              <td className={adminTdClass}>
                <div className="flex justify-end gap-3">
                  <button onClick={() => onEdit(product)} className={adminIconButtonClass} aria-label={`Edit ${product.name}`}>
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => onDelete(product)} className={adminIconButtonClass} aria-label={`Delete ${product.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminTable>
  );
});
