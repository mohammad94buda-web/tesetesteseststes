import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { InvoiceSheet } from "../components/InvoiceSheet"
import { Shell } from "../components/Shell"
import { computeRate, formatEUR, formatNumber, rateFieldErrors, rateIssues, todayISO, type RateInput } from "../domain/model"
import { useStore } from "../store"

function formatDayCount(value: number): string {
  return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }).format(value)
}

function timeSummary(days: number): string {
  if (!Number.isFinite(days) || days <= 0) return "Arbeitszeit"
  const label = formatDayCount(days)
  return `Arbeitszeit, ${label} ${days === 1 ? "Tag" : "Tage"}`
}

const moneyFields: { key: keyof RateInput; label: string; hint?: string; step?: string }[] = [
  { key: "desiredNetMonthly", label: "Wunsch-Netto im Monat", hint: "Was nach Steuer und Kosten übrig bleiben soll." },
  { key: "taxReservePercent", label: "Rücklage für Steuer, Prozent", hint: "Anteil vom Gewinn, nicht vom Umsatz." },
  { key: "healthMonthly", label: "Krankenversicherung im Monat" },
  { key: "fixedMonthly", label: "Weitere Fixkosten im Monat" },
]

const timeFields: { key: keyof RateInput; label: string; hint?: string; step?: string }[] = [
  { key: "vacationDays", label: "Urlaubstage im Jahr" },
  { key: "sickDays", label: "Krankheitstage im Jahr" },
  { key: "workDaysPerWeek", label: "Arbeitstage pro Woche", step: "1" },
  { key: "hoursPerDay", label: "Stunden pro Tag", step: "0.5" },
  { key: "utilizationPercent", label: "Davon fakturierbar, Prozent", hint: "Der Rest ist Akquise, Verwaltung, Leerlauf." },
]

