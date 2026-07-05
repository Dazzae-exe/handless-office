'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { validateEmail, validatePassword } from '@/lib/validators/auth';

export interface AuthState {
  error?: string;
  message?: string;
}

async function getOrigin() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  const h = await headers();
  return h.get('origin') ?? `https://${h.get('host')}`;
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  const emailError = validateEmail(email);
  if (emailError) return { error: emailError };
  if (!password) return { error: 'La contraseña es obligatoria.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: 'Correo o contraseña incorrectos.' };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  const emailError = validateEmail(email);
  if (emailError) return { error: emailError };
  const passwordError = validatePassword(password);
  if (passwordError) return { error: passwordError };

  const supabase = await createClient();
  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });

  if (error) {
    return { error: error.message };
  }

  // Si la confirmación por correo está activada, identities viene vacío cuando
  // el correo ya existe (Supabase no revela si la cuenta ya está registrada).
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { error: 'Ese correo ya está registrado. Intenta iniciar sesión.' };
  }

  // Sesión inmediata (confirmación de correo desactivada) → al dashboard.
  if (data.session) {
    revalidatePath('/', 'layout');
    redirect('/');
  }

  return {
    message: 'Revisa tu correo para confirmar tu cuenta y completar el registro.',
  };
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
