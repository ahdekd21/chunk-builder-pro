import type { Section, Platform } from "./sections";

export interface Chunk {
  id: string;
  text: string;
  section: Section;
  tags: string[];
  platforms: string[]; // empty = universal
  images: string[];
  memo: string | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface PromptSectionState {
  chunkIds: string[];
  overrideText?: string;
}

export type PromptSetSections = Partial<Record<Section, PromptSectionState>>;

export interface PromptSet {
  id: string;
  title: string;
  platform: Platform;
  sections: PromptSetSections;
  compiled_text: string;
  result_images: string[];
  created_at: string;
  updated_at: string;
}
