import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createPayment as createPaymentRequest,
  createProperty as createPropertyRequest,
  createTenant as createTenantRequest,
  deletePayment as deletePaymentRequest,
  deleteProperty as deletePropertyRequest,
  deleteTenant as deleteTenantRequest,
  getDashboardSummary,
  getPayments,
  getProperties,
  getTenants,
  updatePayment as updatePaymentRequest,
  updateProperty as updatePropertyRequest,
  updateTenant as updateTenantRequest,
} from '../../services/appservices.ts'
import type {
  FieldErrors,
  FollowUpModalState,
  ModalState,
  Payment,
  PaymentForm,
  Property,
  PropertyForm,
  Tab,
  Tenant,
  TenantForm,
  UpdatePaymentForm,
  UpdatePropertyForm,
  UpdateTenantForm,
} from './types'
import {
  amountRegex,
  emailRegex,
  emptySummary,
  getFirstError,
  mapDashboardSummary,
  mapPayment,
  mapProperty,
  mapTenant,
  normalizeDateMinute,
  normalizeText,
  parseRequiredDecimal,
  parseRequiredInt,
  paymentStatuses,
  phoneRegex,
  postalCodeRegex,
  toDateTimeLocal,
} from './utils'

const emptyCreatePropertyForm: PropertyForm = {
  name: '',
  address: '',
  city: '',
  postalCode: '',
  rentAmount: '',
}

const emptyUpdatePropertyForm: UpdatePropertyForm = {
  id: '',
  ...emptyCreatePropertyForm,
}

const emptyCreateTenantForm: TenantForm = {
  name: '',
  email: '',
  phone: '',
  propertyId: '',
}

const emptyUpdateTenantForm: UpdateTenantForm = {
  id: '',
  ...emptyCreateTenantForm,
}

const emptyCreatePaymentForm: PaymentForm = {
  tenantId: '',
  amount: '',
  paymentDate: '',
  status: '',
}

const emptyUpdatePaymentForm: UpdatePaymentForm = {
  id: '',
  ...emptyCreatePaymentForm,
}

export function usePMDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('properties')
  const [modal, setModal] = useState<ModalState>(null)
  const [followUpModal, setFollowUpModal] = useState<FollowUpModalState>(null)

  const [properties, setProperties] = useState<Property[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [summary, setSummary] = useState(emptySummary)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const [createProperty, setCreateProperty] = useState<PropertyForm>(emptyCreatePropertyForm)
  const [updateProperty, setUpdateProperty] = useState<UpdatePropertyForm>(emptyUpdatePropertyForm)
  const [createTenant, setCreateTenant] = useState<TenantForm>(emptyCreateTenantForm)
  const [updateTenant, setUpdateTenant] = useState<UpdateTenantForm>(emptyUpdateTenantForm)
  const [createPayment, setCreatePayment] = useState<PaymentForm>(emptyCreatePaymentForm)
  const [updatePayment, setUpdatePayment] = useState<UpdatePaymentForm>(emptyUpdatePaymentForm)

  const clearModalValidation = () => {
    setModalError('')
    setFieldErrors({})
  }

  const closeModal = () => {
    setModal(null)
    clearModalValidation()
  }

  const validatePropertyForm = (form: PropertyForm): FieldErrors => {
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

  const validateTenantForm = (form: TenantForm): FieldErrors => {
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

  const validatePaymentForm = (form: PaymentForm): FieldErrors => {
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

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      if (activeTab === 'properties') {
        const propertyData = await getProperties()
        setProperties((propertyData as unknown[]).map(mapProperty))
      } else if (activeTab === 'tenants') {
        const promises: Promise<unknown>[] = [getTenants()]
        if (properties.length === 0) promises.push(getProperties())

        const results = await Promise.all(promises)
        setTenants((results[0] as unknown[]).map(mapTenant))
        if (results.length > 1) {
          setProperties((results[1] as unknown[]).map(mapProperty))
        }
      } else if (activeTab === 'payments') {
        const promises: Promise<unknown>[] = [getPayments()]
        if (tenants.length === 0) promises.push(getTenants())

        const results = await Promise.all(promises)
        setPayments((results[0] as unknown[]).map(mapPayment))
        if (results.length > 1) {
          setTenants((results[1] as unknown[]).map(mapTenant))
        }
      }

      try {
        const summaryData = await getDashboardSummary()
        setSummary(mapDashboardSummary(summaryData))
      } catch {
        setSummary(emptySummary)
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [activeTab])

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
      await loadData()
      setMessage('Operation completed successfully')
      return true
    } catch (actionError) {
      const errorMessage = actionError instanceof Error ? actionError.message : 'Operation failed'
      setError(errorMessage)
      setModalError(errorMessage)
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

      setCreateProperty(emptyCreatePropertyForm)
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

      setCreateTenant(emptyCreateTenantForm)
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
    const currentPaymentDate = new Date().toISOString()
    const validationErrors = validatePaymentForm({
      ...createPayment,
      paymentDate: currentPaymentDate,
    })
    const validationMessage = getFirstError(validationErrors)
    if (validationMessage) {
      setFieldErrors({})
      setModalError(validationMessage)
      return
    }

    setFieldErrors({})

    const createTenantId = parseRequiredInt(createPayment.tenantId, 'Tenant id')
    const createAmount = parseRequiredDecimal(createPayment.amount, 'Amount')
    const createPaymentDate = normalizeDateMinute(currentPaymentDate)
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
        paymentDate: currentPaymentDate,
        status: createPayment.status,
      })

      setCreatePayment(emptyCreatePaymentForm)
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
      setCreateProperty(emptyCreatePropertyForm)
    }
    if (activeTab === 'tenants') {
      setCreateTenant(emptyCreateTenantForm)
    }
    if (activeTab === 'payments') {
      setCreatePayment(emptyCreatePaymentForm)
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
      setCreateTenant({ ...emptyCreateTenantForm, propertyId: lastAddedProperty ? lastAddedProperty.id.toString() : '' })
      setModal({ tab: 'tenants', mode: 'create' })
    }

    if (followUpModal.kind === 'addPaymentAfterTenant') {
      const lastAddedTenant = tenants.reduce<Tenant | null>(
        (latest, tenant) => (!latest || tenant.id > latest.id ? tenant : latest),
        null,
      )

      setActiveTab('payments')
      setCreatePayment({ ...emptyCreatePaymentForm, tenantId: lastAddedTenant ? lastAddedTenant.id.toString() : '' })
      setModal({ tab: 'payments', mode: 'create' })
    }

    setFollowUpModal(null)
  }

  const handleFollowUpNo = () => {
    setFollowUpModal(null)
  }

  return {
    activeTab,
    setActiveTab,
    modal,
    setModal,
    followUpModal,
    properties,
    tenants,
    payments,
    summary,
    loading,
    message,
    error,
    modalError,
    fieldErrors,
    createProperty,
    setCreateProperty,
    updateProperty,
    setUpdateProperty,
    createTenant,
    setCreateTenant,
    updateTenant,
    setUpdateTenant,
    createPayment,
    setCreatePayment,
    updatePayment,
    setUpdatePayment,
    startCreate,
    startEditProperty,
    startEditTenant,
    startEditPayment,
    deletePropertyById,
    deleteTenantById,
    deletePaymentById,
    handleCreateProperty,
    handleUpdateProperty,
    handleCreateTenant,
    handleUpdateTenant,
    handleCreatePayment,
    handleUpdatePayment,
    getTabTitle,
    getPropertyDisplayName,
    getTenantDisplayName,
    clearModalValidation,
    closeModal,
    handleFollowUpYes,
    handleFollowUpNo,
  }
}
