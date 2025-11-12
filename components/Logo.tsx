import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = "h-12 w-12 sm:h-14 sm:w-14" }) => {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#c084fc" />
                    <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
            </defs>
            {/* Wizard Hat */}
            <path
                d="M50 5 L 20 40 L 80 40 Z"
                fill="url(#logoGradient)"
                transform="rotate(-15, 50, 40)"
            />
            <path
                d="M15 40 Q 50 35, 85 40 L 85 50 Q 50 55, 15 50 Z"
                fill="url(#logoGradient)"
                transform="rotate(-15, 50, 40)"
            />
            {/* Sound Wave / Speech Bubble element */}
            <path
                d="M25 65 C 35 55, 45 55, 55 65"
                stroke="url(#logoGradient)"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
            />
            <path
                d="M40 80 C 50 70, 60 70, 70 80"
                stroke="url(#logoGradient)"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
            />
        </svg>
    );
};

export default Logo;
