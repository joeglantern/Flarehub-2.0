import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { ReactNode } from 'react'

interface ConfirmModalProps {
  open:        boolean
  onClose:     () => void
  onConfirm:   () => void
  title:       string
  description?: string
  children?:   ReactNode
  confirmLabel?: string
  danger?:     boolean
  loading?:    boolean
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmLabel = 'Confirm',
  danger = false,
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children ?? null}
    </Modal>
  )
}
