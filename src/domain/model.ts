export type RateInput = {
  desiredNetMonthly: number
  taxReservePercent: number
  healthMonthly: number
  fixedMonthly: number
  vacationDays: number
  sickDays: number
  workDaysPerWeek: number
  hoursPerDay: number
  utilizationPercent: number
}

export type RateResult = {
  monthlyProfit: number
  monthlyRevenue: number
  annualRevenue: number
  workDays: number
  billableHours: number
  hourly: number
  hourlyAsk: number
  dayAsk: number
}

export type Profile = {
  legalName: string
  street: string
  zip: string
  city: string
  email: string
  phone: string
  taxNumber: string
  vatId: string
  smallBusiness: boolean
  iban: string
  bic: string
  bankName: string
  invoicePrefix: string
  quotePrefix: string
  nextInvoice: number
  nextQuote: number
  paymentTermsDays: number
  defaultRate: number
  footerNote: string
}

export type Client = {
  id: string
  name: string
  contact: string
  street: string
  zip: string
  city: string
  email: string
  sample?: boolean
}

export type Line = {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
}

export type DocKind = "invoice" | "quote"
export type DocStatus = "draft" | "open" | "paid" | "cancelled" | "accepted" | "declined"

export type Doc = {
  id: string
  kind: DocKind
  number: string
  clientId: string
  status: DocStatus
  issuedOn: string
  serviceOn: string
  dueOn: string
  lines: Line[]
  vatRate: number
  note: string
  paidOn: string
  sample?: boolean
}

export type FieldError = {
  field: string
  message: string
}

export const defaultRateInput: RateInput = {
  desiredNetMonthly: 4000,
  taxReservePercent: 35,
  healthMonthly: 450,
  fixedMonthly: 250,
  vacationDays: 25,
  sickDays: 8,
  workDaysPerWeek: 5,
  hoursPerDay: 8,
  utilizationPercent: 60,
}

export function money(value: number): number {
  return Math.round(value * 100) / 100
}

export function formatEUR(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(money(value))
}

export function formatNumber(value: number, digits = 1): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function todayISO(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return todayISO(date)
}

export function formatDate(iso: string): string {
  if (!iso) return ""
  const [year, month, day] = iso.split("-")
  return `${day}.${month}.${year}`
}

export function blankProfile(): Profile {
  return {
    legalName: "",
    street: "",
    zip: "",
    city: "",
    email: "",
    phone: "",
    taxNumber: "",
    vatId: "",
    smallBusiness: true,
    iban: "",
    bic: "",
    bankName: "",
    invoicePrefix: "RE",
    quotePrefix: "AG",
    nextInvoice: 1,
    nextQuote: 1,
    paymentTermsDays: 14,
    defaultRate: 0,
    footerNote: "",
  }
}

export function rateFieldErrors(input: RateInput): { field: keyof RateInput; message: string }[] {
  const errors: { field: keyof RateInput; message: string }[] = []
  if (input.desiredNetMonthly < 0) {
    errors.push({ field: "desiredNetMonthly", message: "Das Wunsch-Netto kann nicht negativ sein." })
  }
  if (input.taxReservePercent < 0 || input.taxReservePercent >= 100) {
    errors.push({ field: "taxReservePercent", message: "Die Steuerrücklage muss zwischen 0 und 99 Prozent liegen." })
  }
  if (input.healthMonthly < 0) {
    errors.push({ field: "healthMonthly", message: "Kosten können nicht negativ sein." })
  }
  if (input.fixedMonthly < 0) {
    errors.push({ field: "fixedMonthly", message: "Kosten können nicht negativ sein." })
  }
  if (input.workDaysPerWeek <= 0 || input.workDaysPerWeek > 7) {
    errors.push({ field: "workDaysPerWeek", message: "Arbeitstage pro Woche müssen zwischen 1 und 7 liegen." })
  }
  if (input.hoursPerDay <= 0 || input.hoursPerDay > 24) {
    errors.push({ field: "hoursPerDay", message: "Stunden pro Tag müssen zwischen 1 und 24 liegen." })
  }
  if (input.utilizationPercent <= 0 || input.utilizationPercent > 100) {
    errors.push({ field: "utilizationPercent", message: "Der fakturierbare Anteil muss zwischen 1 und 100 Prozent liegen." })
  }
  if (input.vacationDays < 0) {
    errors.push({ field: "vacationDays", message: "Urlaubs- und Krankheitstage können nicht negativ sein." })
  }
  if (input.sickDays < 0) {
    errors.push({ field: "sickDays", message: "Urlaubs- und Krankheitstage können nicht negativ sein." })
  }
  const workDays = 52 * input.workDaysPerWeek - input.vacationDays - input.sickDays
  if (errors.length === 0 && workDays <= 0) {
    const message = "Urlaub und Krankheit sind höher als die Arbeitstage im Jahr."
    errors.push({ field: "vacationDays", message }, { field: "sickDays", message })
  }
  return errors
}

