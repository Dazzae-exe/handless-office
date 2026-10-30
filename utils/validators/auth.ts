/** Validaciones compartidas para los formularios de autenticación. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email) return 'El correo es obligatorio.';
  if (!EMAIL_RE.test(email)) return 'Ingresa un correo válido.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'La contraseña es obligatoria.';
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  return null;
}
