import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Chunk, PromptSet } from "@/lib/types";
import type { Section } from "@/lib/sections";

const CHUNKS_KEY = ["chunks"] as const;
const SETS_KEY = ["prompt_sets"] as const;

export function useChunks() {
  return useQuery({
    queryKey: CHUNKS_KEY,
    queryFn: async (): Promise<Chunk[]> => {
      const { data, error } = await supabase
        .from("chunks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Chunk[];
    },
  });
}

export function useUpsertChunk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      text: string;
      section: Section;
      tags: string[];
      platforms: string[];
      images: string[];
      memo: string | null;
    }) => {
      if (input.id) {
        const { error } = await supabase
          .from("chunks")
          .update({
            text: input.text,
            section: input.section,
            tags: input.tags,
            platforms: input.platforms,
            images: input.images,
            memo: input.memo,
          })
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("chunks").insert({
          text: input.text,
          section: input.section,
          tags: input.tags,
          platforms: input.platforms,
          images: input.images,
          memo: input.memo,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CHUNKS_KEY }),
  });
}

export function useDeleteChunk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chunks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CHUNKS_KEY }),
  });
}

export function usePromptSets() {
  return useQuery({
    queryKey: SETS_KEY,
    queryFn: async (): Promise<PromptSet[]> => {
      const { data, error } = await supabase
        .from("prompt_sets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PromptSet[];
    },
  });
}

export function useSavePromptSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      title: string;
      platform: string;
      sections: PromptSet["sections"];
      compiled_text: string;
      result_images: string[];
    }): Promise<{ id: string }> => {
      if (input.id) {
        const { data, error } = await supabase
          .from("prompt_sets")
          .update({
            title: input.title,
            platform: input.platform,
            sections: input.sections as never,
            compiled_text: input.compiled_text,
            result_images: input.result_images,
          })
          .eq("id", input.id)
          .select("id")
          .single();
        if (error) throw error;
        return { id: data.id as string };
      } else {
        const { data, error } = await supabase
          .from("prompt_sets")
          .insert({
            title: input.title,
            platform: input.platform,
            sections: input.sections as never,
            compiled_text: input.compiled_text,
            result_images: input.result_images,
          })
          .select("id")
          .single();
        if (error) throw error;
        return { id: data.id as string };
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SETS_KEY }),
  });
}

export function useUpdatePromptSetMeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      title?: string;
      result_images?: string[];
    }) => {
      const patch: Record<string, unknown> = {};
      if (input.title !== undefined) patch.title = input.title;
      if (input.result_images !== undefined) patch.result_images = input.result_images;
      const { error } = await supabase
        .from("prompt_sets")
        .update(patch)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SETS_KEY }),
  });
}

export function useDeletePromptSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("prompt_sets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SETS_KEY }),
  });
}

export async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("promptkit").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("promptkit").getPublicUrl(path);
  return data.publicUrl;
}
