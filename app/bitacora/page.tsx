import type { Metadata } from 'next'
import Link from 'next/link'
import { connection } from 'next/server'
import { getCounts } from '@/lib/db'
import {
  HASH_EXAMPLE_ID,
  TEST_CASE,
  assignVariant,
  VARIANTS,
  conversionRate,
  formatCount,
  formatPoints,
  formatRate,
  rateGap,
  type Variant,
} from '@/lib/experiment'

export const metadata: Metadata = {
  title: 'Bitácora',
  description:
    'Impresiones, conversiones y tasa por variante: el caso de prueba fijo y los eventos reales registrados en la base.',
  robots: { index: false, follow: false },
}

const ROWS: Variant[] = ['a', 'b']

export default async function BitacoraPage() {
  // Los datos reales se leen en cada request, no en el build.
  await connection()
  const real = await getCounts()

  return (
    <main id="contenido" className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10 md:py-14">
      <p className="font-mono text-[0.7rem] tracking-[0.16em] text-muted-foreground uppercase">
        Bitácora del experimento
      </p>
      <h1 className="max-w-2xl font-serif text-4xl tracking-tight text-balance md:text-5xl">
        Impresiones, conversiones y tasa por variante.
      </h1>
      <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
        La tasa es conversiones divididas por impresiones. La diferencia entre variantes se informa en puntos porcentuales, sin interpretar el resultado.
      </p>
      <table className="w-full text-left text-sm">
        <caption className="mb-3 text-left text-muted-foreground">
          Caso de prueba fijo. Tasas y diferencia calculadas con la misma fórmula que los datos reales.
        </caption>
        <thead>
          <tr className="border-b border-border">
            <th className="py-2 font-medium">Variante</th>
            <th className="py-2 font-medium">Impresiones</th>
            <th className="py-2 font-medium">Conversiones</th>
            <th className="py-2 font-medium">Tasa</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((variant) => (
            <tr key={variant} className="border-b border-border">
              <td className="py-3">
                {variant.toUpperCase()} · {VARIANTS[variant].name}
              </td>
              <td className="py-3 font-mono">{formatCount(TEST_CASE[variant].impressions)}</td>
              <td className="py-3 font-mono">{formatCount(TEST_CASE[variant].conversions)}</td>
              <td className="py-3 font-mono">{formatRate(conversionRate(TEST_CASE[variant].conversions, TEST_CASE[variant].impressions))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="font-mono text-sm">B − A = {formatPoints(rateGap(TEST_CASE))}</p>
      <p className="font-mono text-sm">
        assignVariant({`'${HASH_EXAMPLE_ID}'`}) → {`'${assignVariant(HASH_EXAMPLE_ID)}'`}
      </p>
      <section aria-labelledby="datos-reales" className="flex flex-col gap-3">
        <h2 id="datos-reales" className="font-serif text-2xl tracking-tight">
          Datos reales
        </h2>
        <table className="w-full text-left text-sm">
          <caption className="mb-3 text-left text-muted-foreground">
            Eventos registrados en la base: una impresión por sesión de 30 minutos y una conversión por visitante.
          </caption>
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 font-medium">Variante</th>
              <th className="py-2 font-medium">Impresiones</th>
              <th className="py-2 font-medium">Conversiones</th>
              <th className="py-2 font-medium">Tasa</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((variant) => (
              <tr key={variant} className="border-b border-border">
                <td className="py-3">
                  {variant.toUpperCase()} · {VARIANTS[variant].name}
                </td>
                <td className="py-3 font-mono">{formatCount(real[variant].impressions)}</td>
                <td className="py-3 font-mono">{formatCount(real[variant].conversions)}</td>
                <td className="py-3 font-mono">{formatRate(conversionRate(real[variant].conversions, real[variant].impressions))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="font-mono text-sm">B − A = {formatPoints(rateGap(real))}</p>
      </section>
      <Link href="/practica" className="text-sm text-muted-foreground underline">
        Volver a la landing
      </Link>
    </main>
  )
}
