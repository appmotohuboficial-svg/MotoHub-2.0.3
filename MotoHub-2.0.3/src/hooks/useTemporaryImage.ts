import { useCallback, useEffect, useRef, useState } from 'react';
import { removeTemporaryImage, retainTemporaryImage } from '../services/temporaryImages';

export function useTemporaryImage() {
  const [uri, setUri] = useState<string | null>(null);
  const mounted = useRef(true);
  const release = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; release.current?.(); release.current = undefined; };
  }, []);
  const select = useCallback((next: string | null) => {
    if (!mounted.current) { if (next) void removeTemporaryImage(next); return; }
    const nextRelease = next ? retainTemporaryImage(next) : undefined;
    release.current?.();
    release.current = nextRelease;
    setUri(next);
  }, []);
  return [uri, select] as const;
}
