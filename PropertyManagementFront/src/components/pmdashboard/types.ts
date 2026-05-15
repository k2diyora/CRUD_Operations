export type Tab = 'properties' | 'tenants' | 'payments'
export type DashboardSection = 'dashboard' | Tab

export type ModalState = { tab: Tab; mode: 'create' | 'edit' } | null

export type FollowUpModalState =
  | { kind: 'addTenantAfterProperty' }
  | { kind: 'addPaymentAfterTenant' }
  | null

export type Property = {
  id: number
  name: string | null
  address: string | null
  city: string | null
  postalCode: string | null
  rentAmount: number
  createdDate: string
}

export type Tenant = {
  id: number
  name: string | null
  email: string | null
  phone: string | null
  propertyId: number
}

export type Payment = {
  id: number
  tenantId: number
  amount: number
  paymentDate: string
  status: string | null
}

export type DashboardSummary = {
  totalProperties: number
  totalTenants: number
  totalPayments: number
  totalRentAmount: number
  totalPaidAmount: number
  pendingPayments: number
  pendingAmount: number
}

export type FieldErrors = Record<string, string>

export type PropertyForm = {
  name: string
  address: string
  city: string
  postalCode: string
  rentAmount: string
}

export type UpdatePropertyForm = PropertyForm & { id: string }

export type TenantForm = {
  name: string
  email: string
  phone: string
  propertyId: string
}

export type UpdateTenantForm = TenantForm & { id: string }

export type PaymentForm = {
  tenantId: string
  amount: string
  paymentDate: string
  status: string
}

export type UpdatePaymentForm = PaymentForm & { id: string }
