import * as React from 'react'
import type { FormEvent } from 'react'
import {
  createPayment as createPaymentRequest,
  createProperty as createPropertyRequest,
  createTenant as createTenantRequest,
  deletePayment as deletePaymentRequest,
  deleteProperty as deletePropertyRequest,
  deleteTenant as deleteTenantRequest,
  getPayments,
  getProperties,
  getTenants,
  updatePayment as updatePaymentRequest,
  updateProperty as updatePropertyRequest,
  updateTenant as updateTenantRequest,
} from '../services/appservices.ts'

const { useEffect, useState } = React

type Tab = 'properties' | 'tenants' | 'payments'
type ModalState = { tab: Tab; mode: 'create' | 'edit' } | null
type FollowUpModalState =
  | { kind: 'addTenantAfterProperty' }
  | { kind: 'addPaymentAfterTenant' }
  | null

type Property = {
  id: number
  name: string | null
  address: string | null
  city: string | null
  postalCode: string | null
  rentAmount: number
  createdDate: string
}

type Tenant = {
  id: number
  name: string | null
  email: string | null
  phone: string | null
  propertyId: number
}

type Payment = {
  id: number
  tenantId: number
  amount: number
  paymentDate: string
  status: string | null
}

type FieldErrors = Record<string, string>

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

function toDateTimeLocal(value: string): string {
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

function mapProperty(value: unknown): Property {
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

function mapTenant(value: unknown): Tenant {
  const record = getRecord(value)
  return {
    id: readNumber(record, 'id', 'Id'),
    name: readString(record, 'name', 'Name'),
    email: readString(record, 'email', 'Email'),
    phone: readString(record, 'phone', 'Phone'),
    propertyId: readNumber(record, 'propertyId', 'PropertyId'),
  }
}

function mapPayment(value: unknown): Payment {
  const record = getRecord(value)
  return {
    id: readNumber(record, 'id', 'Id'),
    tenantId: readNumber(record, 'tenantId', 'TenantId'),
    amount: readNumber(record, 'amount', 'Amount'),
    paymentDate: readString(record, 'paymentDate', 'PaymentDate') ?? '',
    status: readString(record, 'status', 'Status'),
  }
}

function parseRequiredInt(value: string, fieldName: string): number {
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed)) {
    throw new Error(`${fieldName} must be a valid number`)
  }

  return parsed
}

function parseRequiredDecimal(value: string, fieldName: string): number {
  const parsed = Number.parseFloat(value)
  if (Number.isNaN(parsed)) {
    throw new Error(`${fieldName} must be a valid number`)
  }

  return parsed
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

function normalizeDateMinute(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 16)
}

