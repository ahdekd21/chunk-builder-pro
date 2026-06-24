import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "promptkit";
const SIGN_EXPIRY = 3600;
const cache = new Map<string, { url: string; expires: number }>();

function extractPath(input: string): string {
  // If already a bare path (no slash-protocol), return as-is
  if (!/^https?:\/\//.test(input)) return input;
  // Match .../<bucket>/<path>
  const m = input.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/[^/]+\/(.+?)(?:\?|$)/);
  return m ? decodeURIComponent(m[1]) : input;
}

async function getSignedUrl(stored: string): Promise<string> {
  const path = extractPath(stored);
  const now = Date.now();
  const hit = cache.get(path);
  if (hit && hit.expires > now + 30_000) return hit.url;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGN_EXPIRY);
  if (error || !data) throw error ?? new Error("sign failed");
  cache.set(path, { url: data.signedUrl, expires: now + SIGN_EXPIRY * 1000 });
  return data.signedUrl;
}

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
};

export function StorageImage({ src, ...rest }: Props) {
  const [resolved, setResolved] = useState<string | null>(() => {
    const path = extractPath(src);
    const hit = cache.get(path);
    return hit && hit.expires > Date.now() + 30_000 ? hit.url : null;
  });

  useEffect(() => {
    let cancelled = false;
    getSignedUrl(src)
      .then((u) => !cancelled && setResolved(u))
      .catch(() => !cancelled && setResolved(null));
    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!resolved) return <div {...(rest as any)} aria-hidden />;
  return <img {...rest} src={resolved} />;
}
