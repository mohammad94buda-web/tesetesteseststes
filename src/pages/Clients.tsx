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
      return
    }
    const reason = deleteClient(draft.id)
    if (reason) {
      setError(reason)
      return
    }
    setDraft(emptyClient())
    setSaved("Gelöscht.")
  }

  return (
    <Shell studio>
      <h1>Kunden</h1>
      {clients.length > 0 ? (
        <ul className="choice-list">
          {clients.map((client) => (
            <li key={client.id}>
              <button
                type="button"
                className="button button-quiet"
                aria-pressed={draft.id === client.id}
                onClick={() => {
                  setDraft(client)
                  setError("")
                  setSaved("")
                }}
              >
                {client.name}
                {client.sample ? " (Beispiel)" : ""}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>Noch kein Kunde.</p>
      )}
      <form
        className="panel"
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
            <input id="client-name" value={draft.name} onChange={(event) => update("name", event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="client-contact">Ansprechperson</label>
            <input id="client-contact" value={draft.contact} onChange={(event) => update("contact", event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="client-street">Straße</label>
            <input id="client-street" value={draft.street} onChange={(event) => update("street", event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="client-zip">PLZ</label>
            <input id="client-zip" value={draft.zip} onChange={(event) => update("zip", event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="client-city">Ort</label>
            <input id="client-city" value={draft.city} onChange={(event) => update("city", event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="client-email">E-Mail</label>
            <input
              id="client-email"
              type="email"
              autoComplete="off"
              value={draft.email}
              onChange={(event) => update("email", event.target.value)}
            />
          </div>
        </div>
        <div className="button-row">
          <button type="submit" className="button button-accent">
            Speichern
          </button>
          <button type="button" className="button button-quiet" onClick={() => setDraft(emptyClient())}>
            Neu
          </button>
          {draft.id ? (
            <button type="button" className="button button-danger" onClick={onDelete}>
              Löschen
            </button>
          ) : null}
        </div>
      </form>
    </Shell>
  )
}