export function Landing() {
  const navigate = useNavigate()
  const { rate, setRate, profile, setDefaultRate, createDoc } = useStore()
  const issues = rateIssues(rate)
  const fieldErrors = rateFieldErrors(rate)
  const result = computeRate(rate)
  const workDays = result ? result.workDays : 52 * rate.workDaysPerWeek - rate.vacationDays - rate.sickDays

  useEffect(() => {
    document.title = "Satzklar"
  }, [])

  function update(key: keyof RateInput, raw: string) {
    if (raw.trim() === "") {
      setRate({ ...rate, [key]: 0 })
      return
    }
    const value = Number(raw)
    if (!Number.isFinite(value)) return
    setRate({ ...rate, [key]: value })
  }

  function useRate() {
    if (!result) return
    setDefaultRate(result.hourlyAsk)
    const id = createDoc("invoice", {
      lines: [
        {
          id: crypto.randomUUID(),
          description: "Leistung",
          quantity: 1,
          unit: "Stunde",
          unitPrice: result.hourlyAsk,
        },
      ],
    })
    navigate(`/studio/dokument/${id}`)
  }

  function renderField(field: (typeof moneyFields)[number]) {
    const message = fieldErrors.find((error) => error.field === field.key)?.message
    const describedBy = [field.hint ? `${field.key}-hint` : "", message ? `${field.key}-error` : ""].filter(Boolean).join(" ")
    return (
      <div className="field" key={field.key}>
        <label htmlFor={field.key}>{field.label}</label>
        <input
          id={field.key}
          name={field.key}
          autoComplete="off"
          inputMode="decimal"
          min={0}
          step={field.step ?? "1"}
          type="number"
          value={rate[field.key]}
          aria-invalid={message ? true : undefined}
          aria-describedby={describedBy || undefined}
          onChange={(event) => update(field.key, event.target.value)}
        />
        {field.hint ? (
          <p id={`${field.key}-hint`} className="hint">
            {field.hint}
          </p>
        ) : null}
        {message ? (
          <p id={`${field.key}-error`} className="error-text">
            {message}
          </p>
        ) : null}
      </div>
    )
  }

  const previewClient = {
    id: "preview",
    name: "Musterkunde GmbH",
    contact: "",
    street: "Hafenweg 4",
    zip: "20457",
    city: "Hamburg",
    email: "",
  }

  return (
    <Shell>
      <section className="hero" id="rechner">
        <div className="hero-copy">
          <h1>Dein Satz. Deine Rechnung.</h1>
          <p className="lede">Rechne den Stundensatz aus, den du brauchst. Daraus werden Angebot und Rechnung.</p>
          <div className="hero-result">
            <div aria-live="polite">
              {issues.length > 0 ? (
                <div className="error-summary">
                  <h2>Die Angaben gehen noch nicht auf</h2>
                  <ul className="error-list">
                    {issues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                </div>
              ) : result ? (
                <>
                  <p className="figure-kicker">Stundensatz, aufgerundet</p>
                  <p className="figure">{formatEUR(result.hourlyAsk)}</p>
                  <p className="day-line">
                    Tagessatz <span>{formatEUR(result.dayAsk)}</span>
                  </p>
                </>
              ) : null}
            </div>
            {result ? (
              <button type="button" className="button button-accent" onClick={useRate}>
                Rechnung mit diesem Satz
              </button>
            ) : null}
            <p className="hint">Der Satz ändert sich, sobald du ein Feld änderst.</p>
            <p className="hint">Netto. Umsatzsteuer kommt obendrauf, außer du bist Kleinunternehmer.</p>
            {result ? (
              <details className="fold">
                <summary>So kommt die Zahl zustande</summary>
                <dl className="breakdown">
                  <div>
                    <dt>Stundensatz vor dem Aufrunden</dt>
                    <dd>{formatEUR(result.hourly)}</dd>
                  </div>
                  <div>
                    <dt>Arbeitstage</dt>
                    <dd>{formatDayCount(result.workDays)}</dd>
                  </div>
                  <div>
                    <dt>Fakturierbare Stunden</dt>
                    <dd>{formatNumber(result.billableHours)}</dd>
                  </div>
                  <div>
                    <dt>Monatsumsatz</dt>
                    <dd>{formatEUR(result.monthlyRevenue)}</dd>
                  </div>
                </dl>
                <p className="hint">
                  Der Tagessatz ist der aufgerundete Stundensatz mal {formatDayCount(rate.hoursPerDay)}{" "}
                  {rate.hoursPerDay === 1 ? "Stunde" : "Stunden"}.
                </p>
              </details>
            ) : null}
          </div>
        </div>
        <form className="panel" aria-labelledby="rechner-title" autoComplete="off">
          <h2 id="rechner-title">Was die Stunde bringen muss</h2>
          <div className="form-grid">{moneyFields.map(renderField)}</div>
          <details className="fold">
            <summary>{timeSummary(workDays)}</summary>
            <div className="form-grid">{timeFields.map(renderField)}</div>
          </details>
        </form>
      </section>

      {result ? (
        <section className="band" aria-labelledby="vorschau-title">
          <h2 id="vorschau-title">Eine Stunde auf der Rechnung</h2>
          <p>Dieselbe Vorlage benutzt du im Studio, wenn du druckst oder als PDF speicherst.</p>
          <InvoiceSheet
            preview
            profile={{ ...profile, legalName: profile.legalName || "Dein Name" }}
            client={previewClient}
            doc={{
              id: "preview-doc",
              kind: "invoice",
              number: "RE-Vorschau",
              clientId: "preview",
              status: "draft",
              issuedOn: todayISO(),
              serviceOn: todayISO(),
              dueOn: todayISO(),
              vatRate: profile.smallBusiness ? 0 : 19,
              note: "",
              paidOn: "",
              lines: [
                {
                  id: "preview-line",
                  description: "Leistung, eine Stunde",
                  quantity: 1,
                  unit: "Stunde",
                  unitPrice: result.hourlyAsk,
                },
              ],
            }}
          />
        </section>
      ) : null}
    </Shell>
  )
}
