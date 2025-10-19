
import React from 'react';

interface IconButtonProps {
    onClick: () => void;
    icon: React.ReactNode;
    text: string;
    className?: string;
}

const IconButton: React.FC<IconButtonProps> = ({ onClick, icon, text, className = '' }) => {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors duration-200 ${className}`}
        >
            {icon}
            <span>{text}</span>
        </button>
    );
};

export default IconButton;
