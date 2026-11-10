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
        <p className="banner" role="status">
          Der Absender heißt noch Beispielstudio. Trag deinen Namen ein, bevor du eine Rechnung verschickst.
        </p>
      ) : null}
      <form className="panel" autoComplete="on" onSubmit={(event) => event.preventDefault()}>
        <fieldset>
          <legend>Absender</legend>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="legalName">Name oder Firma</label>
              <input id="legalName" name="organization" value={profile.legalName} onChange={text("legalName")} autoComplete="organization" />
            </div>
            <div className="field">
              <label htmlFor="email">E-Mail</label>
              <input id="email" name="email" type="email" spellCheck={false} value={profile.email} onChange={text("email")} autoComplete="email" />
            </div>
            <div className="field">
              <label htmlFor="address">Straße</label>
              <input id="address" name="street-address" value={profile.street} onChange={text("street")} autoComplete="street-address" />
            </div>
            <div className="field">
              <label htmlFor="zip">PLZ</label>
              <input id="zip" name="postal-code" inputMode="numeric" value={profile.zip} onChange={text("zip")} autoComplete="postal-code" />
            </div>
            <div className="field span-2">
              <label htmlFor="city">Ort</label>
              <input id="city" name="address-level2" value={profile.city} onChange={text("city")} autoComplete="address-level2" />
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend>Steuer</legend>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="tax">Steuernummer</label>
              <input id="tax" name="tax" value={profile.taxNumber} onChange={text("taxNumber")} autoComplete="off" spellCheck={false} />
            </div>
            <div className="field">
              <label htmlFor="vatId">USt-IdNr.</label>
              <input id="vatId" name="vat-id" value={profile.vatId} onChange={text("vatId")} autoComplete="off" spellCheck={false} />
            </div>
          </div>
          <label className="check" htmlFor="smallBusiness">
            <input
              id="smallBusiness"
              name="small-business"
              type="checkbox"
              checked={profile.smallBusiness}
              onChange={(event) => updateProfile({ smallBusiness: event.target.checked })}
            />
            Kleinunternehmer nach § 19 UStG. Neue Dokumente setzen dann 0 % Umsatzsteuer.
          </label>
        </fieldset>
        <fieldset>
          <legend>Konto</legend>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="iban">IBAN</label>
              <input id="iban" name="iban" value={profile.iban} onChange={text("iban")} autoComplete="off" spellCheck={false} />
            </div>
            <div className="field">
              <label htmlFor="bic">BIC</label>
              <input id="bic" name="bic" value={profile.bic} onChange={text("bic")} autoComplete="off" spellCheck={false} />
            </div>
            <div className="field">
              <label htmlFor="bankName">Bank</label>
              <input id="bankName" name="bank" value={profile.bankName} onChange={text("bankName")} autoComplete="off" />
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend>Rechnung</legend>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="paymentTermsDays">Zahlungsziel, Tage</label>
              <input
                id="paymentTermsDays"
                name="payment-terms"
                type="number"
                inputMode="numeric"
                autoComplete="off"
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
                name="default-rate"
                type="number"
                inputMode="decimal"
                autoComplete="off"
                min={0}
                step="1"
                value={profile.defaultRate}
                onChange={(event) => updateProfile({ defaultRate: Number(event.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="footerNote">Fußzeile</label>
            <textarea id="footerNote" name="footer-note" autoComplete="off" value={profile.footerNote} onChange={text("footerNote")} />
          </div>
        </fieldset>
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
