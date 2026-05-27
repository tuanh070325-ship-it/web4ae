import type { ChangeEvent } from 'react';
import { useRef, useState } from 'react';
import { ImagePlus, Link, Trash2, Upload } from 'lucide-react';
import { apiPostForm } from '../../lib/api';
import { useProductPlaceholderImage } from '../../lib/format';
import { fileToProductImageBlob } from '../../lib/imageUpload';
import { adminHelperTextClass, adminIconButtonClass, adminInlineLabelClass, adminInputClass, adminSecondaryButtonClass } from './AdminUI';

interface UploadResponse {
  url: string;
  path: string;
  filename: string;
  mime: string;
  size: number;
}

interface ProductImageUploadProps {
  value: string;
  onChange: (value: string) => void;
}

export function ProductImageUpload({ value, onChange }: ProductImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const imageValue = value.trim();

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {return;}
    setProcessing(true);
    setError(null);
    try {
      const blob = await fileToProductImageBlob(file);
      const formData = new FormData();
      formData.append('file', new File([blob], 'product.webp', { type: 'image/webp' }));
      const response = await apiPostForm<{ data: UploadResponse }>('/uploads/images/product', formData);
      onChange(response.data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process product image');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="overflow-hidden rounded bg-[#101417] md:col-span-5">
      <div className="grid h-full gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
        <div className="flex min-h-44 items-center justify-center bg-[#0f1316] p-3">
          <div className="flex aspect-[2/3] w-24 items-center justify-center overflow-hidden rounded border border-[#343d43] bg-black/30 sm:w-24">
            {imageValue ? (
              <img src={imageValue} onError={useProductPlaceholderImage} alt="Product preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-zinc-600">
                <ImagePlus className="h-7 w-7" />
                <span className="text-[10px] font-bold uppercase tracking-wide">No image</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#101417] p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className={`inline-flex items-center gap-2 ${adminInlineLabelClass}`}>
              <Link className="h-3.5 w-3.5" /> Product image
            </label>
            {imageValue && (
              <button
                type="button"
                onClick={() => onChange('')}
                className={adminIconButtonClass}
                aria-label="Clear product image"
                title="Clear product image"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Paste image URL or upload local image"
            className={`${adminInputClass} w-full`}
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={processing}
              className={adminSecondaryButtonClass}
            >
              <Upload className="h-4 w-4" />
              {processing ? 'Processing...' : 'Upload local'}
            </button>
            <span className={`min-w-0 text-zinc-600 ${adminHelperTextClass}`}>Crops to 2:3 WebP and stores a short CDN-style URL.</span>
          </div>

          {error && <div className="mt-2 text-xs font-semibold text-[#ff8aa0]">{error}</div>}
          <input ref={fileInputRef} onChange={uploadImage} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" />
        </div>
      </div>
    </div>
  );
}
