/** Extrae mensaje legible de respuestas de error HTTP del API Laravel. */
export function apiErrorMessage(err: unknown): string {
  const e = err as {
    error?:
      | { message?: string; errors?: Record<string, string[] | string> }
      | string;
    message?: string;
  };

  if (typeof e?.error === 'string' && e.error) {
    return e.error;
  }

  const body = e?.error as { message?: string; errors?: Record<string, string[] | string> } | undefined;
  if (body?.message && typeof body.message === 'string') {
    return body.message;
  }

  if (body?.errors) {
    for (const v of Object.values(body.errors)) {
      if (Array.isArray(v) && v.length > 0) return String(v[0]);
      if (typeof v === 'string' && v) return v;
    }
  }

  if (typeof e?.message === 'string' && e.message) {
    return e.message;
  }

  return 'Error de conexión o del servidor.';
}
