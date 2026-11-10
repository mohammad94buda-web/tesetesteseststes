import { useEffect, useState } from "react"
import { Shell } from "../components/Shell"
import type { Client } from "../domain/model"
import { useStore } from "../store"

const emptyClient = (): Client => ({
  id: "",
  name: "",
  contact: "",
  street: "",
  zip: "",
  city: "",
  email: "",
})

export function Clients() {
  const { clients, saveClient, deleteClient } = useStore()
  const [draft, setDraft] = useState<Client>(emptyClient)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    document.title = "Kunden - Satzklar"
  }, [])

  function update<K extends keyof Client>(key: K, value: Client[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
    setSaved("")
  }

  function onSave() {
    if (!draft.name.trim()) {
      setError("Der Name fehlt.")
      document.getElementById("client-name")?.focus()
      return
    }
    setError("")
    const id = draft.id || crypto.randomUUID()
    saveClient({ ...draft, id })
    setDraft({ ...draft, id })
    setSaved("Gespeichert.")
  }

  function onDelete() {
    if (!draft.id) {
      setDraft(emptyClient())
      setConfirmDelete(false)
      return
    }
    if (!confirmDelete) {
      setConfirmDelete(true)
      setError("")
      setSaved("")
      return
    }
    const reason = deleteClient(draft.id)
    if (reason) {
      setError(reason)
      setConfirmDelete(false)
      return
    }
    setDraft(emptyClient())
    setConfirmDelete(false)
    setSaved("Gelöscht.")
  }

  return (
    <Shell studio>
      <h1>Kunden</h1>
      {clients.length > 0 ? (
        <div className="table-wrap">
          <table className="data-table">
            <caption className="sr-only">Kunden</caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Ort</th>
                <th scope="col">E-Mail</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <span className="cell-label">Name</span>
                    <button
                      type="button"
                      className="text-button"
                      aria-pressed={draft.id === client.id}
                      onClick={() => {
                        setDraft(client)
                        setError("")
                        setSaved("")
                        setConfirmDelete(false)
                      }}
                    >
                      {client.name}
                      {client.sample ? " (Beispiel)" : ""}
                    </button>
                  </td>
                  <td>
                    <span className="cell-label">Ort</span>
                    {[client.zip, client.city].filter(Boolean).join(" ") || "ohne"}
                  </td>
                  <td>
                    <span className="cell-label">E-Mail</span>
                    {client.email || "ohne"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>Noch kein Kunde. Name und Anschrift speicherst du im Formular darunter.</p>
      )}
      <form
        className="panel stack-panel"
        onSubmit={(event) => {
          event.preventDefault()
          onSave()
        }}
      >
        <h2>{draft.id ? "Kunde ändern" : "Kunde anlegen"}</h2>
        {error ? (
          <p role="alert" className="error-text">
            {error}
          </p>
        ) : null}
        {saved ? (
          <p role="status" className="hint">
            {saved}
          </p>
        ) : null}
        <div className="form-grid">
          <div className="field">
            <label htmlFor="client-name">Name</label>
            <input
              id="client-name"
              name="name"
              autoComplete="organization"
              aria-invalid={error === "Der Name fehlt." ? true : undefined}
              value={draft.name}
              onChange={(event) => update("name", event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="client-contact">Ansprechperson</label>
            <input id="client-contact" name="contact" autoComplete="name" value={draft.contact} onChange={(event) => update("contact", event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="client-street">Straße</label>
            <input id="client-street" name="street" autoComplete="street-address" value={draft.street} onChange={(event) => update("street", event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="client-zip">PLZ</label>
            <input id="client-zip" name="zip" autoComplete="postal-code" inputMode="numeric" value={draft.zip} onChange={(event) => update("zip", event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="client-city">Ort</label>
            <input id="client-city" name="city" autoComplete="address-level2" value={draft.city} onChange={(event) => update("city", event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="client-email">E-Mail</label>
            <input
              id="client-email"
              name="email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              value={draft.email}
              onChange={(event) => update("email", event.target.value)}
            />
          </div>
        </div>
        <div className="button-row">
          <button type="submit" className="button button-accent">
            Speichern
          </button>
          <button
            type="button"
            className="button button-quiet"
            onClick={() => {
              setDraft(emptyClient())
              setConfirmDelete(false)
              setError("")
              setSaved("")
            }}
          >
            Neu
          </button>
          {draft.id ? (
            <button type="button" className="button button-danger" onClick={onDelete}>
              {confirmDelete ? "Wirklich löschen" : "Löschen"}
            </button>
          ) : null}
        </div>
      </form>
    </Shell>
  )
}
