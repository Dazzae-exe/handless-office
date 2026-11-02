'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useMutationRunner() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async <T>(op: () => Promise<T>): Promise<T | null> => {
      setPending(true);
      setError(null);
      try {
        const result = await op();
        // Revalida los Server Components que cargaron los datos.
        router.refresh();
        return result;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Algo salió mal. Intenta de nuevo.');
        return null;
      } finally {
        setPending(false);
      }
    },
    [router]
  );

  return { run, pending, error };
}
