import { formatDate, formatEUR, money, totals, type Client, type Doc, type Profile } from "../domain/model"

export function InvoiceSheet({
  doc,
  client,
  profile,
  preview = false,
}: {
  doc: Doc
  client?: Client
  profile: Profile
  preview?: boolean
}) {
  const sum = totals(doc)
  const title = doc.kind === "quote" ? "Angebot" : "Rechnung"
  const legal =
    sum.rate === 0 && profile.smallBusiness ? "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet." : ""
  return (
    <article className="invoice-sheet" aria-label={preview ? "Vorschau der Rechnung" : title}>
      {preview ? <p className="sample-flag">Vorschau, noch nicht gespeichert</p> : null}
      {doc.sample ? <p className="sample-flag">Beispiel</p> : null}
      <header className="sheet-head">
        <div>
          <p className="sheet-kicker">{title}</p>
          <p className="sheet-number">{doc.number || "Entwurf"}</p>
        </div>
        <p className="sheet-from">
          {[profile.legalName || "Absender fehlt", profile.street, [profile.zip, profile.city].filter(Boolean).join(" "), profile.email]
            .filter(Boolean)
            .map((line) => (
              <span key={line}>{line}</span>
            ))}
        </p>
      </header>
        <p className="sheet-to">
        {client ? (
          [client.name, client.contact, client.street, [client.zip, client.city].filter(Boolean).join(" ")]
            .filter(Boolean)
            .map((line) => <span key={line}>{line}</span>)
        ) : (
          "Kunde fehlt"
        )}
      </p>
      <dl className="sheet-meta">
        <div>
          <dt>Datum</dt>
          <dd>{formatDate(doc.issuedOn)}</dd>
        </div>
        <div>
          <dt>Leistung</dt>
          <dd>{formatDate(doc.serviceOn)}</dd>
        </div>
        <div>
          <dt>{doc.kind === "quote" ? "Gültig bis" : "Fällig"}</dt>
          <dd>{formatDate(doc.dueOn)}</dd>
        </div>
      </dl>
      <table className="sheet-lines">
        <caption className="sr-only">Positionen</caption>
        <thead>
          <tr>
            <th scope="col">Leistung</th>
            <th scope="col">Menge</th>
            <th scope="col">Preis</th>
            <th scope="col">Betrag</th>
          </tr>
        </thead>
        <tbody>
          {doc.lines.map((line) => (
            <tr key={line.id}>
              <td>{line.description || "Ohne Text"}</td>
              <td>
                {line.quantity} {line.unit}
              </td>
              <td>{formatEUR(line.unitPrice)}</td>
              <td>{formatEUR(money(line.quantity * line.unitPrice))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="sheet-sum">
        <div>
          <dt>Netto</dt>
          <dd>{formatEUR(sum.net)}</dd>
        </div>
        <div>
          <dt>Umsatzsteuer {sum.rate} %</dt>
          <dd>{formatEUR(sum.vat)}</dd>
        </div>
        <div>
          <dt>Brutto</dt>
          <dd>{formatEUR(sum.gross)}</dd>
        </div>
      </dl>
      {legal ? <p>{legal}</p> : null}
      {profile.taxNumber ? <p>Steuernummer {profile.taxNumber}</p> : null}
      {profile.vatId ? <p>USt-IdNr. {profile.vatId}</p> : null}
      {profile.iban ? (
        <p>
          {profile.bankName ? `${profile.bankName}, ` : ""}
          IBAN {profile.iban}
          {profile.bic ? `, BIC ${profile.bic}` : ""}
        </p>
      ) : null}
      {doc.note ? <p>{doc.note}</p> : null}
      {profile.footerNote && profile.footerNote.trim() !== legal && !preview ? <p>{profile.footerNote}</p> : null}
    </article>
  )
}
