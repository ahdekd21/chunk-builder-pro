export const SECTIONS = [
  "subject",
  "action",
  "space",
  "camera",
  "light",
  "mood",
  "style",
  "technical",
  "negative",
] as const;

export type Section = (typeof SECTIONS)[number];

export const SECTION_META: Record<
  Section,
  { label: string; kr: string; hint: string; color: string; bg: string; text: string; border: string }
> = {
  subject: {
    label: "Subject",
    kr: "피사체",
    hint: "외형, 정체성",
    color: "var(--section-subject)",
    bg: "bg-[color:var(--section-subject)]/10",
    text: "text-[color:var(--section-subject)]",
    border: "border-[color:var(--section-subject)]/30",
  },
  action: {
    label: "Action",
    kr: "행동",
    hint: "포즈, 표정",
    color: "var(--section-action)",
    bg: "bg-[color:var(--section-action)]/10",
    text: "text-[color:var(--section-action)]",
    border: "border-[color:var(--section-action)]/30",
  },
  space: {
    label: "Space",
    kr: "공간",
    hint: "배경, 환경",
    color: "var(--section-space)",
    bg: "bg-[color:var(--section-space)]/10",
    text: "text-[color:var(--section-space)]",
    border: "border-[color:var(--section-space)]/30",
  },
  camera: {
    label: "Camera",
    kr: "카메라",
    hint: "구도, 렌즈, 앵글",
    color: "var(--section-camera)",
    bg: "bg-[color:var(--section-camera)]/10",
    text: "text-[color:var(--section-camera)]",
    border: "border-[color:var(--section-camera)]/30",
  },
  light: {
    label: "Light",
    kr: "조명",
    hint: "광원, 시간대",
    color: "var(--section-light)",
    bg: "bg-[color:var(--section-light)]/15",
    text: "text-[color:var(--section-light)]",
    border: "border-[color:var(--section-light)]/40",
  },
  mood: {
    label: "Mood",
    kr: "분위기",
    hint: "감정, 톤",
    color: "var(--section-mood)",
    bg: "bg-[color:var(--section-mood)]/10",
    text: "text-[color:var(--section-mood)]",
    border: "border-[color:var(--section-mood)]/30",
  },
  style: {
    label: "Style",
    kr: "스타일",
    hint: "아티스트, 매체",
    color: "var(--section-style)",
    bg: "bg-[color:var(--section-style)]/10",
    text: "text-[color:var(--section-style)]",
    border: "border-[color:var(--section-style)]/30",
  },
  technical: {
    label: "Technical",
    kr: "기술 파라미터",
    hint: "비율, 시드, 버전",
    color: "var(--section-technical)",
    bg: "bg-[color:var(--section-technical)]/10",
    text: "text-[color:var(--section-technical)]",
    border: "border-[color:var(--section-technical)]/30",
  },
  negative: {
    label: "Negative",
    kr: "제외",
    hint: "원하지 않는 요소",
    color: "var(--section-negative)",
    bg: "bg-[color:var(--section-negative)]/10",
    text: "text-[color:var(--section-negative)]",
    border: "border-[color:var(--section-negative)]/30",
  },
};

export const PLATFORMS = [
  { value: "universal", label: "Universal" },
  { value: "midjourney", label: "Midjourney" },
  { value: "stable-diffusion", label: "Stable Diffusion" },
  { value: "dalle", label: "DALL·E" },
  { value: "firefly", label: "Firefly" },
] as const;

export type Platform = (typeof PLATFORMS)[number]["value"];
