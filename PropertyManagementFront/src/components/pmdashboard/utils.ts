import type { DashboardSummary, FieldErrors, Payment, Property, Tenant } from './types'

function getRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
}

function readString(record: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string') {
      return value
    }
  }

  return null
}

function readNumber(record: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'number') {
      return value
    }
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value)
      if (!Number.isNaN(parsed)) {
        return parsed
      }
    }
  }

  return 0
}

export function mapDashboardSummary(value: unknown): DashboardSummary {
  const record = getRecord(value)
  return {
    totalProperties: readNumber(record, 'totalProperties', 'TotalProperties'),
    totalTenants: readNumber(record, 'totalTenants', 'TotalTenants'),
    totalPayments: readNumber(record, 'totalPayments', 'TotalPayments'),
    totalRentAmount: readNumber(record, 'totalRentAmount', 'TotalRentAmount'),
    totalPaidAmount: readNumber(record, 'totalPaidAmount', 'TotalPaidAmount'),
    pendingPayments: readNumber(record, 'pendingPayments', 'PendingPayments'),
    pendingAmount: readNumber(record, 'pendingAmount', 'PendingAmount'),
  }
}

export function mapProperty(value: unknown): Property {
  const record = getRecord(value)
  return {
    id: readNumber(record, 'id', 'Id'),
    name: readString(record, 'name', 'Name'),
    address: readString(record, 'address', 'Address'),
    city: readString(record, 'city', 'City'),
    postalCode: readString(record, 'postalCode', 'PostalCode'),
    rentAmount: readNumber(record, 'rentAmount', 'RentAmount'),
    createdDate: readString(record, 'createdDate', 'CreatedDate') ?? '',
  }
}

export function mapTenant(value: unknown): Tenant {
  const record = getRecord(value)
  return {
    id: readNumber(record, 'id', 'Id'),
    name: readString(record, 'name', 'Name'),
    email: readString(record, 'email', 'Email'),
    phone: readString(record, 'phone', 'Phone'),
    propertyId: readNumber(record, 'propertyId', 'PropertyId'),
  }
}

export function mapPayment(value: unknown): Payment {
  const record = getRecord(value)
  return {
    id: readNumber(record, 'id', 'Id'),
    tenantId: readNumber(record, 'tenantId', 'TenantId'),
    amount: readNumber(record, 'amount', 'Amount'),
    paymentDate: readString(record, 'paymentDate', 'PaymentDate') ?? '',
    status: readString(record, 'status', 'Status'),
  }
}

export function parseRequiredInt(value: string, fieldName: string): number {
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed)) {
    throw new Error(`${fieldName} must be a valid number`)
  }

  return parsed
}

export function parseRequiredDecimal(value: string, fieldName: string): number {
  const parsed = Number.parseFloat(value)
  if (Number.isNaN(parsed)) {
    throw new Error(`${fieldName} must be a valid number`)
  }

  return parsed
}

export function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

export function normalizeDateMinute(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 16)
}

export function toDateTimeLocal(value: string): string {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

export function getFirstError(errors: FieldErrors): string | null {
  const firstKey = Object.keys(errors)[0]
  return firstKey ? errors[firstKey] : null
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
  }).format(value)
}

export const emptySummary: DashboardSummary = {
  totalProperties: 0,
  totalTenants: 0,
  totalPayments: 0,
  totalRentAmount: 0,
  totalPaidAmount: 0,
  pendingPayments: 0,
  pendingAmount: 0,
}

export const paymentStatuses = ['Pending', 'Paid', 'Failed'] as const
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const phoneRegex = /^\+?[0-9]{7,15}$/
export const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/
export const amountRegex = /^\d+(\.\d{1,2})?$/
