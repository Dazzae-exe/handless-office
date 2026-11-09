export function friendlyError(error: { code?: string; message: string }): Error {
  if (error.code === '23505') {
    return new Error('Ya existe un post con ese slug. Elige otro en Ajustes.');
  }
  return new Error(error.message);
}
