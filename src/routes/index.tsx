import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Copy, Trash2, Hammer, X, Upload, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  usePromptSets,
  useDeletePromptSet,
  useUpdatePromptSetMeta,
  uploadImage,
} from "@/lib/data";
import { SECTIONS, PLATFORMS } from "@/lib/sections";
import { SectionBadge } from "@/components/SectionBadge";
import { StorageImage } from "@/components/StorageImage";
import { cn } from "@/lib/utils";
import type { PromptSet } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Library — Promptkit" },
      { name: "description", content: "저장된 프롬프트 세트 모음" },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const { data: sets = [], isLoading } = usePromptSets();
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const navigate = useNavigate();
  const del = useDeletePromptSet();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sets.filter((s) => {
      if (platform !== "all" && s.platform !== platform) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.compiled_text.toLowerCase().includes(q)
      );
    });
  }, [sets, query, platform]);

  const selected = selectedId ? sets.find((s) => s.id === selectedId) ?? null : null;

  return (
    <div className="flex h-screen md:h-screen">
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 md:px-10 py-10">
          <header className="mb-8 flex items-end justify-between gap-6 flex-wrap">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                저장된 프롬프트 세트 {sets.length}개
              </p>
            </div>
            <button
              onClick={() => navigate({ to: "/builder" })}
              className="rounded-xl bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              + 새 프롬프트 만들기
            </button>
          </header>

          <div className="mb-6 flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="제목 또는 프롬프트 검색"
                className="w-full rounded-xl border border-border bg-card pl-9 pr-3 py-2 text-sm outline-none focus:border-border-strong transition-colors"
              />
            </div>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-border-strong"
            >
              <option value="all">전체 플랫폼</option>
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="text-sm text-muted-foreground">불러오는 중…</div>
          ) : filtered.length === 0 ? (
            <EmptyState onCreate={() => navigate({ to: "/builder" })} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((s) => (
                <SetCard
                  key={s.id}
                  set={s}
                  selected={s.id === selectedId}
                  onClick={() => setSelectedId(s.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Slide-in detail panel (flex push) */}
      <div
        className={cn(
          "shrink-0 border-l border-border bg-surface overflow-hidden transition-[width] duration-300 ease-out",
          selected ? "w-full md:w-[420px]" : "w-0",
        )}
      >
        {selected && (
          <DetailPanel
            set={selected}
            onClose={() => setSelectedId(null)}
            onDelete={async () => {
              if (!confirm("이 프롬프트 세트를 삭제할까요?")) return;
              await del.mutateAsync(selected.id);
              setSelectedId(null);
              toast.success("삭제됨");
            }}
            onBuildFrom={() =>
              navigate({ to: "/builder", search: { from: selected.id } })
            }
          />
        )}
      </div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
      <p className="text-sm text-muted-foreground">아직 저장된 프롬프트 세트가 없어요.</p>
      <button
        onClick={onCreate}
        className="mt-4 rounded-xl bg-foreground text-background px-4 py-2 text-sm font-medium"
      >
        Builder 열기
      </button>
    </div>
  );
}

function SetCard({
  set,
  selected,
  onClick,
}: {
  set: PromptSet;
  selected: boolean;
  onClick: () => void;
}) {
  const usedSections = SECTIONS.filter((s) => {
    const st = set.sections?.[s];
    return st && (st.chunkIds?.length || st.overrideText);
  });
  const hero = set.result_images?.[0];
  return (
    <button
      onClick={onClick}
      className={cn(
        "group text-left rounded-2xl border bg-card overflow-hidden transition-colors hover:border-border-strong",
        selected ? "border-foreground" : "border-border",
      )}
    >
      {hero ? (
        <div className="aspect-[4/3] bg-muted overflow-hidden">
          <img src={hero} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="aspect-[4/3] bg-muted/40 p-4 text-[11px] leading-relaxed text-muted-foreground overflow-hidden">
          <p className="line-clamp-6">{set.compiled_text || "(빈 프롬프트)"}</p>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium truncate">{set.title || "Untitled"}</h3>
          <span className="text-[11px] text-muted-foreground shrink-0">
            {new Date(set.created_at).toLocaleDateString()}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {usedSections.slice(0, 4).map((s) => (
            <SectionBadge key={s} section={s} size="xs" />
          ))}
          {usedSections.length > 4 && (
            <span className="text-[10px] text-muted-foreground self-center">
              +{usedSections.length - 4}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function DetailPanel({
  set,
  onClose,
  onDelete,
  onBuildFrom,
}: {
  set: PromptSet;
  onClose: () => void;
  onDelete: () => void;
  onBuildFrom: () => void;
}) {
  const update = useUpdatePromptSetMeta();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(set.title);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setTitleDraft(set.title);
    setEditingTitle(false);
  }, [set.id, set.title]);

  const saveTitle = async () => {
    const t = titleDraft.trim();
    if (!t || t === set.title) {
      setEditingTitle(false);
      setTitleDraft(set.title);
      return;
    }
    await update.mutateAsync({ id: set.id, title: t });
    setEditingTitle(false);
    toast.success("제목 변경됨");
  };

  const onFile = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map(uploadImage));
      await update.mutateAsync({
        id: set.id,
        result_images: [...(set.result_images ?? []), ...urls],
      });
      toast.success("이미지 추가됨");
    } catch (e) {
      toast.error("업로드 실패");
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (url: string) => {
    await update.mutateAsync({
      id: set.id,
      result_images: (set.result_images ?? []).filter((u) => u !== url),
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border gap-2">
        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveTitle();
              if (e.key === "Escape") {
                setEditingTitle(false);
                setTitleDraft(set.title);
              }
            }}
            onBlur={saveTitle}
            className="flex-1 min-w-0 rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:border-border-strong"
          />
        ) : (
          <button
            onClick={() => setEditingTitle(true)}
            className="group flex items-center gap-1.5 min-w-0 text-left"
          >
            <h2 className="text-sm font-semibold truncate">{set.title}</h2>
            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
          </button>
        )}
        <button
          onClick={onClose}
          className="rounded-md p-1.5 hover:bg-accent text-muted-foreground shrink-0"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              결과 이미지
            </p>
            <label className="text-[11px] text-muted-foreground inline-flex items-center gap-1 cursor-pointer hover:text-foreground">
              <Upload className="h-3 w-3" />
              {uploading ? "업로드 중…" : "추가"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => onFile(e.target.files)}
              />
            </label>
          </div>
          {set.result_images?.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {set.result_images.map((url) => (
                <div key={url} className="relative group">
                  <img
                    src={url}
                    alt=""
                    className="aspect-square w-full object-cover rounded-lg border border-border"
                  />
                  <button
                    onClick={() => removeImage(url)}
                    className="absolute top-1.5 right-1.5 rounded-full bg-background/90 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border py-6 text-center text-[12px] text-muted-foreground">
              생성한 이미지를 올려서 함께 보관하세요
            </div>
          )}
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
            플랫폼
          </p>
          <p className="text-sm">{set.platform}</p>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
            구성
          </p>
          <div className="space-y-3">
            {SECTIONS.map((s) => {
              const st = set.sections?.[s];
              if (!st || (!st.chunkIds?.length && !st.overrideText)) return null;
              return (
                <div key={s} className="rounded-xl border border-border p-3">
                  <SectionBadge section={s} />
                  <p className="mt-2 text-[13px] leading-relaxed text-foreground/90">
                    {st.overrideText ??
                      st.chunkIds.length + "개 청크 선택됨"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
            최종 프롬프트
          </p>
          <div className="rounded-xl border border-border bg-card p-3 text-[13px] leading-relaxed font-mono whitespace-pre-wrap break-words">
            {set.compiled_text}
          </div>
        </div>
      </div>

      <div className="border-t border-border px-5 py-4 flex items-center gap-2">
        <button
          onClick={() => {
            navigator.clipboard.writeText(set.compiled_text);
            toast.success("복사됨");
          }}
          className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-accent"
        >
          <Copy className="h-4 w-4" /> 복사
        </button>
        <button
          onClick={onBuildFrom}
          className="flex-1 rounded-xl bg-foreground text-background px-3 py-2 text-sm font-medium inline-flex items-center justify-center gap-2"
        >
          <Hammer className="h-4 w-4" /> 빌드
        </button>
        <button
          onClick={onDelete}
          className="rounded-xl border border-border p-2 text-muted-foreground hover:text-destructive hover:border-destructive/40"
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
