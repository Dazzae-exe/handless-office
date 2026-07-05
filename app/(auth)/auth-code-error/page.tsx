import Link from 'next/link';
import { Button } from '@/components/common/Button';

export default function AuthCodeErrorPage() {
  return (
    <div className="flex flex-col gap-6 rounded-card border border-border bg-surface p-6 text-center">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-foreground">
          No pudimos confirmar tu enlace
        </h2>
        <p className="text-sm text-muted">
          El enlace es inválido o ya expiró. Intenta iniciar sesión o solicitar uno nuevo.
        </p>
      </div>
      <Link href="/login">
        <Button className="w-full">Volver al inicio de sesión</Button>
      </Link>
    </div>
  );
}
