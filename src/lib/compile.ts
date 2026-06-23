import { SECTIONS, type Section, type Platform } from "./sections";
import type { Chunk, PromptSetSections } from "./types";

// Build order: everything except technical (which always trails), and negative is special
const BODY_ORDER: Section[] = [
  "subject",
  "action",
  "space",
  "camera",
  "light",
  "mood",
  "style",
];

export interface CompileResult {
  prompt: string;
  negativePrompt?: string; // only for stable-diffusion
}

export function compilePrompt(
  sections: PromptSetSections,
  chunkMap: Map<string, Chunk>,
  platform: Platform,
): CompileResult {
  const resolveSection = (s: Section): string[] => {
    const state = sections[s];
    if (!state) return [];
    if (state.overrideText !== undefined) {
      return state.overrideText.trim() ? [state.overrideText.trim()] : [];
    }
    return state.chunkIds
      .map((id) => chunkMap.get(id)?.text.trim())
      .filter((t): t is string => !!t);
  };

  const bodyParts: string[] = [];
  for (const s of BODY_ORDER) {
    const items = resolveSection(s);
    if (items.length) bodyParts.push(items.join(" "));
  }

  const technical = resolveSection("technical");
  const negative = resolveSection("negative");

  let prompt = bodyParts.join(", ");
  if (technical.length) {
    prompt = prompt ? `${prompt}, ${technical.join(" ")}` : technical.join(" ");
  }

  let negativePrompt: string | undefined;
  if (negative.length) {
    const negText = negative.join(" ");
    switch (platform) {
      case "midjourney":
        prompt = prompt ? `${prompt} --no ${negText}` : `--no ${negText}`;
        break;
      case "stable-diffusion":
        negativePrompt = negText;
        break;
      case "dalle":
        // ignore
        break;
      default:
        prompt = prompt ? `${prompt}, ${negText}` : negText;
    }
  }

  return { prompt, negativePrompt };
}

export { SECTIONS };
