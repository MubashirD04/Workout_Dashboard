import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-primary hover:bg-primary-hover text-white shadow-glow hover:shadow-glow-lg',
        secondary: 'bg-slate-800 hover:bg-slate-700 text-white',
        danger: 'bg-red-600 hover:bg-red-500 text-white',
        ghost: 'bg-transparent hover:bg-white/5 text-slate-400 hover:text-white border-2 border-primary/50 hover:border-primary',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs rounded-md',
        md: 'px-6 py-3 text-sm rounded-lg',
        lg: 'px-8 py-4 text-base rounded-xl',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
