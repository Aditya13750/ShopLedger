import React, { ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`glass-card rounded-2xl p-6 ${
        onClick ? 'cursor-pointer glass-card-hover' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