function getFirstError(errors: FieldErrors): string | null {
  const firstKey = Object.keys(errors)[0]
  return firstKey ? errors[firstKey] : null
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^\+?[0-9]{7,15}$/
const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/
const amountRegex = /^\d+(\.\d{1,2})?$/
const paymentStatuses = ['Pending', 'Paid', 'Failed'] as const

function PMDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('properties')
  const [modal, setModal] = useState<ModalState>(null)
  const [followUpModal, setFollowUpModal] = useState<FollowUpModalState>(null)

  const [properties, setProperties] = useState<Property[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [payments, setPayments] = useState<Payment[]>([])

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const [createProperty, setCreateProperty] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    rentAmount: '',
  })
  const [updateProperty, setUpdateProperty] = useState({
    id: '',
    name: '',
    address: '',
    city: '',
    postalCode: '',
    rentAmount: '',
  })

  const [createTenant, setCreateTenant] = useState({
    name: '',
    email: '',
    phone: '',
    propertyId: '',
  })
  const [updateTenant, setUpdateTenant] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    propertyId: '',
  })

  const [createPayment, setCreatePayment] = useState({
    tenantId: '',
    amount: '',
    paymentDate: '',
    status: '',
  })
  const [updatePayment, setUpdatePayment] = useState({
    id: '',
    tenantId: '',
    amount: '',
    paymentDate: '',
    status: '',
  })

  const clearModalValidation = () => {
    setModalError('')
    setFieldErrors({})
  }

  const validatePropertyForm = (form: { name: string; address: string; city: string; postalCode: string; rentAmount: string }): FieldErrors => {
    const name = form.name.trim()
    const address = form.address.trim()
    const city = form.city.trim()
    const postalCode = form.postalCode.trim()
    const rentAmount = form.rentAmount.trim()
    const errors: FieldErrors = {}

    if (name.length < 3 || name.length > 100) errors.name = 'Property name must be between 3 and 100 characters'
    if (address && (address.length < 5 || address.length > 200)) errors.address = 'Address must be between 5 and 200 characters'
    if (city && (city.length < 2 || city.length > 100)) errors.city = 'City must be between 2 and 100 characters'
    if (postalCode && !postalCodeRegex.test(postalCode)) errors.postalCode = 'Postal code must match format A1A 1A1 (for example: N2P 0G2)'
    if (!amountRegex.test(rentAmount)) errors.rentAmount = 'Rent amount can have up to 2 decimal places'

    const parsedRent = Number.parseFloat(rentAmount)
    if (Number.isNaN(parsedRent) || parsedRent <= 0) errors.rentAmount = 'Rent amount must be greater than 0'

    return errors
  }

  const validateTenantForm = (form: { name: string; email: string; phone: string; propertyId: string }): FieldErrors => {
    const name = form.name.trim()
    const email = form.email.trim()
    const phone = form.phone.trim()
    const errors: FieldErrors = {}

    if (name.length < 2 || name.length > 100) errors.name = 'Tenant name must be between 2 and 100 characters'
    if (!emailRegex.test(email)) errors.email = 'Email format is invalid'
    if (!phoneRegex.test(phone)) errors.phone = 'Phone must be 7 to 15 digits and can start with +'

    const propertyId = Number.parseInt(form.propertyId, 10)
    if (Number.isNaN(propertyId)) errors.propertyId = 'Property id must be a valid number'
    if (!Number.isNaN(propertyId) && !properties.some((property) => property.id === propertyId)) {
      errors.propertyId = 'Selected property does not exist'
    }

    return errors
  }

  const validatePaymentForm = (form: { tenantId: string; amount: string; paymentDate: string; status: string }): FieldErrors => {
    const amount = form.amount.trim()
    const status = form.status.trim()
    const errors: FieldErrors = {}

    const tenantId = Number.parseInt(form.tenantId, 10)
    if (Number.isNaN(tenantId)) errors.tenantId = 'Tenant id must be a valid number'
    if (!Number.isNaN(tenantId) && !tenants.some((tenant) => tenant.id === tenantId)) {
      errors.tenantId = 'Selected tenant does not exist'
    }

    if (!amountRegex.test(amount)) errors.amount = 'Amount can have up to 2 decimal places'
    const parsedAmount = Number.parseFloat(amount)
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) errors.amount = 'Amount must be greater than 0'

    const date = new Date(form.paymentDate)
    if (Number.isNaN(date.getTime())) errors.paymentDate = 'Payment date is invalid'
    if (!Number.isNaN(date.getTime()) && date.getTime() > Date.now()) errors.paymentDate = 'Payment date cannot be in the future'

    if ((paymentStatuses as readonly string[]).indexOf(status) === -1) {
      errors.status = `Status must be one of: ${paymentStatuses.join(', ')}`
    }

    return errors
  }

  const loadAll = async () => {
    setLoading(true)
    setError('')
    try {
      const [propertyData, tenantData, paymentData] = await Promise.all([getProperties(), getTenants(), getPayments()])

      setProperties((propertyData as unknown[]).map(mapProperty))
      setTenants((tenantData as unknown[]).map(mapTenant))
      setPayments((paymentData as unknown[]).map(mapPayment))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  useEffect(() => {
    if (!message) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setMessage('')
    }, 3000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [message])

  const runAction = async (action: () => Promise<void>): Promise<boolean> => {
    setError('')
    setMessage('')
    setLoading(true)
    try {
      await action()
      await loadAll()
      setMessage('Operation completed successfully')
      return true
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : 'Operation failed'
      setError(message)
      setModalError(message)
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProperty = async (event: FormEvent) => {
    event.preventDefault()
    const validationErrors = validatePropertyForm(createProperty)
    const validationMessage = getFirstError(validationErrors)
    if (validationMessage) {
      setFieldErrors({})
      setModalError(validationMessage)
      return
    }

    setFieldErrors({})

    const inputAddress = normalizeText(createProperty.address)
    const hasDuplicateProperty = inputAddress
      ? properties.some(
          (property) =>
            normalizeText(property.name) === normalizeText(createProperty.name) &&
            normalizeText(property.address) === inputAddress,
        )
      : false

    if (hasDuplicateProperty) {
      setModalError('Duplicate property found with same name and address')
      return
    }

    setModalError('')

    const isSuccess = await runAction(async () => {
      await createPropertyRequest({
        name: createProperty.name,
        address: createProperty.address || undefined,
        city: createProperty.city || undefined,
        postalCode: createProperty.postalCode || undefined,
        rentAmount: parseRequiredDecimal(createProperty.rentAmount, 'Rent amount'),
      })

      setCreateProperty({ name: '', address: '', city: '', postalCode: '', rentAmount: '' })
      setModal(null)
    })

    if (isSuccess) {
      setFollowUpModal({ kind: 'addTenantAfterProperty' })
    }
  }

  const handleUpdateProperty = async (event: FormEvent) => {
    event.preventDefault()
    const validationErrors = validatePropertyForm(updateProperty)
    const validationMessage = getFirstError(validationErrors)
    if (validationMessage) {
      setFieldErrors({})
      setModalError(validationMessage)
      return
    }

    setFieldErrors({})

    const currentId = parseRequiredInt(updateProperty.id, 'Property id')
    const inputAddress = normalizeText(updateProperty.address)
    const hasDuplicateProperty = inputAddress
      ? properties.some(
          (property) =>
            property.id !== currentId &&
            normalizeText(property.name) === normalizeText(updateProperty.name) &&
            normalizeText(property.address) === inputAddress,
        )
      : false

    if (hasDuplicateProperty) {
      setModalError('Duplicate property found with same name and address')
      return
    }

    setModalError('')

    await runAction(async () => {
      await updatePropertyRequest({
        id: currentId,
        name: updateProperty.name.trim(),
        address: updateProperty.address.trim(),
        city: updateProperty.city.trim(),
        postalCode: updateProperty.postalCode.trim(),
        rentAmount: parseRequiredDecimal(updateProperty.rentAmount, 'Rent amount'),
      })

      setModal(null)
    })
  }

  const handleCreateTenant = async (event: FormEvent) => {
    event.preventDefault()
    const validationErrors = validateTenantForm(createTenant)
    const validationMessage = getFirstError(validationErrors)
    if (validationMessage) {
      setFieldErrors({})
      setModalError(validationMessage)
      return
    }

    setFieldErrors({})

    const createTenantPropertyId = parseRequiredInt(createTenant.propertyId, 'Property id')
    const hasDuplicateTenant = tenants.some(
      (tenant) =>
        normalizeText(tenant.email) === normalizeText(createTenant.email) &&
        normalizeText(tenant.name) === normalizeText(createTenant.name) &&
        tenant.propertyId === createTenantPropertyId,
    )

    if (hasDuplicateTenant) {
      setModalError('Duplicate tenant found with same email, name and property')
      return
    }

    setModalError('')

    const isSuccess = await runAction(async () => {
      await createTenantRequest({
        name: createTenant.name,
        email: createTenant.email,
        phone: createTenant.phone || undefined,
        propertyId: createTenantPropertyId,
      })

      setCreateTenant({ name: '', email: '', phone: '', propertyId: '' })
      setModal(null)
    })

    if (isSuccess) {
      setFollowUpModal({ kind: 'addPaymentAfterTenant' })
    }
  }

  const handleUpdateTenant = async (event: FormEvent) => {
    event.preventDefault()
    const validationErrors = validateTenantForm(updateTenant)
    const validationMessage = getFirstError(validationErrors)
    if (validationMessage) {
      setFieldErrors({})
      setModalError(validationMessage)
      return
    }

    setFieldErrors({})

    const currentId = parseRequiredInt(updateTenant.id, 'Tenant id')
    const updateTenantPropertyId = parseRequiredInt(updateTenant.propertyId, 'Property id')
    const hasDuplicateTenant = tenants.some(
      (tenant) =>
        tenant.id !== currentId &&
        normalizeText(tenant.email) === normalizeText(updateTenant.email) &&
        normalizeText(tenant.name) === normalizeText(updateTenant.name) &&
        tenant.propertyId === updateTenantPropertyId,
    )

    if (hasDuplicateTenant) {
      setModalError('Duplicate tenant found with same email, name and property')
      return
    }

    setModalError('')

    await runAction(async () => {
      await updateTenantRequest({
        id: currentId,
        name: updateTenant.name.trim(),
        email: updateTenant.email.trim(),
        phone: updateTenant.phone.trim(),
        propertyId: parseRequiredInt(updateTenant.propertyId, 'Property id'),
      })

      setModal(null)
    })
  }

  const handleCreatePayment = async (event: FormEvent) => {
    event.preventDefault()
    const validationErrors = validatePaymentForm(createPayment)
    const validationMessage = getFirstError(validationErrors)
    if (validationMessage) {
      setFieldErrors({})
      setModalError(validationMessage)
      return
    }

    setFieldErrors({})

    const createTenantId = parseRequiredInt(createPayment.tenantId, 'Tenant id')
    const createAmount = parseRequiredDecimal(createPayment.amount, 'Amount')
    const createPaymentDate = normalizeDateMinute(createPayment.paymentDate)
    const hasDuplicatePayment = payments.some(
      (payment) =>
        payment.tenantId === createTenantId &&
        payment.amount === createAmount &&
        normalizeDateMinute(payment.paymentDate) === createPaymentDate,
    )

    if (hasDuplicatePayment) {
      setModalError('Duplicate payment found with same tenant, payment date and amount')
      return
    }

    setModalError('')

    await runAction(async () => {
      await createPaymentRequest({
        tenantId: createTenantId,
        amount: createAmount,
        paymentDate: new Date(createPayment.paymentDate).toISOString(),
        status: createPayment.status,
      })

      setCreatePayment({ tenantId: '', amount: '', paymentDate: '', status: '' })
      setModal(null)
    })
  }

  const handleUpdatePayment = async (event: FormEvent) => {
    event.preventDefault()
    const validationErrors = validatePaymentForm(updatePayment)
    const validationMessage = getFirstError(validationErrors)
    if (validationMessage) {
      setFieldErrors({})
      setModalError(validationMessage)
      return
    }

    setFieldErrors({})

    const currentId = parseRequiredInt(updatePayment.id, 'Payment id')
    const updateTenantId = parseRequiredInt(updatePayment.tenantId, 'Tenant id')
    const updateAmount = parseRequiredDecimal(updatePayment.amount, 'Amount')
    const updatePaymentDate = normalizeDateMinute(updatePayment.paymentDate)
    const hasDuplicatePayment = payments.some(
      (payment) =>
        payment.id !== currentId &&
        payment.tenantId === updateTenantId &&
        payment.amount === updateAmount &&
        normalizeDateMinute(payment.paymentDate) === updatePaymentDate,
    )

    if (hasDuplicatePayment) {
      setModalError('Duplicate payment found with same tenant, payment date and amount')
      return
    }

    setModalError('')

    await runAction(async () => {
      await updatePaymentRequest({
        id: currentId,
        tenantId: updateTenantId,
        amount: updateAmount,
        paymentDate: new Date(updatePayment.paymentDate).toISOString(),
        status: updatePayment.status.trim(),
      })

      setModal(null)
    })
  }

  const startCreate = () => {
    clearModalValidation()
    if (activeTab === 'properties') {
      setCreateProperty({ name: '', address: '', city: '', postalCode: '', rentAmount: '' })
    }
    if (activeTab === 'tenants') {
      setCreateTenant({ name: '', email: '', phone: '', propertyId: '' })
    }
    if (activeTab === 'payments') {
      setCreatePayment({ tenantId: '', amount: '', paymentDate: '', status: '' })
    }

    setModal({ tab: activeTab, mode: 'create' })
  }

  const startEditProperty = (property: Property) => {
    clearModalValidation()
    setUpdateProperty({
      id: property.id.toString(),
      name: property.name ?? '',
      address: property.address ?? '',
      city: property.city ?? '',
      postalCode: property.postalCode ?? '',
      rentAmount: property.rentAmount.toString(),
    })
    setModal({ tab: 'properties', mode: 'edit' })
  }

  const startEditTenant = (tenant: Tenant) => {
    clearModalValidation()
    setUpdateTenant({
      id: tenant.id.toString(),
      name: tenant.name ?? '',
      email: tenant.email ?? '',
      phone: tenant.phone ?? '',
      propertyId: tenant.propertyId.toString(),
    })
    setModal({ tab: 'tenants', mode: 'edit' })
  }

  const startEditPayment = (payment: Payment) => {
    clearModalValidation()
    setUpdatePayment({
      id: payment.id.toString(),
      tenantId: payment.tenantId.toString(),
      amount: payment.amount.toString(),
      paymentDate: toDateTimeLocal(payment.paymentDate),
      status: payment.status ?? '',
    })
    setModal({ tab: 'payments', mode: 'edit' })
  }

  const deletePropertyById = async (id: number) => {
    if (!window.confirm('Delete this property?')) return
    await runAction(async () => {
      await deletePropertyRequest(id)
    })
  }

  const deleteTenantById = async (id: number) => {
    if (!window.confirm('Delete this tenant?')) return
    await runAction(async () => {
      await deleteTenantRequest(id)
    })
  }

  const deletePaymentById = async (id: number) => {
    if (!window.confirm('Delete this payment?')) return
    await runAction(async () => {
      await deletePaymentRequest(id)
    })
  }

  const getTabTitle = () => {
    if (activeTab === 'properties') return 'Properties'
    if (activeTab === 'tenants') return 'Tenants'
    return 'Payments'
  }

  const getPropertyDisplayName = (propertyId: number) => {
    const property = properties.find((item) => item.id === propertyId)
    return property?.name?.trim() ? property.name : `Property #${propertyId}`
  }

  const getTenantDisplayName = (tenantId: number) => {
    const tenant = tenants.find((item) => item.id === tenantId)
    return tenant?.name?.trim() ? tenant.name : `Tenant #${tenantId}`
  }

  const handleFollowUpYes = () => {
    if (!followUpModal) return

    if (followUpModal.kind === 'addTenantAfterProperty') {
      const lastAddedProperty = properties.reduce<Property | null>(
        (latest, property) => (!latest || property.id > latest.id ? property : latest),
        null,
      )

      setActiveTab('tenants')
      setCreateTenant({ name: '', email: '', phone: '', propertyId: lastAddedProperty ? lastAddedProperty.id.toString() : '' })
      setModal({ tab: 'tenants', mode: 'create' })
    }

    if (followUpModal.kind === 'addPaymentAfterTenant') {
      const lastAddedTenant = tenants.reduce<Tenant | null>(
        (latest, tenant) => (!latest || tenant.id > latest.id ? tenant : latest),
        null,
      )

      setActiveTab('payments')
      setCreatePayment({ tenantId: lastAddedTenant ? lastAddedTenant.id.toString() : '', amount: '', paymentDate: '', status: '' })
      setModal({ tab: 'payments', mode: 'create' })
    }

    setFollowUpModal(null)
  }

  const handleFollowUpNo = () => {
    setFollowUpModal(null)
  }

  return (
    <main className="app" aria-busy={loading}>
      <header className="page-header">
        <h1>Property Management Dashboard</h1>
        <p className="muted">Manage property, tenant, and payment records from one place</p>
      </header>

      <div className="tabs">
        <button className={activeTab === 'properties' ? 'active' : ''} onClick={() => setActiveTab('properties')}>
          Properties
        </button>
        <button className={activeTab === 'tenants' ? 'active' : ''} onClick={() => setActiveTab('tenants')}>
          Tenants
        </button>
        <button className={activeTab === 'payments' ? 'active' : ''} onClick={() => setActiveTab('payments')}>
          Payments
        </button>
      </div>

      <section className="table-card">
        <div className="table-toolbar">
          <h2>{getTabTitle()}</h2>
          <button type="button" className="primary" onClick={startCreate}>Add New</button>
        </div>

        {loading && <p className="status">Loading...</p>}
        {message && <p className="status success">{message}</p>}
        {error && <p className="status error">{error}</p>}

        {activeTab === 'properties' && (
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Name</th>
                <th>Address</th>
                <th>City</th>
                <th>Rent</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property, index) => (
                <tr key={property.id}>
                  <td>{index + 1}</td>
                  <td>{property.name ?? '-'}</td>
                  <td>{property.address ?? '-'}</td>
                  <td>{property.city ?? '-'}</td>
                  <td>{property.rentAmount}</td>
                  <td>{property.createdDate ? new Date(property.createdDate).toLocaleDateString() : '-'}</td>
                  <td className="actions-cell">
                    <button type="button" onClick={() => startEditProperty(property)}>Edit</button>
                    <button type="button" className="danger" onClick={() => void deletePropertyById(property.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'tenants' && (
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Property</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant, index) => (
                <tr key={tenant.id}>
                  <td>{index + 1}</td>
                  <td>{tenant.name ?? '-'}</td>
                  <td>{tenant.email ?? '-'}</td>
                  <td>{tenant.phone ?? '-'}</td>
                  <td>{getPropertyDisplayName(tenant.propertyId)}</td>
                  <td className="actions-cell">
                    <button type="button" onClick={() => startEditTenant(tenant)}>Edit</button>
                    <button type="button" className="danger" onClick={() => void deleteTenantById(tenant.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'payments' && (
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Tenant</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, index) => (
                <tr key={payment.id}>
                  <td>{index + 1}</td>
                  <td>{getTenantDisplayName(payment.tenantId)}</td>
                  <td>{payment.amount}</td>
                  <td>{payment.status ?? '-'}</td>
                  <td>{payment.paymentDate ? new Date(payment.paymentDate).toLocaleString() : '-'}</td>
                  <td className="actions-cell">
                    <button type="button" onClick={() => startEditPayment(payment)}>Edit</button>
                    <button type="button" className="danger" onClick={() => void deletePaymentById(payment.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {modal && (
        <div className="modal-backdrop" onClick={(e) => e.currentTarget === e.target && (setModal(null), clearModalValidation())}>
          <div className="modal-card">
            <div className="modal-header">
              <h3>{modal.mode === 'create' ? 'Create' : 'Edit'} {modal.tab.slice(0, -1)}</h3>
              <button type="button" className="icon-btn" onClick={() => { setModal(null); clearModalValidation() }}>×</button>
            </div>

            {modalError && <p className="status error">{modalError}</p>}

            {modal.tab === 'properties' && modal.mode === 'create' && (
              <form onSubmit={handleCreateProperty}>
                <input placeholder="Name" value={createProperty.name} onChange={(e) => setCreateProperty((p) => ({ ...p, name: e.target.value }))} required />
                {fieldErrors.name && <p className="status error">{fieldErrors.name}</p>}
                <input placeholder="Address" value={createProperty.address} onChange={(e) => setCreateProperty((p) => ({ ...p, address: e.target.value }))} />
                {fieldErrors.address && <p className="status error">{fieldErrors.address}</p>}
                <input placeholder="City" value={createProperty.city} onChange={(e) => setCreateProperty((p) => ({ ...p, city: e.target.value }))} />
                {fieldErrors.city && <p className="status error">{fieldErrors.city}</p>}
                <input placeholder="Postal Code" value={createProperty.postalCode} onChange={(e) => setCreateProperty((p) => ({ ...p, postalCode: e.target.value }))} />
                {fieldErrors.postalCode && <p className="status error">{fieldErrors.postalCode}</p>}
                <input placeholder="Rent Amount" type="number" step="0.01" value={createProperty.rentAmount} onChange={(e) => setCreateProperty((p) => ({ ...p, rentAmount: e.target.value }))} required />
                {fieldErrors.rentAmount && <p className="status error">{fieldErrors.rentAmount}</p>}
                <button type="submit" className="primary">Save</button>
              </form>
            )}

            {modal.tab === 'properties' && modal.mode === 'edit' && (
              <form onSubmit={handleUpdateProperty}>
                <input placeholder="Property Id" type="number" value={updateProperty.id} onChange={(e) => setUpdateProperty((p) => ({ ...p, id: e.target.value }))} required />
                <input placeholder="Name" value={updateProperty.name} onChange={(e) => setUpdateProperty((p) => ({ ...p, name: e.target.value }))} />
                {fieldErrors.name && <p className="status error">{fieldErrors.name}</p>}
                <input placeholder="Address" value={updateProperty.address} onChange={(e) => setUpdateProperty((p) => ({ ...p, address: e.target.value }))} />
                {fieldErrors.address && <p className="status error">{fieldErrors.address}</p>}
                <input placeholder="City" value={updateProperty.city} onChange={(e) => setUpdateProperty((p) => ({ ...p, city: e.target.value }))} />
                {fieldErrors.city && <p className="status error">{fieldErrors.city}</p>}
                <input placeholder="Postal Code" value={updateProperty.postalCode} onChange={(e) => setUpdateProperty((p) => ({ ...p, postalCode: e.target.value }))} />
                {fieldErrors.postalCode && <p className="status error">{fieldErrors.postalCode}</p>}
                <input placeholder="Rent Amount" type="number" step="0.01" value={updateProperty.rentAmount} onChange={(e) => setUpdateProperty((p) => ({ ...p, rentAmount: e.target.value }))} />
                {fieldErrors.rentAmount && <p className="status error">{fieldErrors.rentAmount}</p>}
                <button type="submit" className="primary">Save Changes</button>
              </form>
            )}

            {modal.tab === 'tenants' && modal.mode === 'create' && (
              <form onSubmit={handleCreateTenant}>
                <input placeholder="Name" value={createTenant.name} onChange={(e) => setCreateTenant((t) => ({ ...t, name: e.target.value }))} required />
                {fieldErrors.name && <p className="status error">{fieldErrors.name}</p>}
                <input placeholder="Email" type="email" value={createTenant.email} onChange={(e) => setCreateTenant((t) => ({ ...t, email: e.target.value }))} required />
                {fieldErrors.email && <p className="status error">{fieldErrors.email}</p>}
                <input placeholder="Phone" value={createTenant.phone} onChange={(e) => setCreateTenant((t) => ({ ...t, phone: e.target.value }))} required />
                {fieldErrors.phone && <p className="status error">{fieldErrors.phone}</p>}
                <select value={createTenant.propertyId} onChange={(e) => setCreateTenant((t) => ({ ...t, propertyId: e.target.value }))} required>
                  <option value="">Select Property</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id.toString()}>
                      {property.name?.trim() ? property.name : `Property #${property.id}`}
                    </option>
                  ))}
                </select>
                {fieldErrors.propertyId && <p className="status error">{fieldErrors.propertyId}</p>}
                <button type="submit" className="primary">Save</button>
              </form>
            )}

            {modal.tab === 'tenants' && modal.mode === 'edit' && (
              <form onSubmit={handleUpdateTenant}>
                <input placeholder="Tenant Id" type="number" value={updateTenant.id} onChange={(e) => setUpdateTenant((t) => ({ ...t, id: e.target.value }))} required />
                <input placeholder="Name" value={updateTenant.name} onChange={(e) => setUpdateTenant((t) => ({ ...t, name: e.target.value }))} />
                {fieldErrors.name && <p className="status error">{fieldErrors.name}</p>}
                <input placeholder="Email" type="email" value={updateTenant.email} onChange={(e) => setUpdateTenant((t) => ({ ...t, email: e.target.value }))} />
                {fieldErrors.email && <p className="status error">{fieldErrors.email}</p>}
                <input placeholder="Phone" value={updateTenant.phone} onChange={(e) => setUpdateTenant((t) => ({ ...t, phone: e.target.value }))} required />
                {fieldErrors.phone && <p className="status error">{fieldErrors.phone}</p>}
                <select value={updateTenant.propertyId} onChange={(e) => setUpdateTenant((t) => ({ ...t, propertyId: e.target.value }))} required>
                  <option value="">Select Property</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id.toString()}>
                      {property.name?.trim() ? property.name : `Property #${property.id}`}
                    </option>
                  ))}
                </select>
                {fieldErrors.propertyId && <p className="status error">{fieldErrors.propertyId}</p>}
                <button type="submit" className="primary">Save Changes</button>
              </form>
            )}

            {modal.tab === 'payments' && modal.mode === 'create' && (
              <form onSubmit={handleCreatePayment}>
                <select value={createPayment.tenantId} onChange={(e) => setCreatePayment((p) => ({ ...p, tenantId: e.target.value }))} required>
                  <option value="">Select Tenant</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id.toString()}>
                      {tenant.name?.trim() ? tenant.name : `Tenant #${tenant.id}`}
                    </option>
                  ))}
                </select>
                {fieldErrors.tenantId && <p className="status error">{fieldErrors.tenantId}</p>}
                <input placeholder="Amount" type="number" step="0.01" value={createPayment.amount} onChange={(e) => setCreatePayment((p) => ({ ...p, amount: e.target.value }))} required />
                {fieldErrors.amount && <p className="status error">{fieldErrors.amount}</p>}
                <input placeholder="Payment Date" type="datetime-local" value={createPayment.paymentDate} onChange={(e) => setCreatePayment((p) => ({ ...p, paymentDate: e.target.value }))} required />
                {fieldErrors.paymentDate && <p className="status error">{fieldErrors.paymentDate}</p>}
                <select value={createPayment.status} onChange={(e) => setCreatePayment((p) => ({ ...p, status: e.target.value }))} required>
                  <option value="">Select Status</option>
                  {paymentStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                {fieldErrors.status && <p className="status error">{fieldErrors.status}</p>}
                <button type="submit" className="primary">Save</button>
              </form>
            )}

            {modal.tab === 'payments' && modal.mode === 'edit' && (
              <form onSubmit={handleUpdatePayment}>
                <input placeholder="Payment Id" type="number" value={updatePayment.id} onChange={(e) => setUpdatePayment((p) => ({ ...p, id: e.target.value }))} required />
                <select value={updatePayment.tenantId} onChange={(e) => setUpdatePayment((p) => ({ ...p, tenantId: e.target.value }))} required>
                  <option value="">Select Tenant</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id.toString()}>
                      {tenant.name?.trim() ? tenant.name : `Tenant #${tenant.id}`}
                    </option>
                  ))}
                </select>
                {fieldErrors.tenantId && <p className="status error">{fieldErrors.tenantId}</p>}
                <input placeholder="Amount" type="number" step="0.01" value={updatePayment.amount} onChange={(e) => setUpdatePayment((p) => ({ ...p, amount: e.target.value }))} required />
                {fieldErrors.amount && <p className="status error">{fieldErrors.amount}</p>}
                <input placeholder="Payment Date" type="datetime-local" value={updatePayment.paymentDate} onChange={(e) => setUpdatePayment((p) => ({ ...p, paymentDate: e.target.value }))} required />
                {fieldErrors.paymentDate && <p className="status error">{fieldErrors.paymentDate}</p>}
                <select value={updatePayment.status} onChange={(e) => setUpdatePayment((p) => ({ ...p, status: e.target.value }))} required>
                  <option value="">Select Status</option>
                  {paymentStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                {fieldErrors.status && <p className="status error">{fieldErrors.status}</p>}
                <button type="submit" className="primary">Save Changes</button>
              </form>
            )}
          </div>
        </div>
      )}

      {followUpModal && (
        <div className="modal-backdrop" onClick={(e) => e.currentTarget === e.target && handleFollowUpNo()}>
          <div className="modal-card">
            <div className="modal-header">
              <h3>Continue Setup</h3>
              <button type="button" className="icon-btn" onClick={handleFollowUpNo}>×</button>
            </div>

            <p className="followup-message">
              {followUpModal.kind === 'addTenantAfterProperty'
                ? 'Property added successfully. Do you want to add a tenant now?'
                : 'Tenant added successfully. Do you want to add a payment now?'}
            </p>

            <div className="followup-actions">
              <button type="button" onClick={handleFollowUpNo}>No</button>
              <button type="button" className="primary" onClick={handleFollowUpYes}>Yes</button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-overlay" role="status" aria-live="polite" aria-label="Loading">
          <div className="loading-card">
            <span className="loading-spinner" />
            <span>Please wait...</span>
          </div>
        </div>
      )}
    </main>
  )
}

export default PMDashboard
