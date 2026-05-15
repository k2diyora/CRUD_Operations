import type { DashboardSummary } from './types'
import { formatCurrency } from './utils'

type SummaryCardsProps = {
  summary: DashboardSummary
}

function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <section className="summary-grid" aria-label="Dashboard summary">
      <article className="summary-card">
        <p className="summary-label">Total Properties</p>
        <p className="summary-value">{summary.totalProperties}</p>
      </article>
      <article className="summary-card">
        <p className="summary-label">Total Tenants</p>
        <p className="summary-value">{summary.totalTenants}</p>
      </article>
      <article className="summary-card">
        <p className="summary-label">Total Payments</p>
        <p className="summary-value">{summary.totalPayments}</p>
      </article>
      <article className="summary-card">
        <p className="summary-label">Monthly Rent (sum)</p>
        <p className="summary-value">{formatCurrency(summary.totalRentAmount)}</p>
      </article>
      <article className="summary-card">
        <p className="summary-label">Paid Amount</p>
        <p className="summary-value">{formatCurrency(summary.totalPaidAmount)}</p>
      </article>
      <article className="summary-card">
        <p className="summary-label">Pending Payments</p>
        <p className="summary-value">{summary.pendingPayments}</p>
      </article>
      <article className="summary-card">
        <p className="summary-label">Pending Amount</p>
        <p className="summary-value">{formatCurrency(summary.pendingAmount)}</p>
      </article>
    </section>
  )
}

export default SummaryCards