export function rateIssues(input: RateInput): string[] {
  return [...new Set(rateFieldErrors(input).map((error) => error.message))]
}

export function computeRate(input: RateInput): RateResult | null {
  if (rateIssues(input).length > 0) return null
  const keep = 1 - input.taxReservePercent / 100
  const monthlyProfit = input.desiredNetMonthly / keep
  const monthlyRevenue = monthlyProfit + input.healthMonthly + input.fixedMonthly
  const annualRevenue = monthlyRevenue * 12
  const workDays = 52 * input.workDaysPerWeek - input.vacationDays - input.sickDays
  const billableHours = workDays * input.hoursPerDay * (input.utilizationPercent / 100)
  const hourly = annualRevenue / billableHours
  const hourlyAsk = Math.ceil(hourly)
  return {
    monthlyProfit,
    monthlyRevenue,
    annualRevenue,
    workDays,
    billableHours,
    hourly,
    hourlyAsk,
    dayAsk: hourlyAsk * input.hoursPerDay,
  }
}

export function blankLine(unitPrice = 0): Line {
  return {
    id: crypto.randomUUID(),
    description: "",
    quantity: 1,
    unit: "Stunde",
    unitPrice,
  }
}

export function blankDoc(kind: DocKind, profile: Profile, today: string): Doc {
  return {
    id: crypto.randomUUID(),
    kind,
    number: "",
    clientId: "",
    status: "draft",
    issuedOn: today,
    serviceOn: today,
    dueOn: addDays(today, profile.paymentTermsDays || 14),
    lines: [blankLine(profile.defaultRate)],
    vatRate: profile.smallBusiness ? 0 : 19,
    note: "",
    paidOn: "",
  }
}

export function totals(doc: Doc): { net: number; vat: number; gross: number; rate: number } {
  const net = money(doc.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0))
  const rate = doc.vatRate
  const vat = money((net * rate) / 100)
  return { net, vat, gross: money(net + vat), rate }
}

export function formatSerial(prefix: string, year: number, serial: number): string {
  return `${prefix}-${year}-${String(serial).padStart(3, "0")}`
}

export function isOverdue(doc: Doc, today: string): boolean {
  return doc.kind === "invoice" && doc.status === "open" && doc.dueOn < today
}

export function statusLabel(doc: Doc, today: string): string {
  if (isOverdue(doc, today)) return "Überfällig"
  if (doc.kind === "quote" && doc.status === "open") return "Verschickt"
  switch (doc.status) {
    case "draft":
      return "Entwurf"
    case "open":
      return "Offen"
    case "paid":
      return "Bezahlt"
    case "cancelled":
      return "Storniert"
    case "accepted":
      return "Angenommen"
    case "declined":
      return "Abgelehnt"
  }
}

