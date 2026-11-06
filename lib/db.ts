// Acceso a Neon (driver HTTP). Solo servidor: proxy, Server Actions y Server Components.
// Ninguna función lanza: si falta DATABASE_URL o la consulta falla, se loguea y se
// devuelve un valor neutro para no tumbar la página ni el request.
import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import { emptyLog, isVariant, type ExperimentLog, type Variant } from '@/lib/experiment'

export type EventType = 'impression' | 'conversion'

let client: NeonQueryFunction<false, false> | null = null

function getSql(): NeonQueryFunction<false, false> | null {
  if (client) return client
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('[db] DATABASE_URL no está definida; no se leen ni escriben eventos.')
    return null
  }
  client = neon(url)
  return client
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export async function logEvent(visitorId: string, variant: Variant, type: EventType): Promise<void> {
  if (typeof visitorId !== 'string' || visitorId.length === 0 || visitorId.length > 200) return
  if (!isVariant(variant) || (type !== 'impression' && type !== 'conversion')) return
  const sql = getSql()
  if (!sql) return
  try {
    if (type === 'conversion') {
      // El índice único parcial (una conversión por visitor_id) descarta la segunda.
      await sql`
        INSERT INTO events (visitor_id, variant, type)
        VALUES (${visitorId}, ${variant}, 'conversion')
        ON CONFLICT DO NOTHING
      `
    } else {
      await sql`
        INSERT INTO events (visitor_id, variant, type)
        VALUES (${visitorId}, ${variant}, 'impression')
      `
    }
  } catch (error) {
    console.error(`[db] logEvent(${type}) falló:`, errorMessage(error))
  }
}

// COUNT(*) llega como string (bigint). Solo se acepta un entero no negativo.
function toCount(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return Number.isSafeInteger(n) && n >= 0 ? n : null
}

export async function getCounts(): Promise<ExperimentLog> {
  const counts = emptyLog()
  const sql = getSql()
  if (!sql) return counts
  try {
    const rows: unknown = await sql`
      SELECT variant, type, COUNT(*) AS total
      FROM events
      GROUP BY variant, type
    `
    if (!Array.isArray(rows)) return counts
    for (const row of rows) {
      if (typeof row !== 'object' || row === null) continue
      const { variant, type, total } = row as Record<string, unknown>
      const n = toCount(total)
      if (typeof variant !== 'string' || !isVariant(variant) || n === null) continue
      if (type === 'impression') counts[variant].impressions = n
      else if (type === 'conversion') counts[variant].conversions = n
    }
    return counts
  } catch (error) {
    console.error('[db] getCounts falló:', errorMessage(error))
    return emptyLog()
  }
}
