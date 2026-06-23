import { cn } from "@/lib/utils";
import { SECTION_META, type Section } from "@/lib/sections";

export function SectionBadge({
  section,
  className,
  size = "sm",
}: {
  section: Section;
  className?: string;
  size?: "xs" | "sm";
}) {
  const m = SECTION_META[section];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        m.bg,
        m.text,
        m.border,
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
        className,
      )}
    >
      <span
        className="section-dot"
        style={{ backgroundColor: m.color }}
      />
      {m.label}
    </span>
  );
}
