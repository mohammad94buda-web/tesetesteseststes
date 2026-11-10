import { useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import type { FieldError } from "../domain/model"

const profileFields = new Set(["legalName", "address", "tax", "iban"])

export function ErrorSummary({ errors, attempt }: { errors: FieldError[]; attempt: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (attempt > 0 && errors.length > 0) ref.current?.focus()
  }, [attempt, errors.length])
  if (errors.length === 0) return null
  return (
    <div ref={ref} tabIndex={-1} role="alert" className="error-summary" aria-labelledby="error-title">
      <h2 id="error-title">Da fehlt etwas</h2>
      <ul>
        {errors.map((error) => (
          <li key={error.field}>
            {profileFields.has(error.field) ? (
              <Link to={`/studio/einstellungen#${error.field}`}>{error.message}</Link>
            ) : (
              <a href={`#${error.field}`}>{error.message}</a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function errorFor(errors: FieldError[], field: string): string | undefined {
  return errors.find((error) => error.field === field)?.message
}
