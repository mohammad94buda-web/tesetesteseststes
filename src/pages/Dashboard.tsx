import { useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Shell } from "../components/Shell"
import { formatDate, formatEUR, isOverdue, statusLabel, summarize, toCsv, totals } from "../domain/model"
import { useStore } from "../store"

export function Dashboard() {
  const navigate = useNavigate()
  const { docs, clients, profile, today, createDoc, clearSamples } = useStore()
  const summary = summarize(docs, today)
  const hasSample = docs.some((doc) => doc.sample) || clients.some((client) => client.sample)
  const hasInvoices = docs.some((doc) => doc.kind === "invoice")
  const clientName = (id: string) => clients.find((client) => client.id === id)?.name ?? "Ohne Kunden"

  useEffect(() => {
    document.title = "Studio - Satzklar"
  }, [])

  const ranked = [...docs].sort((a, b) => {
    const weight = (status: string, overdue: boolean) => (overdue ? 0 : status === "open" ? 1 : 2)
    const byWeight = weight(a.status, isOverdue(a, today)) - weight(b.status, isOverdue(b, today))
    return byWeight || a.dueOn.localeCompare(b.dueOn)
  })

  function downloadCsv() {
    const blob = new Blob([toCsv(docs, clients)], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "satzklar-dokumente.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Shell studio>
      <div className="page-head">
        <h1>Offene Posten</h1>
        <div className="button-row">
          <button type="button" className="button button-accent" onClick={() => navigate(`/studio/dokument/${createDoc("invoice")}`)}>
            Rechnung schreiben
          </button>
          <button type="button" className="button button-secondary" onClick={() => navigate(`/studio/dokument/${createDoc("quote")}`)}>
            Angebot schreiben
          </button>
        </div>
      </div>

      {hasSample ? (
        <div className="banner" role="status">
          <p>Das sind Beispieldaten. Entferne sie, bevor du echte Kunden anlegst.</p>
          <button type="button" className="button button-secondary" onClick={clearSamples}>
            Beispieldaten entfernen
          </button>
        </div>
      ) : null}

      {hasInvoices ? (
        <table className="summary-table">
          <caption>
            Überfällig ist ein Teil der offenen Beträge. Bezahlt meint{" "}
            {new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(new Date(`${today}T12:00:00`))}.
          </caption>
          <tbody>
            <tr>
              <th scope="row">Offen</th>
              <td>{formatEUR(summary.open)}</td>
            </tr>
            <tr>
              <th scope="row">Überfällig</th>
              <td>{formatEUR(summary.overdue)}</td>
            </tr>
            <tr>
              <th scope="row">Bezahlt im Monat</th>
              <td>{formatEUR(summary.paidMonth)}</td>
            </tr>
            <tr>
              <th scope="row">Angebote draußen</th>
              <td>{formatEUR(summary.quotes)}</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p>
          Noch keine Rechnung.
          {profile.defaultRate > 0 ? ` Neue Rechnungen starten bei ${formatEUR(profile.defaultRate)} je Stunde.` : ""}
        </p>
      )}

      {ranked.length > 0 ? (
        <div className="table-wrap">
          <table className="data-table">
            <caption className="sr-only">Dokumente</caption>
            <thead>
              <tr>
                <th scope="col">Dokument</th>
                <th scope="col">Kunde</th>
                <th scope="col">Fällig</th>
                <th scope="col">Status</th>
                <th scope="col">Brutto</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <span className="cell-label">Dokument</span>
                    <Link to={`/studio/dokument/${doc.id}`}>
                      {doc.number || "Entwurf"}
                      {doc.sample ? " (Beispiel)" : ""}
                    </Link>
                  </td>
                  <td>
                    <span className="cell-label">Kunde</span>
                    {clientName(doc.clientId)}
                  </td>
                  <td>
                    <span className="cell-label">Fällig</span>
                    {formatDate(doc.dueOn)}
                  </td>
                  <td>
                    <span className="cell-label">Status</span>
                    {statusLabel(doc, today)}
                  </td>
                  <td>
                    <span className="cell-label">Brutto</span>
                    {formatEUR(totals(doc).gross)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {docs.length > 0 ? (
        <p>
          <button type="button" className="button button-quiet" onClick={downloadCsv}>
            CSV speichern
          </button>
        </p>
      ) : null}
    </Shell>
  )
}
