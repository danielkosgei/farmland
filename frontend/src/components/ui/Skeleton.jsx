import React from 'react';
import './Skeleton.css';

export function Skeleton({
    width,
    height,
    borderRadius,
    className = '',
    variant = 'text', // text, circular, rectangular, rounded
    animation = 'pulse' // pulse, wave, none
}) {
    const style = {
        width: width || '100%',
        height: height || (variant === 'text' ? '1em' : 'auto'),
        borderRadius: borderRadius || (variant === 'circular' ? '50%' : (variant === 'rounded' ? '8px' : '0'))
    };

    return (
        <div
            className={`skeleton skeleton-${variant} skeleton-animation-${animation} ${className}`}
            style={style}
        />
    );
}

export function SkeletonGroup({ children, className = '', gap = '1rem', direction = 'column' }) {
    return (
        <div className={`skeleton-group ${className}`} style={{ display: 'flex', flexDirection: direction, gap }}>
            {children}
        </div>
    );
}
