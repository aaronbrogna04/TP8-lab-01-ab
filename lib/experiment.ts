export type Variant = 'a' | 'b'

export type VariantStats = {
  impressions: number
  conversions: number
}

export type ExperimentLog = Record<Variant, VariantStats>

export const COOKIE = {
  visitor: 'lab_visitor',
  variant: 'lab_variant',
  log: 'lab_log',
  impressed: 'lab_impressed',
  converted: 'lab_converted',
} as const

export const THIRTY_DAYS = 60 * 60 * 24 * 30
export const SESSION_WINDOW = 60 * 30
export const CANONICAL_PATH = '/practica'
export const TITLE_RANGE = { min: 50, max: 60 }
export const DESCRIPTION_RANGE = { min: 140, max: 160 }

export const OFFER = [
  { label: 'Inicio', value: '14 de abril' },
  { label: 'Duración', value: '8 semanas' },
  { label: 'Cupo', value: '12 personas' },
  { label: 'Oficios', value: 'Carpintería, electricidad, cocina' },
] as const

export const VARIANTS = {
  a: {
    id: 'a',
    name: 'Control',
    seoTitle: 'Cursos de oficio en ocho semanas, con salida laboral',
    seoDescription:
      'Aprendé carpintería, electricidad o cocina en ocho semanas. Grupos de doce personas y práctica real, con una salida laboral que se puede cobrar.',
    headline: 'Ocho semanas para un oficio que se puede cobrar.',
    emphasis: null,
    lede: 'La práctica empieza en la primera clase. El mensaje de esta variante habla del método, no de la escasez.',
    cta: 'Ver cupos de abril',
  },
  b: {
    id: 'b',
    name: 'Tratamiento',
    seoTitle: 'Abril abre cupos: cursos de oficio en grupos de 12',
    seoDescription:
      'El 14 de abril empiezan grupos de doce. En la cohorte anterior, ocho de cada diez consiguieron trabajo en el rubro antes de los noventa días.',
    headline: 'El curso empieza el 14 de abril.',
    emphasis: 'El cupo, no.',
    lede: 'Doce lugares y una fecha. El mensaje de esta variante apura la decisión, sin cambiar la oferta.',
    cta: 'Reservar mi lugar',
  },
} as const

export const TEST_CASE: ExperimentLog = {
  a: { impressions: 240, conversions: 18 },
  b: { impressions: 236, conversions: 31 },
}

export const HASH_EXAMPLE_ID = 'lab-visitor-demo-01'

export function isVariant(value: string | null | undefined): value is Variant {
  return value === 'a' || value === 'b'
}

export function emptyLog(): ExperimentLog {
  return {
    a: { impressions: 0, conversions: 0 },
    b: { impressions: 0, conversions: 0 },
  }
}

export function assignVariant(_visitorId: string): Variant {
  // TODO: hash estable. El mismo id tiene que devolver siempre la misma variante.
  return 'a'
}

export function conversionRate(_stats: VariantStats): number | null {
  // TODO: conversiones / impresiones. Sin impresiones, devolver null, no 0.
  return null
}

export function rateGap(log: ExperimentLog): number | null {
  const control = conversionRate(log.a)
  const treatment = conversionRate(log.b)
  if (control === null || treatment === null) return null
  return (treatment - control) * 100
}

export function parseLog(_raw: string | undefined): ExperimentLog {
  // TODO: validar el JSON antes de usarlo. Si falla, log vacío.
  return emptyLog()
}

export function serializeLog(log: ExperimentLog): string {
  return JSON.stringify(log)
}

const numberFormat = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const integerFormat = new Intl.NumberFormat('es-AR')

export function formatCount(value: number): string {
  return integerFormat.format(value)
}

export function formatRate(rate: number | null): string {
  if (rate === null) return 'Pendiente'
  return `${numberFormat.format(rate * 100)}%`
}

export function formatPoints(value: number | null): string {
  if (value === null) return 'Pendiente'
  return `${numberFormat.format(value)} pp`
}

export function characterCount(value: string): number {
  return Array.from(value).length
}

export function inRange(length: number, range: { min: number; max: number }): boolean {
  return length >= range.min && length <= range.max
}

export function cookieOptions(secure: boolean, maxAge?: number) {
  // El preview corre en un iframe: la cookie tiene que ser Secure y SameSite=None.
  return {
    path: '/',
    httpOnly: true,
    secure,
    sameSite: secure ? ('none' as const) : ('lax' as const),
    partitioned: secure,
    ...(typeof maxAge === 'number' ? { maxAge } : {}),
  }
}
