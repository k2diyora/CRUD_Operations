import type { FollowUpModalState } from './types'

type FollowUpModalProps = {
  followUpModal: FollowUpModalState
  onYes: () => void
  onNo: () => void
}

function FollowUpModal({ followUpModal, onYes, onNo }: FollowUpModalProps) {
  if (!followUpModal) {
    return null
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.currentTarget === e.target && onNo()}>
      <div className="modal-card">
        <div className="modal-header">
          <h3>Continue Setup</h3>
          <button type="button" className="icon-btn" onClick={onNo}>×</button>
        </div>

        <p className="followup-message">
          {followUpModal.kind === 'addTenantAfterProperty'
            ? 'Property added successfully. Do you want to add a tenant now?'
            : 'Tenant added successfully. Do you want to add a payment now?'}
        </p>

        <div className="followup-actions">
          <button type="button" onClick={onNo}>No</button>
          <button type="button" className="primary" onClick={onYes}>Yes</button>
        </div>
      </div>
    </div>
  )
}

export default FollowUpModal
