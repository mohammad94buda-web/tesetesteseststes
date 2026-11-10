import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  type Client,
  type Doc,
  type DocKind,
  type FieldError,
  type Profile,
  type RateInput,
  assignNumber,
  blankDoc,
  blankProfile,
  todayISO,
  validateIssue,
} from "./domain/model"
import { sampleClient, sampleDocs, sampleProfile, sampleRate } from "./domain/sample"

const STORAGE_KEY = "satzklar.v1"

export type ThemeName = "light" | "dark"

type State = {
  profile: Profile
  clients: Client[]
  docs: Doc[]
  rate: RateInput
  theme: ThemeName
}

type Store = State & {
  setTheme: (theme: ThemeName) => void
  setRate: (rate: RateInput) => void
  setDefaultRate: (hourly: number) => void
  updateProfile: (patch: Partial<Profile>) => void
  saveClient: (client: Client) => void
  deleteClient: (id: string) => string | null
  createDoc: (kind: DocKind, patch?: Partial<Doc>) => string
  updateDoc: (doc: Doc) => void
  issueDoc: (doc: Doc) => { ok: true } | { ok: false; errors: FieldError[] }
  markPaid: (id: string) => void
  setStatus: (id: string, status: Doc["status"]) => void
  convertQuote: (id: string) => string | null
  deleteDoc: (id: string) => void
  clearSamples: () => void
  today: string
}

const StoreContext = createContext<Store | null>(null)

function preferredTheme(): ThemeName {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function sampleState(): State {
  return {
    profile: sampleProfile,
    clients: [sampleClient],
    docs: sampleDocs,
    rate: sampleRate,
    theme: preferredTheme(),
  }
}

function isState(value: unknown): value is State {
  if (!value || typeof value !== "object") return false
  const record = value as Partial<State>
  return Boolean(record.profile && Array.isArray(record.clients) && Array.isArray(record.docs) && record.rate)
}

function loadState(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return sampleState()
    const parsed: unknown = JSON.parse(raw)
    if (!isState(parsed)) return sampleState()
    return {
      ...parsed,
      theme: parsed.theme === "dark" ? "dark" : "light",
    }
  } catch {
    return sampleState()
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(loadState)
  const today = todayISO()

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    document.documentElement.dataset.theme = state.theme
  }, [state])

  const store = useMemo<Store>(() => {
    const update = (patch: Partial<State>) => setState((current) => ({ ...current, ...patch }))
    return {
      ...state,
      today,
      setTheme: (theme) => update({ theme }),
      setRate: (rate) => update({ rate }),
      setDefaultRate: (hourly) => update({ profile: { ...state.profile, defaultRate: hourly } }),
      updateProfile: (patch) => update({ profile: { ...state.profile, ...patch } }),
      saveClient: (client) => {
        const next = { ...client, sample: false }
        const clients = state.clients.some((item) => item.id === next.id)
          ? state.clients.map((item) => (item.id === next.id ? next : item))
          : [next, ...state.clients]
        update({ clients })
      },
      deleteClient: (id) => {
        if (state.docs.some((doc) => doc.clientId === id)) {
          return "Der Kunde hängt noch an einem Dokument."
        }
        update({ clients: state.clients.filter((client) => client.id !== id) })
        return null
      },
      createDoc: (kind, patch) => {
        const doc: Doc = { ...blankDoc(kind, state.profile, today), ...patch, sample: false }
        update({ docs: [doc, ...state.docs] })
        return doc.id
      },
      updateDoc: (doc) => {
        update({ docs: state.docs.map((item) => (item.id === doc.id ? { ...doc, sample: false } : item)) })
      },
      issueDoc: (doc) => {
        const errors = validateIssue(doc, state.profile)
        if (errors.length > 0) return { ok: false, errors }
        const assigned = assignNumber({ ...doc, sample: false }, state.profile)
        const issued: Doc = { ...assigned.doc, status: "open" }
        update({
          profile: assigned.profile,
          docs: state.docs.map((item) => (item.id === doc.id ? issued : item)),
        })
        return { ok: true }
      },
      markPaid: (id) => {
        update({
          docs: state.docs.map((doc) =>
            doc.id === id ? { ...doc, status: "paid", paidOn: today, sample: false } : doc,
          ),
        })
      },
      setStatus: (id, status) => {
        update({
          docs: state.docs.map((doc) => (doc.id === id ? { ...doc, status, sample: false } : doc)),
        })
      },
      convertQuote: (id) => {
        const quote = state.docs.find((doc) => doc.id === id && doc.kind === "quote")
        if (!quote) return null
        const invoice: Doc = {
          ...blankDoc("invoice", state.profile, today),
          clientId: quote.clientId,
          lines: quote.lines.map((line) => ({ ...line, id: crypto.randomUUID() })),
          note: quote.note,
          vatRate: state.profile.smallBusiness ? 0 : quote.vatRate || 19,
        }
        update({ docs: [invoice, ...state.docs] })
        return invoice.id
      },
      deleteDoc: (id) => update({ docs: state.docs.filter((doc) => doc.id !== id) }),
      clearSamples: () => {
        const docs = state.docs.filter((doc) => !doc.sample)
        const used = new Set(docs.map((doc) => doc.clientId))
        const clients = state.clients
          .filter((client) => !client.sample || used.has(client.id))
          .map((client) => (used.has(client.id) ? { ...client, sample: false } : client))
        const profile =
          docs.length === 0 && state.profile.legalName === "Beispielstudio"
            ? { ...blankProfile(), defaultRate: state.profile.defaultRate }
            : state.profile
        update({ profile, clients, docs })
      },
    }
  }, [state, today])

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error("Store fehlt")
  return store
}
