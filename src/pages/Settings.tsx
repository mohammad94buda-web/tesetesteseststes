import { useEffect, type ChangeEvent } from "react"
import { Shell } from "../components/Shell"
import type { Profile } from "../domain/model"
import { useStore } from "../store"

export function Settings() {
  const { profile, updateProfile, clearSamples, docs, clients } = useStore()
  const hasSample = docs.some((doc) => doc.sample) || clients.some((client) => client.sample)

  useEffect(() => {
    document.title = "Einstellungen - Satzklar"
    const id = window.location.hash.slice(1)
    if (id) document.getElementById(id)?.focus()
  }, [])

  function text<K extends keyof Profile>(key: K) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      updateProfile({ [key]: event.target.value })
    }
  }

  return (
    <Shell studio>
      <h1>Einstellungen</h1>
      <p>Keine Rechtsberatung. Prüfe die Angaben, bevor du eine Rechnung verschickst.</p>
      {profile.legalName === "Beispielstudio" ? (
        <p>Der Absender heißt noch Beispielstudio. Trag deinen Namen ein, bevor du eine Rechnung verschickst.</p>
      ) : null}
      <form className="panel" onSubmit={(event) => event.preventDefault()}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="legalName">Name oder Firma</label>
            <input id="legalName" value={profile.legalName} onChange={text("legalName")} autoComplete="organization" />
          </div>
          <div className="field">
            <label htmlFor="email">E-Mail</label>
            <input id="email" type="email" value={profile.email} onChange={text("email")} autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="address">Straße</label>
            <input id="address" value={profile.street} onChange={text("street")} autoComplete="street-address" />
          </div>
          <div className="field">
            <label htmlFor="zip">PLZ</label>
            <input id="zip" value={profile.zip} onChange={text("zip")} autoComplete="postal-code" />
          </div>
          <div className="field">
            <label htmlFor="city">Ort</label>
            <input id="city" value={profile.city} onChange={text("city")} autoComplete="address-level2" />
          </div>
          <div className="field">
            <label htmlFor="tax">Steuernummer</label>
            <input id="tax" value={profile.taxNumber} onChange={text("taxNumber")} />
          </div>
          <div className="field">
            <label htmlFor="vatId">USt-IdNr.</label>
            <input id="vatId" value={profile.vatId} onChange={text("vatId")} />
          </div>
          <div className="field">
            <label htmlFor="iban">IBAN</label>
            <input id="iban" value={profile.iban} onChange={text("iban")} spellCheck={false} />
          </div>
          <div className="field">
            <label htmlFor="bic">BIC</label>
            <input id="bic" value={profile.bic} onChange={text("bic")} spellCheck={false} />
          </div>
          <div className="field">
            <label htmlFor="bankName">Bank</label>
            <input id="bankName" value={profile.bankName} onChange={text("bankName")} />
          </div>
          <div className="field">
            <label htmlFor="paymentTermsDays">Zahlungsziel, Tage</label>
            <input
              id="paymentTermsDays"
              type="number"
              min={0}
              step={1}
              value={profile.paymentTermsDays}
              onChange={(event) => updateProfile({ paymentTermsDays: Number(event.target.value) || 0 })}
            />
          </div>
          <div className="field">
            <label htmlFor="defaultRate">Standard-Stundensatz, netto</label>
            <input
              id="defaultRate"
              type="number"
              min={0}
              step="1"
              value={profile.defaultRate}
              onChange={(event) => updateProfile({ defaultRate: Number(event.target.value) || 0 })}
            />
          </div>
        </div>
        <label className="check" htmlFor="smallBusiness">
          <input
            id="smallBusiness"
            type="checkbox"
            checked={profile.smallBusiness}
            onChange={(event) => updateProfile({ smallBusiness: event.target.checked })}
          />
          Kleinunternehmer nach § 19 UStG. Neue Dokumente setzen dann 0 % Umsatzsteuer.
        </label>
        <div className="field">
          <label htmlFor="footerNote">Fußzeile</label>
          <textarea id="footerNote" value={profile.footerNote} onChange={text("footerNote")} />
        </div>
      </form>
      {hasSample ? (
        <p>
          <button type="button" className="button button-secondary" onClick={clearSamples}>
            Beispieldaten entfernen
          </button>
        </p>
      ) : null}
    </Shell>
  )
}
