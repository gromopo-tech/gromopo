import React from 'react';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'sm', className = '' }: SpinnerProps) {
  const sizeClasses = {
    'xs': 'h-3 w-3',
    'sm': 'h-5 w-5',
    'md': 'h-8 w-8',
    'lg': 'h-12 w-12'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg 
        className={`animate-spin ${sizeClasses[size]}`} 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
    </div>
  );
}
