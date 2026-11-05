import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  COOKIE,
  THIRTY_DAYS,
  assignVariant,
  cookieOptions,
  isVariant,
} from '@/lib/experiment'

// Header interno request -> Server Component. NextResponse.next({ request })
// lo reenvía solo al servidor; nunca se devuelve al navegador.
export const VARIANT_HEADER = 'x-lab-variant'

// Crawlers conocidos. Regex simple, no exhaustiva.
const CRAWLER_UA =
  /googlebot|bingbot|duckduckbot|baiduspider|yandex(bot)?|slurp|facebookexternalhit|twitterbot|linkedinbot|applebot|embedly|pinterest|whatsapp|telegrambot|slackbot|\bbot\b|crawler|spider/i

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  // Nunca confiar en un header que venga del cliente.
  requestHeaders.delete(VARIANT_HEADER)

  // Crawlers: no es cloaking. Se fija el control (A) en la MISMA URL y con el
  // mismo canonical para que el texto indexado sea estable y no dependa de un
  // sorteo; no se les muestra contenido distinto para manipular el ranking.
  // Sin cookies ni impresión (no son visitantes reales).
  if (CRAWLER_UA.test(request.headers.get('user-agent') ?? '')) {
    requestHeaders.set(VARIANT_HEADER, 'a')
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // Preview: no escribe cookies ni anota impresión. Un valor inválido se ignora.
  const preview = request.nextUrl.searchParams.get('preview')
  if (isVariant(preview)) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  const secure = process.env.NODE_ENV === 'production'
  const existingId = request.cookies.get(COOKIE.visitor)?.value
  const visitorId = existingId || crypto.randomUUID()
  const variant = assignVariant(visitorId)

  requestHeaders.set(VARIANT_HEADER, variant)
  const response = NextResponse.next({ request: { headers: requestHeaders } })

  if (!existingId) {
    response.cookies.set(COOKIE.visitor, visitorId, cookieOptions(secure, THIRTY_DAYS))
  }
  if (request.cookies.get(COOKIE.variant)?.value !== variant) {
    response.cookies.set(COOKIE.variant, variant, cookieOptions(secure, THIRTY_DAYS))
  }

  // TODO (Paso 4): anotar UNA impresión por sesión de 30 min (COOKIE.impressed,
  // SESSION_WINDOW) y actualizar COOKIE.log con parseLog/serializeLog.

  return response
}

export const config = {
  matcher: ['/practica'],
}
