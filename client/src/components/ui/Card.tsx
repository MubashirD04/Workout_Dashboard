import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`glass-card ${onClick ? 'cursor-pointer glass-card-hover' : ''} ${className}`}
        >
            {children}
        </div>
    );
};