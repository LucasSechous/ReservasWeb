// Cloudflare Turnstile. Solo se exige si están cargadas las claves; sin claves la reserva
// sigue funcionando (protegida igual por el límite de reservas activas en la base).
export function captchaActivo(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verificarCaptcha(token: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  try {
    const respuesta = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({ secret, response: token }),
      },
    );
    const resultado: { success?: boolean } = await respuesta.json();
    return resultado.success === true;
  } catch {
    return false;
  }
}