export function summarize(docs: Doc[], today: string) {
  let open = 0
  let overdue = 0
  let paidMonth = 0
  let quotes = 0
  const month = today.slice(0, 7)
  for (const doc of docs) {
    if (doc.status === "cancelled" || doc.status === "declined") continue
    const gross = totals(doc).gross
    if (doc.kind === "quote") {
      if (doc.status === "open" || doc.status === "accepted") quotes += gross
      continue
    }
    if (doc.status === "paid" && doc.paidOn.slice(0, 7) === month) paidMonth += gross
    if (doc.status === "open") {
      open += gross
      if (doc.dueOn < today) overdue += gross
    }
  }
  return {
    open: money(open),
    overdue: money(overdue),
    paidMonth: money(paidMonth),
    quotes: money(quotes),
  }
}

export function validateIssue(doc: Doc, profile: Profile): FieldError[] {
  const errors: FieldError[] = []
  const push = (field: string, message: string) => errors.push({ field, message })
  if (!profile.legalName.trim()) push("legalName", "Dein Name oder deine Firma fehlt.")
  if (!profile.street.trim() || !profile.zip.trim() || !profile.city.trim()) {
    push("address", "Deine Anschrift ist unvollständig.")
  }
  if (!profile.taxNumber.trim() && !profile.vatId.trim()) {
    push("tax", "Steuernummer oder USt-IdNr. fehlt.")
  }
  if (!profile.iban.trim()) push("iban", "Die IBAN fehlt.")
  if (!doc.clientId) push("clientId", "Wähle einen Kunden.")
  if (!doc.issuedOn) push("issuedOn", "Das Rechnungsdatum fehlt.")
  if (!doc.serviceOn) push("serviceOn", "Das Leistungsdatum fehlt.")
  if (!doc.dueOn) push("dueOn", "Das Fälligkeitsdatum fehlt.")
  const usable = doc.lines.filter((line) => line.description.trim() && line.quantity > 0)
  if (usable.length === 0) push("lines", "Mindestens eine Position mit Text und Menge.")
  if (doc.lines.some((line) => line.quantity < 0 || line.unitPrice < 0)) {
    push("lines", "Menge und Preis dürfen nicht negativ sein.")
  }
  return errors
}

export function reminderText(doc: Doc, client: Client | undefined, profile: Profile): string {
  const amount = formatEUR(totals(doc).gross)
  const greeting = client?.contact ? `Guten Tag ${client.contact},` : "Guten Tag,"
  const bankLine = [profile.bic, profile.bankName].filter(Boolean).join(", ")
  return [
    greeting,
    "",
    `die Rechnung ${doc.number || "(ohne Nummer)"} über ${amount} ist seit dem ${formatDate(doc.dueOn)} fällig.`,
    "Bitte überweise den offenen Betrag auf dieses Konto:",
    "",
    profile.legalName,
    profile.iban,
    bankLine,
    "",
    "Viele Grüße",
    profile.legalName,
  ]
    .filter((line) => line !== undefined)
    .join("\n")
}

export function toCsv(docs: Doc[], clients: Client[]): string {
  const header = ["Art", "Nummer", "Status", "Kunde", "Datum", "Faellig", "Netto", "Steuersatz", "Steuer", "Brutto"]
  const rows = docs.map((doc) => {
    const client = clients.find((item) => item.id === doc.clientId)
    const sum = totals(doc)
    return [doc.kind, doc.number, doc.status, client?.name ?? "", doc.issuedOn, doc.dueOn, sum.net, sum.rate, sum.vat, sum.gross].join(";")
  })
  return `\uFEFF${[header.join(";"), ...rows].join("\n")}`
}

export function assignNumber(doc: Doc, profile: Profile): { doc: Doc; profile: Profile } {
  if (doc.number) return { doc, profile }
  const year = Number(doc.issuedOn.slice(0, 4)) || new Date().getFullYear()
  if (doc.kind === "invoice") {
    return {
      doc: { ...doc, number: formatSerial(profile.invoicePrefix || "RE", year, profile.nextInvoice) },
      profile: { ...profile, nextInvoice: profile.nextInvoice + 1 },
    }
  }
  return {
    doc: { ...doc, number: formatSerial(profile.quotePrefix || "AG", year, profile.nextQuote) },
    profile: { ...profile, nextQuote: profile.nextQuote + 1 },
  }
}
