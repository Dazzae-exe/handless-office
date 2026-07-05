import type { Metadata } from 'next';
import { AuthForm } from '../AuthForm';
import { login } from '../actions';

export const metadata: Metadata = {
  title: 'Iniciar sesión · Blog Dashboard',
};

export default function LoginPage() {
  return (
    <AuthForm
      action={login}
      title="Iniciar sesión"
      subtitle="Accede a tu panel para gestionar posts y proyectos."
      submitLabel="Entrar"
      passwordAutoComplete="current-password"
      footer={{
        text: '¿No tienes cuenta?',
        linkLabel: 'Crear una',
        href: '/signup',
      }}
    />
  );
}
