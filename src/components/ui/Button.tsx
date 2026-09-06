import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'attention' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyle = "font-bold tracking-wide border-2 border-border transition-all duration-150 ease-out active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus:outline-none focus:ring-2 focus:ring-primary-blue disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2 select-none";
  
  const variants = {
    primary: "bg-primary-red text-white shadow-sm hover:shadow-md hover:-translate-x-[1px] hover:-translate-y-[1px]",
    secondary: "bg-primary-blue text-white shadow-sm hover:shadow-md hover:-translate-x-[1px] hover:-translate-y-[1px]",
    attention: "bg-primary-yellow text-canvas-fg shadow-sm hover:shadow-md hover:-translate-x-[1px] hover:-translate-y-[1px]",
    outline: "bg-card-bg text-canvas-fg shadow-sm hover:bg-surface-hover hover:shadow-md hover:-translate-x-[1px] hover:-translate-y-[1px]",
    ghost: "bg-transparent text-canvas-fg border-transparent hover:bg-surface-hover active:translate-x-0 active:translate-y-0 active:shadow-none",
    destructive: "bg-primary-red/10 border-primary-red text-primary-red hover:bg-primary-red hover:text-white shadow-sm"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs font-bold",
    md: "px-4 py-2 text-sm font-bold",
    lg: "px-7 py-3 text-base font-black tracking-wider"
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
