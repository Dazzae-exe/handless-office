'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Runner compartido para las mutaciones del CRUD (posts, proyectos). Ejecuta
 * la operación con estados `pending`/`error` y llama a `router.refresh()` al
 * terminar para revalidar los Server Components que cargaron los datos.
 *
 * Devuelve el resultado de la operación o `null` si falló (el mensaje queda
 * en `error` para mostrarlo inline).
 */
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
