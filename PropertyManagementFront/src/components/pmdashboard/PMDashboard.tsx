import DashboardTable from './DashboardTable'
import DashboardTabs from './DashboardTabs'
import EntityModal from './EntityModal'
import FollowUpModal from './FollowUpModal'
import type { DashboardSection, Tab } from './types'
import { usePMDashboard } from './usePMDashboard'
import SummaryCards from './SummaryCards'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

function getSectionFromPath(pathname: string): DashboardSection {
  if (pathname.startsWith('/properties')) return 'properties'
  if (pathname.startsWith('/tenants')) return 'tenants'
  if (pathname.startsWith('/payments')) return 'payments'
  return 'dashboard'
}

function getTabTitle(tab: Tab): string {
  if (tab === 'properties') return 'Properties'
  if (tab === 'tenants') return 'Tenants'
  return 'Payments'
}

function PMDashboard() {
  const dashboard = usePMDashboard()
  const { activeTab, setActiveTab } = dashboard
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const activeSection = getSectionFromPath(location.pathname)
  const isDashboardPage = activeSection === 'dashboard'

  useEffect(() => {
    if (!isDashboardPage && activeTab !== activeSection) {
      setActiveTab(activeSection)
    }
  }, [activeSection, activeTab, isDashboardPage, setActiveTab])

  const handleSectionChange = (section: DashboardSection) => {
    if (section !== 'dashboard') {
      setActiveTab(section)
    }

    navigate(`/${section}`)
  }

  return (
    <main className="app" aria-busy={dashboard.loading}>
      <div className="dashboard-layout">
        <aside className="sidebar">
          <DashboardTabs activeSection={activeSection} onSectionChange={handleSectionChange} />
        </aside>

        <section className="content-area">
          <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ color: '#1e293b', fontSize: '28px', fontWeight: 'bold' }}>Property Management</h1>
              <p className="muted" style={{ fontSize: '15px' }}>Manage properties, tenants, and payments automatically</p>
            </div>
            <button onClick={logout} className="btn-logout">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Logout
            </button>
          </header>

          <SummaryCards summary={dashboard.summary} />

          {!isDashboardPage && (
            <DashboardTable
              activeTab={activeSection}
              title={getTabTitle(activeSection)}
              loading={dashboard.loading}
              message={dashboard.message}
              error={dashboard.error}
              properties={dashboard.properties}
              tenants={dashboard.tenants}
              payments={dashboard.payments}
              onAddNew={dashboard.startCreate}
              onEditProperty={dashboard.startEditProperty}
              onEditTenant={dashboard.startEditTenant}
              onEditPayment={dashboard.startEditPayment}
              onDeleteProperty={dashboard.deletePropertyById}
              onDeleteTenant={dashboard.deleteTenantById}
              onDeletePayment={dashboard.deletePaymentById}
              getPropertyDisplayName={dashboard.getPropertyDisplayName}
              getTenantDisplayName={dashboard.getTenantDisplayName}
            />
          )}
        </section>
      </div>

      <EntityModal
        modal={dashboard.modal}
        modalError={dashboard.modalError}
        fieldErrors={dashboard.fieldErrors}
        properties={dashboard.properties}
        tenants={dashboard.tenants}
        createProperty={dashboard.createProperty}
        setCreateProperty={dashboard.setCreateProperty}
        updateProperty={dashboard.updateProperty}
        setUpdateProperty={dashboard.setUpdateProperty}
        createTenant={dashboard.createTenant}
        setCreateTenant={dashboard.setCreateTenant}
        updateTenant={dashboard.updateTenant}
        setUpdateTenant={dashboard.setUpdateTenant}
        createPayment={dashboard.createPayment}
        setCreatePayment={dashboard.setCreatePayment}
        updatePayment={dashboard.updatePayment}
        setUpdatePayment={dashboard.setUpdatePayment}
        onClose={dashboard.closeModal}
        onCreateProperty={dashboard.handleCreateProperty}
        onUpdateProperty={dashboard.handleUpdateProperty}
        onCreateTenant={dashboard.handleCreateTenant}
        onUpdateTenant={dashboard.handleUpdateTenant}
        onCreatePayment={dashboard.handleCreatePayment}
        onUpdatePayment={dashboard.handleUpdatePayment}
      />

      <FollowUpModal
        followUpModal={dashboard.followUpModal}
        onYes={dashboard.handleFollowUpYes}
        onNo={dashboard.handleFollowUpNo}
      />

      {dashboard.loading && (
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
