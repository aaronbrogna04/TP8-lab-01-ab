'use server'

import { cookies } from 'next/headers'
import { COOKIE, assignVariant } from '@/lib/experiment'
import { logEvent } from '@/lib/db'

export async function recordConversion(): Promise<void> {
  const visitorId = (await cookies()).get(COOKIE.visitor)?.value
  if (!visitorId) return
  // La variante se recalcula desde el id; la cookie lab_variant no se usa.
  const variant = assignVariant(visitorId)
  // El índice único parcial deja una sola conversión por visitante.
  await logEvent(visitorId, variant, 'conversion')
}
