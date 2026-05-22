import type { KeyboardEvent} from 'react';
import { useMemo, useState } from 'react';
import {
  BadgeCheck,
  Bold,
  BotMessageSquare,
  CircleX,
  FilePenLine,
  Italic,
  Link,
  List,
  ListOrdered,
  RefreshCcw,
  Settings2,
  Sparkles,
  Strikethrough,
  WandSparkles,
} from 'lucide-react';
import { apiPost } from '../../lib/api';
import type { ApiResponse } from '../../lib/types';
import {
  adminIconButtonClass,
  adminPrimaryButtonClass,
} from './AdminUI';

interface ProductAiContext {
  name: string;
  category: string;
  author: string;
  price: number;
}

interface ProductAiResult {
  description: string;
  source: 'gemini';
}

interface ProductDescriptionAiProps {
  value: string;
  onChange: (value: string) => void;
  product: ProductAiContext;
}

const AI_COMMAND = '@AKIBA_AI';
const MIN_DESCRIPTION_LENGTH = 500;
const MAX_DESCRIPTION_LENGTH = 700;
const refineSuggestions = [
  {
    label: 'More emotional',
    instruction: 'Lam noi dung cam xuc hon, tao cam giac muon doc va muon mua hon, nhung khong dai dong.',
  },
  {
    label: 'Shorter',
    instruction: 'Rut gon noi dung, giu y chinh va loi ich san pham, van tu nhien va chuan SEO.',
  },
  {
    label: 'SEO friendly',
    instruction: 'Toi uu SEO tu nhien hon, them tu khoa lien quan neu phu hop, khong nhoi nhet tu khoa.',
  },
  {
    label: 'Anime style',
    instruction: 'Viet theo phong cach gan voi fan anime/manga, cuon hut hon nhung van lich su va khong qua lo.',
  },
];

const editorTools = [
  { label: 'Bold', icon: Bold },
  { label: 'Italic', icon: Italic },
  { label: 'Strikethrough', icon: Strikethrough },
  { label: 'Bulleted list', icon: List },
  { label: 'Numbered list', icon: ListOrdered },
  { label: 'Link', icon: Link },
];

function commandInstruction(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue.toUpperCase().startsWith(AI_COMMAND)) {
    return '';
  }
  return trimmedValue.slice(AI_COMMAND.length).trim();
}

function validDraftDescription(value: string) {
  return value.length >= MIN_DESCRIPTION_LENGTH && value.length <= MAX_DESCRIPTION_LENGTH;
}

