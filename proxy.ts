import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(_request: NextRequest) {
  // TODO: solo en /practica.
  // Si no hay cookie, crear el visitante y asignar la variante con assignVariant.
  // ?preview=a|b no escribe cookies.
  // Anotar una impresión por sesión de 30 minutos.
  return NextResponse.next()
}

export const config = {
  matcher: ['/practica'],
}
