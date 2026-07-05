import type { Metadata } from 'next';
import { AuthForm } from '../AuthForm';
import { signup } from '../actions';

export const metadata: Metadata = {
  title: 'Crear cuenta · Blog Dashboard',
};

export default function SignupPage() {
  return (
    <AuthForm
      action={signup}
      title="Crear cuenta"
      subtitle="Regístrate para empezar a publicar."
      submitLabel="Registrarme"
      passwordAutoComplete="new-password"
      footer={{
        text: '¿Ya tienes cuenta?',
        linkLabel: 'Iniciar sesión',
        href: '/login',
      }}
    />
  );
}
