import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  accent?: 'none' | 'red' | 'blue' | 'yellow' | 'green' | 'purple' | 'cyan' | 'indigo' | 'black';
  borderSize?: 'thin' | 'thick';
}

export const Card: React.FC<CardProps> = ({
  children,
  shadow = 'md',
  accent = 'none',
  borderSize = 'thin',
  className = '',
  ...props
}) => {
  const shadowStyles = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
  };

  const borderStyles = {
    thin: "border-2 border-border",
    thick: "border-4 border-border",
  };

  const accentColors = {
    none: "",
    red: "before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-2 before:bg-primary-red",
    blue: "before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-2 before:bg-primary-blue",
    yellow: "before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-2 before:bg-primary-yellow",
    green: "before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-2 before:bg-emerald-500",
    purple: "before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-2 before:bg-purple-600",
    cyan: "before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-2 before:bg-cyan-500",
    indigo: "before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-2 before:bg-indigo-600",
    black: "before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-2 before:bg-border",
  };

  return (
    <div
      className={`bg-card-bg text-canvas-fg relative rounded-none flex flex-col p-6 transition-all duration-200 ${borderStyles[borderSize]} ${shadowStyles[shadow]} ${accent !== 'none' ? 'pt-8 ' + accentColors[accent] : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
