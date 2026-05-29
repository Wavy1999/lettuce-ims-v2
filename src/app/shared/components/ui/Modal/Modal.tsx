// ============================================================
//  Modal  –  Portal-based overlay
// ============================================================

import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import styles from './Modal.module.css';

interface ModalProps {
  open:       boolean;
  onClose:    () => void;
  title?:     string;
  maxWidth?:  string;
  children:   React.ReactNode;
  footer?:    React.ReactNode;
  /** Prevent closing on backdrop click */
  static?:    boolean;
}

export const Modal: React.FC<ModalProps> = ({
  open, onClose, title, maxWidth = '520px',
  children, footer, static: isStatic = false,
}) => {
  // Lock scroll while open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return ()  => { document.body.style.overflow = ''; };
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isStatic) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, isStatic]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      className={styles.overlay}
      onClick={isStatic ? undefined : onClose}
      data-testid="modal-overlay"
      role="dialog"
      aria-modal
    >
      <div
        className={styles.modal}
        style={{ maxWidth }}
        onClick={e => e.stopPropagation()}
        data-testid="modal"
      >
        {title && (
          <div className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
            <button
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close modal"
              data-testid="modal-close"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        )}
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
