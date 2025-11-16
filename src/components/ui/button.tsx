import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-semibold transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-gray-700 hover:bg-gray-600 text-white': variant === 'default',
            'bg-purple-600 hover:bg-purple-700 text-white': variant === 'primary',
            'bg-blue-600 hover:bg-blue-700 text-white': variant === 'secondary',
            'bg-green-600 hover:bg-green-700 text-white': variant === 'success',
            'bg-red-600 hover:bg-red-700 text-white': variant === 'danger',
            'hover:bg-gray-800 text-white': variant === 'ghost',
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
