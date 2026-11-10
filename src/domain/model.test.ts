import { describe, expect, it } from "vitest"
import {
  computeRate,
  defaultRateInput,
  formatEUR,
  formatSerial,
  isOverdue,
  rateIssues,
  summarize,
  totals,
  validateIssue,
} from "./model"
import { sampleClient, sampleDocs, sampleProfile } from "./sample"

describe("computeRate", () => {
  it("covers net income, tax reserve, and non-billable time", () => {
    const result = computeRate(defaultRateInput)
    expect(result).not.toBeNull()
    expect(result!.workDays).toBe(227)
    expect(result!.billableHours).toBeCloseTo(1089.6, 5)
    expect(result!.hourly).toBeCloseTo(75.48, 2)
    expect(result!.hourlyAsk).toBe(76)
    expect(result!.dayAsk).toBe(608)
    expect(result!.monthlyRevenue).toBeCloseTo(6853.85, 2)
  })

  it("rejects a tax reserve that consumes the whole profit", () => {
    expect(rateIssues({ ...defaultRateInput, taxReservePercent: 100 })).toHaveLength(1)
    expect(computeRate({ ...defaultRateInput, taxReservePercent: 100 })).toBeNull()
  })
})

describe("documents", () => {
  it("sums net invoices and flags overdue ones", () => {
    const open = sampleDocs[0]
    expect(totals(open).gross).toBe(1840)
    expect(isOverdue(open, "2026-11-10")).toBe(false)
    expect(isOverdue(sampleDocs[1], "2026-11-10")).toBe(true)
    expect(isOverdue(sampleDocs[2], "2026-11-10")).toBe(false)
    const summary = summarize(sampleDocs, "2026-11-10")
    expect(summary.open).toBe(2480)
    expect(summary.overdue).toBe(640)
    expect(summary.paidMonth).toBe(1200)
    expect(summary.quotes).toBe(2400)
  })

  it("adds 19 percent VAT on top of the net", () => {
    const withTax = { ...sampleDocs[1], vatRate: 19 }
    expect(totals(withTax)).toEqual({ net: 640, vat: 121.6, gross: 761.6, rate: 19 })
  })

  it("formats the next invoice number", () => {
    expect(formatSerial("RE", 2026, 15)).toBe("RE-2026-015")
    expect(formatEUR(1840).replace(/\s/g, " ")).toBe("1.840,00 €")
  })

  it("blocks an invoice without a customer", () => {
    const errors = validateIssue({ ...sampleDocs[0], clientId: "" }, sampleProfile)
    expect(errors.map((error) => error.field)).toContain("clientId")
    expect(validateIssue(sampleDocs[0], sampleProfile)).toEqual([])
    expect(sampleClient.name).toBe("Atelier Nord GmbH")
  })
})