export function ProductDescriptionAi({ value, onChange, product }: ProductDescriptionAiProps) {
  const [draftDescription, setDraftDescription] = useState<string | null>(null);
  const [revisionInstruction, setRevisionInstruction] = useState('');
  const [editingRevision, setEditingRevision] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const instruction = useMemo(() => commandInstruction(value), [value]);
  const trimmedValue = value.trim();
  const upperValue = trimmedValue.toUpperCase();
  const isCommand = upperValue.startsWith(AI_COMMAND);
  const showCommandSuggestion = upperValue.startsWith('@') && !isCommand && AI_COMMAND.startsWith(upperValue);

  const generateDescription = async () => {
    if (!instruction || loading) {return;}
    setLoading(true);
    setError(null);
    setEditingRevision(false);
    setRevisionInstruction('');
    try {
      const response = await apiPost<ApiResponse<ProductAiResult>>('/admin/product-ai/description/generate', {
        instruction,
        product,
      });
      if (!validDraftDescription(response.data.description)) {
        throw new Error(`AI description must be between ${MIN_DESCRIPTION_LENGTH} and ${MAX_DESCRIPTION_LENGTH} characters. Please generate again.`);
      }
      setDraftDescription(response.data.description);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate product description');
    } finally {
      setLoading(false);
    }
  };

  const reviseDescription = async () => {
    if (!draftDescription || !revisionInstruction.trim() || loading) {return;}
    setLoading(true);
    setError(null);
    try {
      const response = await apiPost<ApiResponse<ProductAiResult>>('/admin/product-ai/description/revise', {
        description: draftDescription,
        instruction: revisionInstruction,
        product,
      });
      if (!validDraftDescription(response.data.description)) {
        throw new Error(`AI description must be between ${MIN_DESCRIPTION_LENGTH} and ${MAX_DESCRIPTION_LENGTH} characters. Please refine again.`);
      }
      setDraftDescription(response.data.description);
      setRevisionInstruction('');
      setEditingRevision(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to revise product description');
    } finally {
      setLoading(false);
    }
  };

  const approveDescription = () => {
    if (!draftDescription) {return;}
    onChange(draftDescription);
    setDraftDescription(null);
    setRevisionInstruction('');
    setEditingRevision(false);
    setError(null);
  };

  const cancelAiResult = () => {
    setDraftDescription(null);
    setRevisionInstruction('');
    setEditingRevision(false);
    setError(null);
    if (isCommand) {
      onChange('');
    }
  };

  const insertAiCommand = () => {
    onChange(`${AI_COMMAND} `);
    setError(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommandSuggestion && (event.key === 'Enter' || event.key === 'Tab')) {
      event.preventDefault();
      insertAiCommand();
      return;
    }

    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && instruction) {
      event.preventDefault();
      void generateDescription();
    }
  };

  const handleRevisionKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && revisionInstruction.trim()) {
      event.preventDefault();
      void reviseDescription();
    }
  };

  return (
    <div className="relative md:col-span-4">
      <div className="overflow-hidden rounded border border-[#343d43] bg-[#101417] transition-colors focus-within:border-red-500/70">
        <div className="border-b border-[#263038] px-3 py-2">
          <div className="mb-2 text-xs font-semibold text-zinc-500">Description</div>
          <div className="flex flex-wrap items-center gap-1.5 text-zinc-400">
            {editorTools.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                title={label}
                aria-label={label}
                className="inline-flex h-7 w-7 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-200"
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type or paste description here..."
          className="min-h-28 w-full resize-y bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
        />
      </div>

      {showCommandSuggestion && (
        <button
          type="button"
          onClick={insertAiCommand}
          className="mt-2 flex w-full items-center justify-between rounded border border-red-500/35 bg-red-500/5 px-3 py-2 text-left text-sm transition-colors hover:border-red-500/70 hover:bg-red-500/10"
        >
          <span className="inline-flex min-w-0 items-center gap-2">
            <WandSparkles className="h-4 w-4 shrink-0 text-red-300" />
            <span className="font-black text-white">{AI_COMMAND}</span>
            <span className="truncate text-xs font-semibold text-zinc-500">Generate SEO product description</span>
          </span>
          <span className="hidden text-xs font-semibold text-zinc-500 sm:inline">Enter / Tab</span>
        </button>
      )}

      {isCommand && !draftDescription && (
        <div className="mt-3 rounded border border-red-500/30 bg-red-500/5 p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <WandSparkles className="h-4 w-4 text-red-300" />
                Akiba AI description
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Command detected. Press Ctrl+Enter or generate to create an SEO product description.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void generateDescription()}
              disabled={!instruction || loading}
              className={adminPrimaryButtonClass}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
          {!instruction && (
            <p className="mt-2 text-xs font-semibold text-[#ff8aa0]">
              Add your request after @AKIBA_AI.
            </p>
          )}
        </div>
      )}

      {draftDescription && (
        <div className="mt-3 overflow-hidden rounded border border-red-500/40 bg-[linear-gradient(135deg,rgba(230,57,70,0.13),rgba(16,20,23,0.96)_42%,rgba(16,20,23,0.98))] shadow-[0_18px_44px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col gap-3 border-b border-red-500/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-white">
                <BotMessageSquare className="h-4 w-4 text-red-300" strokeWidth={2.1} />
                Product copy
                <span className="rounded-full border border-red-400/35 bg-red-500/10 px-2 py-0.5 text-[11px] font-black text-red-200">
                  Suggested
                </span>
              </div>
              <div className="mt-1 text-xs text-zinc-500">{draftDescription.length}/{MAX_DESCRIPTION_LENGTH} characters</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void generateDescription()}
                disabled={loading}
                className={adminIconButtonClass}
                aria-label="Regenerate description"
                title="Regenerate"
              >
                <RefreshCcw className="h-4 w-4 text-zinc-300" strokeWidth={2.1} />
              </button>
              <button
                type="button"
                className={adminIconButtonClass}
                aria-label="More options"
                title="More options"
              >
                <Settings2 className="h-4 w-4 text-zinc-400" strokeWidth={2.1} />
              </button>
              <button
                type="button"
                onClick={cancelAiResult}
                className={adminIconButtonClass}
                aria-label="Cancel AI description"
                title="Cancel"
              >
                <CircleX className="h-4 w-4 text-red-300" strokeWidth={2.1} />
              </button>
              <button
                type="button"
                onClick={() => setEditingRevision((current) => !current)}
                className={adminIconButtonClass}
                aria-label="Edit description"
                title="Edit"
              >
                <FilePenLine className="h-4 w-4 text-red-200" strokeWidth={2.1} />
              </button>
            </div>
          </div>

          <div className="space-y-4 p-4">
            <p className="text-sm leading-7 text-zinc-100">
              {draftDescription}
            </p>

            <div className="flex flex-wrap gap-2">
              {refineSuggestions.map((suggestion) => (
                <button
                  key={suggestion.label}
                  type="button"
                  onClick={() => {
                    setRevisionInstruction(suggestion.instruction);
                    setEditingRevision(true);
                  }}
                  className="rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-100 transition-colors hover:border-red-400/55 hover:bg-red-500/15"
                >
                  {suggestion.label}
                </button>
              ))}
            </div>

            {editingRevision && (
              <div className="flex flex-col gap-2 rounded border border-red-500/25 bg-[#101417]/80 p-2 sm:flex-row sm:items-center">
                <div className="flex min-h-10 flex-1 items-center gap-2 rounded bg-black/20 px-3">
                  <WandSparkles className="h-4 w-4 shrink-0 text-red-300" />
                  <input
                    value={revisionInstruction}
                    onChange={(event) => setRevisionInstruction(event.target.value)}
                    onKeyDown={handleRevisionKeyDown}
                    placeholder="Improve tone, shorten, make more emotional..."
                    disabled={loading}
                    className="h-10 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500 disabled:text-zinc-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void reviseDescription()}
                  disabled={!revisionInstruction.trim() || loading}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded bg-[#e63946] px-4 text-sm font-bold text-white transition-colors hover:bg-red-500 disabled:bg-zinc-700 disabled:text-zinc-500"
                >
                  <WandSparkles className="h-4 w-4" />
                  {loading ? 'Refining...' : 'Refine'}
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-red-500/15 pt-3">
              <button
                type="button"
                onClick={() => setEditingRevision((current) => !current)}
                className="inline-flex h-9 items-center justify-center gap-2 rounded border border-red-500/25 bg-red-500/10 px-3 text-xs font-bold text-red-100 transition-colors hover:border-red-400/55 hover:bg-red-500/15"
              >
                <FilePenLine className="h-3.5 w-3.5" strokeWidth={2.1} /> Edit
              </button>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={approveDescription}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded bg-[#e63946] px-3 text-xs font-bold text-white transition-colors hover:bg-red-500"
                >
                  <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2.1} /> Approve
                </button>
                <button
                  type="button"
                  onClick={cancelAiResult}
                  className="inline-flex h-9 items-center justify-center rounded border border-[#343d43] bg-[#171d21] px-3 text-xs font-bold text-zinc-300 transition-colors hover:border-red-500/70 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-[#ff8aa0]">
          {error}
        </div>
      )}
    </div>
  );
}
