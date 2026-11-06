import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  COOKIE,
  SESSION_WINDOW,
  THIRTY_DAYS,
  assignVariant,
  cookieOptions,
  isVariant,
} from '@/lib/experiment'
import { logEvent } from '@/lib/db'

// Header interno request -> Server Component. NextResponse.next({ request })
// lo reenvía solo al servidor; nunca se devuelve al navegador.
export const VARIANT_HEADER = 'x-lab-variant'

// Crawlers conocidos. Regex simple, no exhaustiva.
const CRAWLER_UA =
  /googlebot|bingbot|duckduckbot|baiduspider|yandex(bot)?|slurp|facebookexternalhit|twitterbot|linkedinbot|applebot|embedly|pinterest|whatsapp|telegrambot|slackbot|\bbot\b|crawler|spider/i

// Ventana de sesión (30 min): mientras exista, recargar no suma impresiones.
const SESSION_COOKIE = 'lab_session'

// Prefetch del router de Next o del navegador (Speculation Rules / <link rel=prefetch>).
function isPrefetch(request: NextRequest): boolean {
  if (request.headers.has('next-router-prefetch')) return true
  const purpose = `${request.headers.get('purpose') ?? ''} ${request.headers.get('sec-purpose') ?? ''}`
  return /\bprefetch\b/i.test(purpose)
}

export async function proxy(request: NextRequest) {
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

  // Solo un GET es una vista de página. Un POST (p. ej. la Server Action del CTA)
  // no crea visitante: si lo hiciera, Next reenvía la cookie recién creada a la
  // acción y un POST sin historia terminaría registrando una conversión.
  const isPageView = request.method === 'GET'
  if (!isPageView && !existingId) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

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

  // UNA impresión por sesión de 30 min. Crawlers y preview ya salieron arriba;
  // un prefetch no es una vista. logEvent nunca lanza: si la base falla, el
  // request sigue igual.
  if (isPageView && !isPrefetch(request) && !request.cookies.has(SESSION_COOKIE)) {
    response.cookies.set(SESSION_COOKIE, '1', cookieOptions(secure, SESSION_WINDOW))
    await logEvent(visitorId, variant, 'impression')
  }

  return response
}

export const config = {
  matcher: ['/practica'],
}
