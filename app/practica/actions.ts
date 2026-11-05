'use server'

export async function recordConversion(): Promise<{ status: 'pending' }> {
  // TODO: una conversión por visitante, solo si hay variante asignada y usó el CTA.
  return { status: 'pending' }
}
