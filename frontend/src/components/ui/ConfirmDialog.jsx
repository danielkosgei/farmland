import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react';
import './ConfirmDialog.css';

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message,
    type = 'warning', // 'warning', 'danger', 'info', 'success'
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    loading = false
}) {
    const icons = {
        warning: <AlertTriangle className="text-warning-500" size={24} />,
        danger: <AlertCircle className="text-accent-500" size={24} />,
        info: <Info className="text-primary-500" size={24} />,
        success: <CheckCircle className="text-primary-500" size={24} />
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
        >
            <div className="confirm-dialog-content">
                <div className="confirm-dialog-body">
                    <div className="confirm-dialog-icon">
                        {icons[type]}
                    </div>
                    <p className="confirm-dialog-message">{message}</p>
                </div>
                <div className="confirm-dialog-actions">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={type === 'danger' ? 'danger' : 'primary'}
                        onClick={onConfirm}
                        loading={loading}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

// Add a helper for general alerts
export function AlertDialog({
    isOpen,
    onClose,
    title = 'Notice',
    message,
    type = 'info',
    closeText = 'Close'
}) {
    const icons = {
        warning: <AlertTriangle className="text-warning-500" size={24} />,
        danger: <AlertCircle className="text-accent-500" size={24} />,
        info: <Info className="text-primary-500" size={24} />,
        success: <CheckCircle className="text-primary-500" size={24} />
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
        >
            <div className="confirm-dialog-content">
                <div className="confirm-dialog-body">
                    <div className="confirm-dialog-icon">
                        {icons[type]}
                    </div>
                    <p className="confirm-dialog-message">{message}</p>
                </div>
                <div className="confirm-dialog-actions">
                    <Button
                        variant="primary"
                        onClick={onClose}
                    >
                        {closeText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
