import type { Dispatch, FormEventHandler, SetStateAction } from 'react'
import type {
  FieldErrors,
  ModalState,
  PaymentForm,
  Property,
  PropertyForm,
  Tenant,
  TenantForm,
  UpdatePaymentForm,
  UpdatePropertyForm,
  UpdateTenantForm,
} from './types'
import { paymentStatuses } from './utils'

type EntityModalProps = {
  modal: ModalState
  modalError: string
  fieldErrors: FieldErrors
  properties: Property[]
  tenants: Tenant[]
  createProperty: PropertyForm
  setCreateProperty: Dispatch<SetStateAction<PropertyForm>>
  updateProperty: UpdatePropertyForm
  setUpdateProperty: Dispatch<SetStateAction<UpdatePropertyForm>>
  createTenant: TenantForm
  setCreateTenant: Dispatch<SetStateAction<TenantForm>>
  updateTenant: UpdateTenantForm
  setUpdateTenant: Dispatch<SetStateAction<UpdateTenantForm>>
  createPayment: PaymentForm
  setCreatePayment: Dispatch<SetStateAction<PaymentForm>>
  updatePayment: UpdatePaymentForm
  setUpdatePayment: Dispatch<SetStateAction<UpdatePaymentForm>>
  onClose: () => void
  onCreateProperty: FormEventHandler
  onUpdateProperty: FormEventHandler
  onCreateTenant: FormEventHandler
  onUpdateTenant: FormEventHandler
  onCreatePayment: FormEventHandler
  onUpdatePayment: FormEventHandler
}

function EntityModal({
  modal,
  modalError,
  fieldErrors,
  properties,
  tenants,
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
  onClose,
  onCreateProperty,
  onUpdateProperty,
  onCreateTenant,
  onUpdateTenant,
  onCreatePayment,
  onUpdatePayment,
}: EntityModalProps) {
  if (!modal) {
    return null
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.currentTarget === e.target && onClose()}>
      <div className="modal-card">
        <div className="modal-header">
          <h3>{modal.mode === 'create' ? 'Create' : 'Edit'} {modal.tab.slice(0, -1)}</h3>
          <button type="button" className="icon-btn" onClick={onClose}>×</button>
        </div>

        {modalError && <p className="status error">{modalError}</p>}

        {modal.tab === 'properties' && modal.mode === 'create' && (
          <form onSubmit={onCreateProperty}>
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
          <form onSubmit={onUpdateProperty}>
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
          <form onSubmit={onCreateTenant}>
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
          <form onSubmit={onUpdateTenant}>
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
          <form onSubmit={onCreatePayment}>
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
          <form onSubmit={onUpdatePayment}>
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
  )
}

export default EntityModal
