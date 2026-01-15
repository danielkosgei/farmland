import React from 'react';
import './Card.css';

export function Card({ children, className = '', variant = 'default', padding = 'default', hover = false, onClick }) {
    return (
        <div
            className={`card card--${variant} card--padding-${padding} ${hover ? 'card--hover' : ''} ${className}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className = '' }) {
    return <div className={`card-header ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
    return <h3 className={`card-title ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = '' }) {
    return <p className={`card-description ${className}`}>{children}</p>;
}

export function CardContent({ children, className = '' }) {
    return <div className={`card-content ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
    return <div className={`card-footer ${className}`}>{children}</div>;
}
