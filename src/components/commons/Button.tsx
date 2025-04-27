// src/components/commons/Button.tsx
import React from 'react';

export interface ButtonProps {
    variant: 'primary' | 'secondary' | 'danger' | 'success';
    icon?: React.ReactNode;
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
                                           variant,
                                           icon,
                                           children,
                                           onClick,
                                           disabled,
                                           className = '',
                                           type = 'button'
                                       }) => {
    const variantClasses = {
        primary: 'bg-primary text-white hover:bg-blue-600',
        secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        danger: 'bg-red-100 text-red-700 hover:bg-red-200',
        success: 'bg-green-100 text-green-700 hover:bg-green-200'
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`py-2 px-4 rounded flex items-center transition-colors ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        >
            {icon && <span className="mr-2">{icon}</span>}
            {children}
        </button>
    );
};

export default Button;