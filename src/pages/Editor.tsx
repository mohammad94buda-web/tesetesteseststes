import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ErrorSummary, errorFor } from "../components/Fields"
import { InvoiceSheet } from "../components/InvoiceSheet"
import { Shell } from "../components/Shell"
import {
  blankLine,
  formatEUR,
  isOverdue,
  reminderText,
  statusLabel,
  totals,
  type Doc,
  type FieldError,
  type Line,
} from "../domain/model"
import { useStore } from "../store"

const units = ["Stunde", "Tag", "Pauschale", "Stück"]

export function Editor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const store = useStore()
  const doc = store.docs.find((item) => item.id === id)
  const [errors, setErrors] = useState<FieldError[]>([])
  const [attempt, setAttempt] = useState(0)
  const [notice, setNotice] = useState("")
  const [reminder, setReminder] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    document.title = doc ? `${doc.number || "Entwurf"} - Satzklar` : "Dokument - Satzklar"
  }, [doc])

  if (!doc) {
    return (
      <Shell studio>
        <h1>Dokument nicht da</h1>
        <p>
          <Link to="/studio">Zurück zur Übersicht</Link>
        </p>
      </Shell>
    )
  }

  const client = store.clients.find((item) => item.id === doc.clientId)
  const sum = totals(doc)
  const locked = doc.status !== "draft"

  function patch(next: Partial<Doc>) {
    store.updateDoc({ ...doc!, ...next })
    setErrors([])
  }

  function patchLine(lineId: string, next: Partial<Line>) {
    patch({ lines: doc!.lines.map((line) => (line.id === lineId ? { ...line, ...next } : line)) })
  }

  function issue() {
    const result = store.issueDoc(doc!)
    setAttempt((value) => value + 1)
    if (!result.ok) {
      setErrors(result.errors)
      setNotice("")
      return
    }
    setErrors([])
    setNotice(doc!.kind === "quote" ? "Angebot ist verschickt." : "Rechnung ist offen.")
  }

  async function copyReminder() {
    const text = reminderText(doc!, client, store.profile)
    try {
      await navigator.clipboard.writeText(text)
      setReminder("")
      setNotice("Mahnung ist in der Zwischenablage.")
    } catch {
      setReminder(text)
      setNotice("Kopieren ist blockiert. Der Text steht unten zum Markieren.")
    }
  }

  return (
    <Shell studio>
      <div className="page-head no-print">
        <div>
          <h1>{doc.kind === "quote" ? "Angebot" : "Rechnung"}</h1>
          <p>
            {statusLabel(doc, store.today)}
            {doc.sample ? ", Beispiel" : ""}
            {doc.number ? `, ${doc.number}` : ""}
          </p>
        </div>
        <div className="button-row no-print">
          <button type="button" className="button button-secondary" onClick={() => window.print()}>
            Drucken oder PDF
          </button>
        </div>
      </div>
      <div className="editor-grid">
        <form
          className="panel no-print"
          onSubmit={(event) => {
            event.preventDefault()
            issue()
          }}
        >
          <ErrorSummary errors={errors} attempt={attempt} />
          {locked ? <p className="hint">Festgeschrieben. Drucken und den Status ändern geht weiter.</p> : null}
          {notice ? (
            <p role="status" className="hint">
              {notice}
            </p>
          ) : null}
          <div className="form-grid">
            <div className="field">
              <label htmlFor="clientId">Kunde</label>
              <select
                id="clientId"
                name="clientId"
                autoComplete="off"
                value={doc.clientId}
                disabled={locked}
                aria-invalid={Boolean(errorFor(errors, "clientId"))}
                onChange={(event) => patch({ clientId: event.target.value })}
              >
                <option value="">Kunde wählen</option>
                {store.clients.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              {errorFor(errors, "clientId") ? <p className="error-text">{errorFor(errors, "clientId")}</p> : null}
              <p className="hint">
                <Link to="/studio/kunden">Kunde anlegen</Link>
              </p>
            </div>
            <div className="field">
              <label htmlFor="issuedOn">Datum</label>
              <input
                id="issuedOn"
                name="issuedOn"
                type="date"
                autoComplete="off"
                value={doc.issuedOn}
                disabled={locked}
                aria-invalid={Boolean(errorFor(errors, "issuedOn"))}
                onChange={(event) => patch({ issuedOn: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="serviceOn">Leistungsdatum</label>
              <input
                id="serviceOn"
                name="serviceOn"
                type="date"
                autoComplete="off"
                value={doc.serviceOn}
                disabled={locked}
                aria-invalid={Boolean(errorFor(errors, "serviceOn"))}
                onChange={(event) => patch({ serviceOn: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="dueOn">{doc.kind === "quote" ? "Gültig bis" : "Fällig"}</label>
              <input
                id="dueOn"
                name="dueOn"
                type="date"
                autoComplete="off"
                value={doc.dueOn}
                disabled={locked}
                aria-invalid={Boolean(errorFor(errors, "dueOn"))}
                onChange={(event) => patch({ dueOn: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="vatRate">Umsatzsteuer, Prozent</label>
              <select
                id="vatRate"
                name="vatRate"
                autoComplete="off"
                value={doc.vatRate}
                disabled={locked || store.profile.smallBusiness}
                onChange={(event) => patch({ vatRate: Number(event.target.value) })}
              >
                <option value={0}>0</option>
                <option value={7}>7</option>
                <option value={19}>19</option>
              </select>
              {store.profile.smallBusiness ? <p className="hint">Kleinunternehmer: 0 %.</p> : null}
            </div>
          </div>

          <fieldset id="lines" tabIndex={-1} className={errorFor(errors, "lines") ? "invalid" : undefined}>
            <legend>Positionen</legend>
            {doc.lines.map((line, index) => (
              <div className="line-row" key={line.id}>
                <div className="field">
                  <label htmlFor={`desc-${line.id}`}>Text</label>
                  <input
                    id={`desc-${line.id}`}
                    name={`desc-${line.id}`}
                    autoComplete="off"
                    value={line.description}
                    disabled={locked}
                    onChange={(event) => patchLine(line.id, { description: event.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor={`qty-${line.id}`}>Menge</label>
                  <input
                    id={`qty-${line.id}`}
                    name={`qty-${line.id}`}
                    autoComplete="off"
                    inputMode="decimal"
                    type="number"
                    min={0}
                    step="0.25"
                    value={line.quantity}
                    disabled={locked}
                    onChange={(event) => {
                      const value = Number(event.target.value)
                      if (Number.isFinite(value)) patchLine(line.id, { quantity: value })
                    }}
                  />
                </div>
                <div className="field">
                  <label htmlFor={`unit-${line.id}`}>Einheit</label>
                  <select
                    id={`unit-${line.id}`}
                    name={`unit-${line.id}`}
                    autoComplete="off"
                    value={line.unit}
                    disabled={locked}
                    onChange={(event) => patchLine(line.id, { unit: event.target.value })}
                  >
                    {units.map((unit) => (
                      <option key={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor={`price-${line.id}`}>Preis netto</label>
                  <input
                    id={`price-${line.id}`}
                    name={`price-${line.id}`}
                    autoComplete="off"
                    inputMode="decimal"
                    type="number"
                    min={0}
                    step="1"
                    value={line.unitPrice}
                    disabled={locked}
                    onChange={(event) => {
                      const value = Number(event.target.value)
                      if (Number.isFinite(value)) patchLine(line.id, { unitPrice: value })
                    }}
                  />
                </div>
                {doc.lines.length > 1 && !locked ? (
                  <button type="button" className="button button-quiet" onClick={() => patch({ lines: doc.lines.filter((item) => item.id !== line.id) })}>
                    Position {index + 1} entfernen
                  </button>
                ) : null}
              </div>
            ))}
            {errorFor(errors, "lines") ? <p className="error-text">{errorFor(errors, "lines")}</p> : null}
            {!locked ? (
              <button
                type="button"
                className="button button-quiet"
                onClick={() => patch({ lines: [...doc.lines, blankLine(store.profile.defaultRate)] })}
              >
                Position hinzufügen
              </button>
            ) : null}
          </fieldset>

          <div className="field">
            <label htmlFor="note">Notiz</label>
            <textarea id="note" name="note" autoComplete="off" value={doc.note} disabled={locked} onChange={(event) => patch({ note: event.target.value })} />
          </div>
          <p className="sum-line">
            Brutto {formatEUR(sum.gross)}
          </p>
          <div className="button-row">
            {doc.status === "draft" ? (
              <button type="submit" className="button button-accent">
                {doc.kind === "quote" ? "Angebot verschicken" : "Rechnung stellen"}
              </button>
            ) : null}
            {doc.kind === "invoice" && doc.status === "open" ? (
              <button type="button" className="button button-accent" onClick={() => store.markPaid(doc.id)}>
                Als bezahlt markieren
              </button>
            ) : null}
            {doc.kind === "invoice" && isOverdue(doc, store.today) ? (
              <button type="button" className="button button-secondary" onClick={() => void copyReminder()}>
                Mahnung kopieren
              </button>
            ) : null}
            {doc.kind === "quote" && (doc.status === "open" || doc.status === "accepted") ? (
              <>
                {doc.status === "open" ? (
                  <button type="button" className="button button-secondary" onClick={() => store.setStatus(doc.id, "accepted")}>
                    Angenommen
                  </button>
                ) : null}
                <button
                  type="button"
                  className="button button-accent"
                  onClick={() => {
                    const next = store.convertQuote(doc.id)
                    if (next) navigate(`/studio/dokument/${next}`)
                  }}
                >
                  In Rechnung übernehmen
                </button>
              </>
            ) : null}
            {doc.status !== "draft" && doc.status !== "cancelled" && doc.status !== "paid" ? (
              <button type="button" className="button button-quiet" onClick={() => store.setStatus(doc.id, "cancelled")}>
                Stornieren
              </button>
            ) : null}
            {confirmDelete ? (
              <button
                type="button"
                className="button button-danger"
                onClick={() => {
                  store.deleteDoc(doc.id)
                  navigate("/studio")
                }}
              >
                Wirklich löschen
              </button>
            ) : (
              <button type="button" className="button button-danger" onClick={() => setConfirmDelete(true)}>
                Löschen
              </button>
            )}
          </div>
          {reminder ? (
            <textarea readOnly value={reminder} aria-label="Mahntext" />
          ) : null}
        </form>
        <InvoiceSheet doc={doc} client={client} profile={store.profile} />
      </div>
    </Shell>
  )
}
