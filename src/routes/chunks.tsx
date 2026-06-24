import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus, Pencil, Trash2, X, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useChunks, useDeleteChunk, useUpsertChunk, uploadImage } from "@/lib/data";
import { SECTIONS, SECTION_META, PLATFORMS, type Section } from "@/lib/sections";
import { SectionBadge } from "@/components/SectionBadge";
import { StorageImage } from "@/components/StorageImage";
import { cn } from "@/lib/utils";
import type { Chunk } from "@/lib/types";

export const Route = createFileRoute("/chunks")({
  head: () => ({
    meta: [
      { title: "Chunks — Promptkit" },
      { name: "description", content: "프롬프트 청크 관리" },
    ],
  }),
  component: ChunksPage,
});

function ChunksPage() {
  const { data: chunks = [], isLoading } = useChunks();
  const [section, setSection] = useState<Section | "all">("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Chunk | null>(null);
  const [creating, setCreating] = useState(false);
  const del = useDeleteChunk();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return chunks.filter((c) => {
      if (section !== "all" && c.section !== section) return false;
      if (!q) return true;
      return (
        c.text.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)) ||
        (c.memo ?? "").toLowerCase().includes(q)
      );
    });
  }, [chunks, section, query]);

  const panelOpen = creating || !!editing;

  return (
    <div className="flex h-screen">
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 md:px-10 py-10">
          <header className="mb-8 flex items-end justify-between gap-6 flex-wrap">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Chunks</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                저장된 청크 {chunks.length}개
              </p>
            </div>
            <button
              onClick={() => {
                setEditing(null);
                setCreating(true);
              }}
              className="rounded-xl bg-foreground text-background px-4 py-2 text-sm font-medium inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> 새 Chunk
            </button>
          </header>

          <div className="mb-5 flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="텍스트, 태그, 메모 검색"
                className="w-full rounded-xl border border-border bg-card pl-9 pr-3 py-2 text-sm outline-none focus:border-border-strong"
              />
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-1.5">
            <SectionTab active={section === "all"} onClick={() => setSection("all")}>
              전체 <span className="ml-1 text-muted-foreground">{chunks.length}</span>
            </SectionTab>
            {SECTIONS.map((s) => {
              const count = chunks.filter((c) => c.section === s).length;
              return (
                <SectionTab
                  key={s}
                  active={section === s}
                  onClick={() => setSection(s)}
                >
                  <span
                    className="section-dot mr-1.5"
                    style={{ backgroundColor: SECTION_META[s].color }}
                  />
                  {SECTION_META[s].label}
                  <span className="ml-1 text-muted-foreground">{count}</span>
                </SectionTab>
              );
            })}
          </div>

          {isLoading ? (
            <div className="text-sm text-muted-foreground">불러오는 중…</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                {chunks.length === 0
                  ? "첫 청크를 추가해보세요."
                  : "조건에 맞는 청크가 없어요."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((c) => (
                <ChunkCard
                  key={c.id}
                  chunk={c}
                  onEdit={() => {
                    setCreating(false);
                    setEditing(c);
                  }}
                  onDelete={async () => {
                    if (!confirm("이 청크를 삭제할까요?")) return;
                    await del.mutateAsync(c.id);
                    toast.success("삭제됨");
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        className={cn(
          "shrink-0 border-l border-border bg-surface overflow-hidden transition-[width] duration-300 ease-out",
          panelOpen ? "w-full md:w-[440px]" : "w-0",
        )}
      >
        {panelOpen && (
          <ChunkForm
            key={editing?.id ?? "new"}
            chunk={editing}
            existing={chunks}
            onClose={() => {
              setEditing(null);
              setCreating(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

function SectionTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-[12.5px] transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card text-foreground/80 hover:border-border-strong",
      )}
    >
      {children}
    </button>
  );
}

function ChunkCard({
  chunk,
  onEdit,
  onDelete,
}: {
  chunk: Chunk;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-4 hover:border-border-strong transition-colors">
      <div className="flex items-start justify-between gap-2">
        <SectionBadge section={chunk.section} />
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <p className="mt-3 text-[13.5px] leading-relaxed font-mono break-words">
        {chunk.text}
      </p>
      {chunk.images.length > 0 && (
        <div className="mt-3 flex gap-1.5 overflow-x-auto">
          {chunk.images.slice(0, 4).map((url, i) => (
            <StorageImage
              key={i}
              src={url}
              alt=""
              className="h-14 w-14 object-cover rounded-md border border-border shrink-0 bg-muted"
            />
          ))}
        </div>
      )}
      {(chunk.tags.length > 0 || chunk.platforms.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1">
          {chunk.tags.map((t) => (
            <span
              key={t}
              className="text-[10.5px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
            >
              #{t}
            </span>
          ))}
          {chunk.platforms.map((p) => (
            <span
              key={p}
              className="text-[10.5px] text-foreground/70 border border-border px-1.5 py-0.5 rounded"
            >
              {p}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ChunkForm({
  chunk,
  existing,
  onClose,
}: {
  chunk: Chunk | null;
  existing: Chunk[];
  onClose: () => void;
}) {
  const [text, setText] = useState(chunk?.text ?? "");
  const [section, setSection] = useState<Section>(chunk?.section ?? "subject");
  const [tagsInput, setTagsInput] = useState((chunk?.tags ?? []).join(", "));
  const [platforms, setPlatforms] = useState<string[]>(chunk?.platforms ?? []);
  const [images, setImages] = useState<string[]>(chunk?.images ?? []);
  const [memo, setMemo] = useState(chunk?.memo ?? "");
  const [uploading, setUploading] = useState(false);
  const upsert = useUpsertChunk();

  const similar = useMemo(() => {
    const t = text.trim().toLowerCase();
    if (!t || t.length < 3) return [];
    return existing
      .filter((c) => c.id !== chunk?.id && c.text.toLowerCase().includes(t))
      .slice(0, 3);
  }, [text, existing, chunk]);

  const onSave = async () => {
    if (!text.trim()) {
      toast.error("텍스트를 입력해주세요");
      return;
    }
    await upsert.mutateAsync({
      id: chunk?.id,
      text: text.trim(),
      section,
      tags: tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      platforms,
      images,
      memo: memo.trim() || null,
    });
    toast.success(chunk ? "수정됨" : "추가됨");
    onClose();
  };

  const onFile = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map(uploadImage));
      setImages((prev) => [...prev, ...urls]);
    } catch (e) {
      toast.error("업로드 실패");
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold">
          {chunk ? "Chunk 편집" : "새 Chunk"}
        </h2>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 hover:bg-accent text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <Field label="텍스트">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="예: golden hour backlight"
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-mono outline-none focus:border-border-strong resize-none"
          />
          {similar.length > 0 && (
            <div className="mt-2 rounded-lg border border-section-mood/40 bg-section-mood/10 p-2.5 text-[12px]">
              <p className="text-foreground/80 mb-1">비슷한 청크가 이미 있어요:</p>
              <ul className="space-y-0.5 text-muted-foreground">
                {similar.map((c) => (
                  <li key={c.id} className="truncate">
                    · {c.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Field>

        <Field label="Section">
          <div className="grid grid-cols-3 gap-1.5">
            {SECTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSection(s)}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-[11.5px] inline-flex items-center justify-center gap-1.5 transition-colors",
                  section === s
                    ? "border-foreground bg-foreground/5"
                    : "border-border hover:border-border-strong",
                )}
              >
                <span
                  className="section-dot"
                  style={{ backgroundColor: SECTION_META[s].color }}
                />
                {SECTION_META[s].label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="태그 (쉼표로 구분)">
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="cinematic, dramatic"
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-border-strong"
          />
        </Field>

        <Field label="플랫폼 호환 (체크 안 하면 전체)">
          <div className="flex flex-wrap gap-1.5">
            {PLATFORMS.filter((p) => p.value !== "universal").map((p) => {
              const on = platforms.includes(p.value);
              return (
                <button
                  key={p.value}
                  onClick={() =>
                    setPlatforms((prev) =>
                      on ? prev.filter((x) => x !== p.value) : [...prev, p.value],
                    )
                  }
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11.5px] transition-colors",
                    on
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-border-strong",
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="예시 이미지">
          <label className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-card/50 px-3 py-3 text-sm text-muted-foreground cursor-pointer hover:border-border-strong">
            <Upload className="h-4 w-4" />
            {uploading ? "업로드 중…" : "이미지 추가"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => onFile(e.target.files)}
            />
          </label>
          {images.length > 0 && (
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {images.map((url) => (
                <div key={url} className="relative group">
                  <img
                    src={url}
                    alt=""
                    className="aspect-square w-full object-cover rounded-md border border-border"
                  />
                  <button
                    onClick={() => setImages((p) => p.filter((u) => u !== url))}
                    className="absolute top-1 right-1 rounded-full bg-background/90 p-0.5 opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Field>

        <Field label="메모 (선택)">
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={2}
            placeholder="언제 잘 어울리는지 등"
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-border-strong resize-none"
          />
        </Field>
      </div>

      <div className="border-t border-border px-5 py-4 flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-accent"
        >
          취소
        </button>
        <button
          onClick={onSave}
          disabled={upsert.isPending}
          className="flex-1 rounded-xl bg-foreground text-background px-3 py-2 text-sm font-medium disabled:opacity-60"
        >
          {upsert.isPending ? "저장 중…" : "저장"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 block">
        {label}
      </label>
      {children}
    </div>
  );
}
