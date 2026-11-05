'use client'

import { useState, useTransition } from 'react'
import { recordConversion } from '@/app/practica/actions'

export function Cta({ label }: { label: string }) {
  const [tried, setTried] = useState(false)
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            await recordConversion()
            setTried(true)
          })
        }}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {label}
      </button>
      <p className="max-w-md text-sm text-muted-foreground">
        {tried
          ? 'Pendiente: el clic llegó, pero no queda anotada ninguna conversión.'
          : 'La conversión se anota solo acá. Cargar la página no cuenta.'}
      </p>
    </div>
  )
}
