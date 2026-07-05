'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import type { AuthState } from './actions';

interface AuthFormProps {
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  title: string;
  subtitle: string;
  submitLabel: string;
  footer: { text: string; linkLabel: string; href: string };
  /** "new-password" en signup, "current-password" en login. */
  passwordAutoComplete: 'new-password' | 'current-password';
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Procesando…' : label}
    </Button>
  );
}

export function AuthForm({
  action,
  title,
  subtitle,
  submitLabel,
  footer,
  passwordAutoComplete,
}: AuthFormProps) {
  const [state, formAction] = useActionState<AuthState, FormData>(action, {});

  return (
    <div className="flex flex-col gap-6 rounded-card border border-border bg-surface p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <Input
          label="Correo"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tucorreo@ejemplo.com"
          required
        />
        <Input
          label="Contraseña"
          name="password"
          type="password"
          autoComplete={passwordAutoComplete}
          placeholder="••••••••"
          minLength={8}
          required
        />

        {state.error && (
          <p className="text-sm text-danger" role="alert">
            {state.error}
          </p>
        )}
        {state.message && (
          <p className="text-sm text-accent" role="status">
            {state.message}
          </p>
        )}

        <SubmitButton label={submitLabel} />
      </form>

      <p className="text-center text-sm text-muted">
        {footer.text}{' '}
        <Link href={footer.href} className="font-medium text-accent hover:text-accent-hover">
          {footer.linkLabel}
        </Link>
      </p>
    </div>
  );
}
