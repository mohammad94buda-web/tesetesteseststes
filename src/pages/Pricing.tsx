import { useEffect } from "react"
import { Link } from "react-router-dom"
import { Shell } from "../components/Shell"

export function Pricing() {
  useEffect(() => {
    document.title = "Preis - Satzklar"
  }, [])

  return (
    <Shell>
      <h1>Preis</h1>
      <p className="lede">Das Studio läuft in diesem Browser und kostet jetzt nichts.</p>
      <table className="price-table">
        <caption>Was du heute nutzen kannst, und was noch keinen Bezahlweg hat.</caption>
        <thead>
          <tr>
            <th scope="col">Umfang</th>
            <th scope="col">Preis</th>
            <th scope="col">Stand</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Ein Betrieb, Rechner, Angebote, Rechnungen, CSV, Druck</th>
            <td>0 €</td>
            <td>Nutzbar</td>
          </tr>
          <tr>
            <th scope="row">Mehrere Betriebe, Versand, Sicherung über Geräte</th>
            <td>12 € im Monat, geplant</td>
            <td>Noch nicht buchbar</td>
          </tr>
        </tbody>
      </table>
      <p>Es wird nichts abgebucht. Ein Bezahlweg ist nicht angeschlossen.</p>
      <p>
        <Link className="button button-accent" to="/studio">
          Studio öffnen
        </Link>
      </p>
      <p className="hint">Deine Kunden, Sätze und Rechnungen bleiben in diesem Browser, bis du sie löschst.</p>
    </Shell>
  )
}
