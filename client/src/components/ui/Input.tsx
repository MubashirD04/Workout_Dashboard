import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && (
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
                    {label}
                </label>
            )}
            <input
                className={`bg-slate-900 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary outline-none hover:border-primary/50 transition-colors w-full ${className}`}
                {...props}
            />
        </div>
    );
};
