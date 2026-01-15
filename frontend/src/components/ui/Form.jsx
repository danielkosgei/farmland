import React from 'react';
import './Form.css';

export function FormGroup({ children, className = '' }) {
    return <div className={`form-group ${className}`}>{children}</div>;
}

export function FormRow({ children, className = '' }) {
    return <div className={`form-row ${className}`}>{children}</div>;
}

export function Label({ children, htmlFor, required = false }) {
    return (
        <label htmlFor={htmlFor} className="form-label">
            {children}
            {required && <span className="form-required">*</span>}
        </label>
    );
}

export function Input({ type = 'text', error, ...props }) {
    return (
        <>
            <input type={type} className={`form-input ${error ? 'form-input--error' : ''}`} {...props} />
            {error && <span className="form-error">{error}</span>}
        </>
    );
}

export function Select({ children, error, ...props }) {
    return (
        <>
            <select className={`form-select ${error ? 'form-select--error' : ''}`} {...props}>
                {children}
            </select>
            {error && <span className="form-error">{error}</span>}
        </>
    );
}

export function Textarea({ error, ...props }) {
    return (
        <>
            <textarea className={`form-textarea ${error ? 'form-textarea--error' : ''}`} {...props} />
            {error && <span className="form-error">{error}</span>}
        </>
    );
}

export function Checkbox({ label, checked, onChange, ...props }) {
    return (
        <label className="form-checkbox">
            <input type="checkbox" checked={checked} onChange={onChange} {...props} />
            <span className="form-checkbox-box"></span>
            <span className="form-checkbox-label">{label}</span>
        </label>
    );
}

export function FormField({ label, error, required, children, className = '' }) {
    return (
        <div className={`form-field ${className}`}>
            {label && <Label required={required}>{label}</Label>}
            {children}
            {error && <span className="form-error">{error}</span>}
        </div>
    );
}
