import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { InvoiceSheet } from "../components/InvoiceSheet"
import { Shell } from "../components/Shell"
import { computeRate, formatEUR, formatNumber, rateIssues, todayISO, type RateInput } from "../domain/model"
import { useStore } from "../store"

const fields: { key: keyof RateInput; label: string; hint?: string; step?: string }[] = [
  { key: "desiredNetMonthly", label: "Wunsch-Netto im Monat", hint: "Was nach Steuer und Kosten übrig bleiben soll." },
  { key: "taxReservePercent", label: "Rücklage für Steuer, Prozent", hint: "Anteil vom Gewinn, nicht vom Umsatz." },
  { key: "healthMonthly", label: "Krankenversicherung im Monat" },
  { key: "fixedMonthly", label: "Weitere Fixkosten im Monat" },
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
  const result = computeRate(rate)

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
      <section className="hero">
        <div className="hero-copy">
          <h1>Dein Satz. Deine Rechnung.</h1>
          <p className="lede">
            Rechne den Stundensatz aus, den du brauchst. Daraus werden Angebot und Rechnung.
          </p>
          <p>Der Satz ist netto. Umsatzsteuer kommt obendrauf, außer du bist Kleinunternehmer.</p>
        </div>
        <form id="rechner" className="panel" aria-labelledby="rechner-title">
          <h2 id="rechner-title">Was die Stunde bringen muss</h2>
          <div className="form-grid">
            {fields.map((field) => (
              <div className="field" key={field.key}>
                <label htmlFor={field.key}>{field.label}</label>
                <input
                  id={field.key}
                  inputMode="decimal"
                  min={0}
                  step={field.step ?? "1"}
                  type="number"
                  value={rate[field.key]}
                  aria-describedby={field.hint ? `${field.key}-hint` : undefined}
                  onChange={(event) => update(field.key, event.target.value)}
                />
                {field.hint ? (
                  <p id={`${field.key}-hint`} className="hint">
                    {field.hint}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
          <div aria-live="polite">
            {issues.length > 0 ? (
              <ul className="error-list">
                {issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            ) : result ? (
              <>
                <table className="rate-table">
                  <caption className="sr-only">Ergebnis aus deinen Angaben</caption>
                  <thead>
                    <tr>
                      <th scope="col">Stundensatz</th>
                      <th scope="col">Tagessatz</th>
                      <th scope="col">Monatsumsatz</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{formatEUR(result.hourlyAsk)}</td>
                      <td>{formatEUR(result.dayAsk)}</td>
                      <td>{formatEUR(result.monthlyRevenue)}</td>
                    </tr>
                  </tbody>
                </table>
                <p className="hint">
                  Genau {formatEUR(result.hourly)} je Stunde, vor dem Aufrunden. {result.workDays} Arbeitstage,{" "}
                  {formatNumber(result.billableHours)} fakturierbare Stunden. Der Tagessatz ist der aufgerundete
                  Stundensatz mal {rate.hoursPerDay} Stunden.
                </p>
                <button type="button" className="button button-accent" onClick={useRate}>
                  Rechnung mit diesem Satz
                </button>
              </>
            ) : null}
          </div>
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
