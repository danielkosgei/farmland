import React from 'react';
import { Loader2 } from 'lucide-react';
import './Button.css';

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    loading = false,
    disabled = false,
    fullWidth = false,
    type = 'button',
    onClick,
    className = '',
    ...props
}) {
    return (
        <button
            type={type}
            className={`btn btn--${variant} btn--${size} ${fullWidth ? 'btn--full' : ''} ${className}`}
            disabled={disabled || loading}
            onClick={onClick}
            {...props}
        >
            {loading ? (
                <Loader2 size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className="btn-spinner" />
            ) : Icon && iconPosition === 'left' ? (
                <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className="btn-icon" />
            ) : null}
            <span>{children}</span>
            {!loading && Icon && iconPosition === 'right' && (
                <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className="btn-icon" />
            )}
        </button>
    );
}
