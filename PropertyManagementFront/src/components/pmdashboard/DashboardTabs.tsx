import type { DashboardSection } from './types'

type DashboardTabsProps = {
  activeSection: DashboardSection
  onSectionChange: (section: DashboardSection) => void
}

function DashboardTabs({ activeSection, onSectionChange }: DashboardTabsProps) {
  return (
    <nav className="tabs" aria-label="Dashboard sections">
      <button className={activeSection === 'dashboard' ? 'active' : ''} onClick={() => onSectionChange('dashboard')}>
        Dashboard
      </button>
      <button className={activeSection === 'properties' ? 'active' : ''} onClick={() => onSectionChange('properties')}>
        Properties
      </button>
      <button className={activeSection === 'tenants' ? 'active' : ''} onClick={() => onSectionChange('tenants')}>
        Tenants
      </button>
      <button className={activeSection === 'payments' ? 'active' : ''} onClick={() => onSectionChange('payments')}>
        Payments
      </button>
    </nav>
  )
}

export default DashboardTabs
