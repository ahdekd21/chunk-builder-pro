import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Copy, Plus, Search, X, Check, Save, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import {
  useChunks,
  usePromptSets,
  useSavePromptSet,
} from "@/lib/data";
import {
  SECTIONS,
  SECTION_META,
  PLATFORMS,
  type Section,
  type Platform,
} from "@/lib/sections";
import { SectionBadge } from "@/components/SectionBadge";
import { StorageImage } from "@/components/StorageImage";
import { compilePrompt } from "@/lib/compile";
import { cn } from "@/lib/utils";
import type { Chunk, PromptSetSections } from "@/lib/types";

const searchSchema = z.object({
  from: z.string().optional(),
});

export const Route = createFileRoute("/builder")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Builder — Promptkit" },
      { name: "description", content: "프롬프트 조립" },
    ],
  }),
  component: BuilderPage,
});

function BuilderPage() {
  const { from } = Route.useSearch();
  const { data: chunks = [] } = useChunks();
  const { data: sets = [] } = usePromptSets();
  const save = useSavePromptSet();
  const navigate = useNavigate();

  const [sectionsState, setSectionsState] = useState<PromptSetSections>({});
  const [platform, setPlatform] = useState<Platform>("universal");
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [manualEdit, setManualEdit] = useState(false);
  const [manualText, setManualText] = useState("");
  const [title, setTitle] = useState("");
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveAsNew, setSaveAsNew] = useState(false);

  // Preload from existing set
  useEffect(() => {
    if (!from) return;
    const found = sets.find((s) => s.id === from);
    if (found) {
      setSectionsState(found.sections ?? {});
      setPlatform(found.platform as Platform);
      setTitle(found.title);
      setLoadedId(found.id);
    }
  }, [from, sets]);

  const chunkMap = useMemo(() => {
    const m = new Map<string, Chunk>();
    chunks.forEach((c) => m.set(c.id, c));
    return m;
  }, [chunks]);

  const compiled = useMemo(
    () => compilePrompt(sectionsState, chunkMap, platform),
    [sectionsState, chunkMap, platform],
  );

  const displayText = manualEdit ? manualText : compiled.prompt;

  useEffect(() => {
    if (!manualEdit) setManualText(compiled.prompt);
  }, [compiled.prompt, manualEdit]);

  const addChunk = (section: Section, chunkId: string) => {
    setSectionsState((prev) => {
      const cur = prev[section] ?? { chunkIds: [] };
      if (cur.chunkIds.includes(chunkId)) return prev;
      return {
        ...prev,
        [section]: { ...cur, chunkIds: [...cur.chunkIds, chunkId] },
      };
    });
  };
  const removeChunk = (section: Section, chunkId: string) => {
    setSectionsState((prev) => {
      const cur = prev[section];
      if (!cur) return prev;
      const next = cur.chunkIds.filter((id) => id !== chunkId);
      const copy = { ...prev };
      if (next.length === 0 && !cur.overrideText) delete copy[section];
      else copy[section] = { ...cur, chunkIds: next };
      return copy;
    });
  };
  const reorderChunk = (section: Section, from: number, to: number) => {
    setSectionsState((prev) => {
      const cur = prev[section];
      if (!cur) return prev;
      const ids = [...cur.chunkIds];
      const [m] = ids.splice(from, 1);
      ids.splice(to, 0, m);
      return { ...prev, [section]: { ...cur, chunkIds: ids } };
    });
  };

  const onSave = async () => {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요");
      return;
    }
    const useId = loadedId && !saveAsNew ? loadedId : undefined;
    const existing = useId ? sets.find((s) => s.id === useId) : undefined;
    await save.mutateAsync({
      id: useId,
      title: title.trim(),
      platform,
      sections: sectionsState,
      compiled_text: displayText,
      result_images: existing?.result_images ?? [],
    });
    toast.success(useId ? "덮어쓰기 완료" : "저장됨");
    setSaveOpen(false);
    navigate({ to: "/" });
  };

  const onReset = () => {
    if (!confirm("전체 초기화할까요?")) return;
    setSectionsState({});
    setManualEdit(false);
    setManualText("");
    setTitle("");
    setLoadedId(null);
    setSaveAsNew(false);
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1 min-w-0 overflow-y-auto pb-[180px]">
        <div className="mx-auto max-w-3xl px-6 md:px-10 py-10">
          <header className="mb-8 flex items-end justify-between gap-6 flex-wrap">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Builder</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {loadedId ? (
                  <>
                    <span className="text-foreground/80">{title || "(제목 없음)"}</span>
                    <span className="mx-1.5">·</span>편집 중
                  </>
                ) : (
                  "Section을 눌러 청크를 골라 조립하세요"
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onReset}
                className="rounded-xl border border-border bg-card px-3 py-2 text-sm hover:bg-accent"
              >
                초기화
              </button>
              <button
                onClick={() => setSaveOpen(true)}
                className="rounded-xl bg-foreground text-background px-4 py-2 text-sm font-medium inline-flex items-center gap-2"
              >
                <Save className="h-4 w-4" /> 저장
              </button>
            </div>
          </header>

          <div className="space-y-2.5">
            {SECTIONS.map((s) => (
              <SectionRow
                key={s}
                section={s}
                state={sectionsState[s]}
                chunkMap={chunkMap}
                active={activeSection === s}
                onOpen={() => setActiveSection(s)}
                onRemove={(id) => removeChunk(s, id)}
                onReorder={(from, to) => reorderChunk(s, from, to)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Chunk picker side panel */}
      <div
        className={cn(
          "shrink-0 border-l border-border bg-surface overflow-hidden transition-[width] duration-300 ease-out",
          activeSection ? "w-full md:w-[440px]" : "w-0",
        )}
      >
        {activeSection && (
          <ChunkPicker
            section={activeSection}
            setSection={setActiveSection}
            chunks={chunks}
            selectedIds={sectionsState[activeSection]?.chunkIds ?? []}
            onAdd={(id) => addChunk(activeSection, id)}
            onRemove={(id) => removeChunk(activeSection, id)}
            onClose={() => setActiveSection(null)}
          />
        )}
      </div>

      {/* Bottom compiled bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 md:left-56 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 md:px-10 py-3">
          <div className="flex items-center gap-3 mb-2">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs outline-none"
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <label className="text-xs text-muted-foreground inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={manualEdit}
                onChange={(e) => {
                  setManualEdit(e.target.checked);
                  if (e.target.checked) setManualText(compiled.prompt);
                }}
                className="accent-foreground"
              />
              직접 편집
            </label>
            <button
              onClick={() => {
                navigator.clipboard.writeText(displayText);
                toast.success("복사됨");
              }}
              className="ml-auto rounded-lg border border-border bg-card px-3 py-1 text-xs inline-flex items-center gap-1.5 hover:bg-accent"
            >
              <Copy className="h-3.5 w-3.5" /> 복사
            </button>
          </div>
          {manualEdit ? (
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-[13px] font-mono outline-none resize-none focus:border-border-strong"
            />
          ) : (
            <div className="rounded-lg border border-border bg-card px-3 py-2 text-[13px] font-mono leading-relaxed min-h-[3.5em] max-h-32 overflow-y-auto whitespace-pre-wrap break-words">
              {compiled.prompt || (
                <span className="text-muted-foreground">청크를 추가하면 여기에 프롬프트가 만들어져요</span>
              )}
            </div>
          )}
          {compiled.negativePrompt && (
            <div className="mt-2 rounded-lg border border-section-negative/30 bg-section-negative/5 px-3 py-1.5 text-[12px] font-mono">
              <span className="text-section-negative font-semibold mr-2">NEG</span>
              {compiled.negativePrompt}
            </div>
          )}
        </div>
      </div>

      {saveOpen && (
        <SaveDialog
          title={title}
          setTitle={setTitle}
          isUpdate={!!loadedId}
          saveAsNew={saveAsNew}
          setSaveAsNew={setSaveAsNew}
          onCancel={() => setSaveOpen(false)}
          onSave={onSave}
          pending={save.isPending}
        />
      )}
    </div>
  );
}

function SectionRow({
  section,
  state,
  chunkMap,
  active,
  onOpen,
  onRemove,
  onReorder,
}: {
  section: Section;
  state?: { chunkIds: string[]; overrideText?: string };
  chunkMap: Map<string, Chunk>;
  active: boolean;
  onOpen: () => void;
  onRemove: (id: string) => void;
  onReorder: (from: number, to: number) => void;
}) {
  const meta = SECTION_META[section];
  const ids = state?.chunkIds ?? [];
  const [drag, setDrag] = useState<number | null>(null);

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card transition-colors",
        active ? "border-foreground" : "border-border hover:border-border-strong",
      )}
    >
      <div className="flex items-center px-4 py-3 gap-3">
        <div className="w-28 shrink-0 flex items-center gap-2">
          <span className="section-dot" style={{ backgroundColor: meta.color }} />
          <div>
            <div className="text-[13px] font-medium">{meta.label}</div>
            <div className="text-[10.5px] text-muted-foreground">{meta.kr}</div>
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-wrap gap-1.5">
          {ids.length === 0 ? (
            <button
              onClick={onOpen}
              className="text-[12.5px] text-muted-foreground inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> 추가
            </button>
          ) : (
            <>
              {ids.map((id, idx) => {
                const c = chunkMap.get(id);
                if (!c) return null;
                return (
                  <span
                    key={id}
                    draggable
                    onDragStart={() => setDrag(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (drag !== null && drag !== idx) onReorder(drag, idx);
                      setDrag(null);
                    }}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] cursor-grab active:cursor-grabbing transition-all",
                      meta.bg,
                      meta.border,
                      "text-foreground",
                    )}
                  >
                    <span className="truncate max-w-[180px]">{c.text}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(id);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-[11.5px] text-muted-foreground hover:text-foreground hover:border-border-strong"
              >
                <Plus className="h-3 w-3" /> 더
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ChunkPicker({
  section,
  setSection,
  chunks,
  selectedIds,
  onAdd,
  onRemove,
  onClose,
}: {
  section: Section;
  setSection: (s: Section) => void;
  chunks: Chunk[];
  selectedIds: string[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return chunks
      .filter((c) => c.section === section)
      .filter(
        (c) =>
          !s ||
          c.text.toLowerCase().includes(s) ||
          c.tags.some((t) => t.toLowerCase().includes(s)),
      );
  }, [chunks, section, q]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <SectionBadge section={section} />
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-accent text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] transition-colors",
                s === section
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {SECTION_META[s].label}
            </button>
          ))}
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="청크 검색"
            className="w-full rounded-lg border border-border bg-card pl-8 pr-3 py-1.5 text-[13px] outline-none focus:border-border-strong"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {list.length === 0 ? (
          <div className="px-2 py-8 text-center text-[13px] text-muted-foreground">
            이 Section에 청크가 없어요. <br />
            <a href="/chunks" className="underline">Chunks</a>에서 추가하세요.
          </div>
        ) : (
          list.map((c) => {
            const on = selectedIds.includes(c.id);
            const open = expanded === c.id;
            return (
              <div
                key={c.id}
                className={cn(
                  "rounded-xl border bg-card transition-all",
                  on ? "border-foreground" : "border-border",
                )}
              >
                <div className="flex items-start gap-2 p-3">
                  <button
                    onClick={() => setExpanded(open ? null : c.id)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <p className="text-[13px] font-mono leading-relaxed break-words">
                      {c.text}
                    </p>
                    {(c.tags.length > 0 || c.images.length > 0) && (
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[10.5px] text-muted-foreground">
                        {c.images.length > 0 && (
                          <span className="inline-flex items-center gap-0.5">
                            <ImageIcon className="h-3 w-3" /> {c.images.length}
                          </span>
                        )}
                        {c.tags.slice(0, 3).map((t) => (
                          <span key={t}>#{t}</span>
                        ))}
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => (on ? onRemove(c.id) : onAdd(c.id))}
                    className={cn(
                      "shrink-0 rounded-lg px-2.5 py-1 text-[11.5px] font-medium inline-flex items-center gap-1 transition-colors",
                      on
                        ? "bg-foreground text-background"
                        : "border border-border hover:bg-accent",
                    )}
                  >
                    {on ? <><Check className="h-3 w-3" /> 선택됨</> : <><Plus className="h-3 w-3" /> 추가</>}
                  </button>
                </div>
                {open && c.images.length > 0 && (
                  <div className="border-t border-border p-3">
                    <div className="grid grid-cols-3 gap-1.5">
                      {c.images.map((url) => (
                        <StorageImage
                          key={url}
                          src={url}
                          alt=""
                          className="aspect-square w-full object-cover rounded-md border border-border bg-muted"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function SaveDialog({
  title,
  setTitle,
  isUpdate,
  saveAsNew,
  setSaveAsNew,
  onCancel,
  onSave,
  pending,
}: {
  title: string;
  setTitle: (s: string) => void;
  isUpdate: boolean;
  saveAsNew: boolean;
  setSaveAsNew: (b: boolean) => void;
  onCancel: () => void;
  onSave: () => void;
  pending: boolean;
}) {
  const label = isUpdate && !saveAsNew ? "덮어쓰기" : "저장";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/20 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6">
        <h3 className="text-base font-semibold mb-1">프롬프트 세트 저장</h3>
        <p className="text-[12.5px] text-muted-foreground mb-5">
          Library에서 다시 꺼내볼 수 있어요.
        </p>
        <label className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 block">
          제목
        </label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave();
          }}
          placeholder="예: 황금시간 인물 클로즈업"
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-border-strong"
        />
        {isUpdate && (
          <label className="mt-4 flex items-center gap-2 text-[12.5px] text-foreground/80 cursor-pointer">
            <input
              type="checkbox"
              checked={saveAsNew}
              onChange={(e) => setSaveAsNew(e.target.checked)}
              className="accent-foreground"
            />
            새 세트로 저장 (원본 유지)
          </label>
        )}
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm hover:bg-accent"
          >
            취소
          </button>
          <button
            onClick={onSave}
            disabled={pending}
            className="flex-1 rounded-xl bg-foreground text-background px-3 py-2 text-sm font-medium disabled:opacity-60"
          >
            {pending ? "저장 중…" : label}
          </button>
        </div>
      </div>
    </div>
  );
}
