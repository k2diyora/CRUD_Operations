import type { Payment, Property, Tab, Tenant } from './types'

type DashboardTableProps = {
  activeTab: Tab
  title: string
  loading: boolean
  message: string
  error: string
  properties: Property[]
  tenants: Tenant[]
  payments: Payment[]
  onAddNew: () => void
  onEditProperty: (property: Property) => void
  onEditTenant: (tenant: Tenant) => void
  onEditPayment: (payment: Payment) => void
  onDeleteProperty: (id: number) => Promise<void>
  onDeleteTenant: (id: number) => Promise<void>
  onDeletePayment: (id: number) => Promise<void>
  getPropertyDisplayName: (propertyId: number) => string
  getTenantDisplayName: (tenantId: number) => string
}

function DashboardTable({
  activeTab,
  title,
  loading,
  message,
  error,
  properties,
  tenants,
  payments,
  onAddNew,
  onEditProperty,
  onEditTenant,
  onEditPayment,
  onDeleteProperty,
  onDeleteTenant,
  onDeletePayment,
  getPropertyDisplayName,
  getTenantDisplayName,
}: DashboardTableProps) {
  return (
    <section className="table-card">
      <div className="table-toolbar">
        <h2>{title}</h2>
        <button type="button" className="primary" onClick={onAddNew}>Add New</button>
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
                <td className="actions-cell">
                  <button type="button" onClick={() => onEditProperty(property)}>Edit</button>
                  <button type="button" className="danger" onClick={() => void onDeleteProperty(property.id)}>Delete</button>
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
                  <button type="button" onClick={() => onEditTenant(tenant)}>Edit</button>
                  <button type="button" className="danger" onClick={() => void onDeleteTenant(tenant.id)}>Delete</button>
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
                  <button type="button" onClick={() => onEditPayment(payment)}>Edit</button>
                  <button type="button" className="danger" onClick={() => void onDeletePayment(payment.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

export default DashboardTable
