import React from 'react';
import { LucideIcon } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-colors select-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#13B8D5] disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none rounded-lg';

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'h-8 px-2.5 text-xs gap-1.5',
    md: 'h-9 px-3.5 text-xs gap-2',
    lg: 'h-10 px-4 text-sm gap-2.5',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-[#13B8D5] text-[#080D16] font-semibold hover:bg-[#11A3BE] active:bg-[#0E8FA6] shadow-sm',
    secondary:
      'bg-[#121D2D] text-[#E8EEF7] border border-[#26364B] hover:bg-[#182437] hover:border-[#354964] active:bg-[#0E1625]',
    tertiary:
      'bg-transparent text-[#9AAAC0] hover:text-[#E8EEF7] hover:bg-[#182437] border border-transparent',
    destructive:
      'bg-[#F06472]/15 text-[#F06472] border border-[#F06472]/40 hover:bg-[#F06472]/25 active:bg-[#F06472]/30',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {Icon && iconPosition === 'left' && (
        <Icon className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
      )}
      {children}
      {Icon && iconPosition === 'right' && (
        <Icon className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
      )}
    </button>
  );
};

export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: StatusType;
  label: string;
  dot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  dot = true,
  className = '',
}) => {
  const styles: Record<StatusType, { bg: string; text: string; border: string; dot: string }> = {
    success: {
      bg: 'bg-[#22C58B]/10',
      text: 'text-[#22C58B]',
      border: 'border-[#22C58B]/30',
      dot: 'bg-[#22C58B]',
    },
    warning: {
      bg: 'bg-[#F0B44D]/10',
      text: 'text-[#F0B44D]',
      border: 'border-[#F0B44D]/30',
      dot: 'bg-[#F0B44D]',
    },
    error: {
      bg: 'bg-[#F06472]/10',
      text: 'text-[#F06472]',
      border: 'border-[#F06472]/30',
      dot: 'bg-[#F06472]',
    },
    info: {
      bg: 'bg-[#13B8D5]/10',
      text: 'text-[#13B8D5]',
      border: 'border-[#13B8D5]/30',
      dot: 'bg-[#13B8D5]',
    },
    neutral: {
      bg: 'bg-[#121D2D]',
      text: 'text-[#9AAAC0]',
      border: 'border-[#26364B]',
      dot: 'bg-[#74859D]',
    },
  };

  const conf = styles[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${conf.bg} ${conf.text} ${conf.border} select-none ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${conf.dot} shrink-0`} />}
      <span>{label}</span>
    </span>
  );
};

interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  badge,
  actions,
  onClose,
  className = '',
}) => {
  return (
    <div className={`px-4 py-3 border-b border-[#26364B] bg-[#0E1625] flex items-center justify-between gap-3 shrink-0 ${className}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && (
          <div className="w-7 h-7 rounded-md bg-[#182437] border border-[#26364B] flex items-center justify-center text-[#13B8D5] shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#E8EEF7] tracking-tight truncate">{title}</h3>
            {badge}
          </div>
          {subtitle && <p className="text-[11px] text-[#9AAAC0] truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {actions}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-[#9AAAC0] hover:text-[#E8EEF7] hover:bg-[#182437] transition-colors cursor-pointer"
            title="Close"
          >
            <span className="text-sm font-bold">✕</span>
          </button>
        )}
      </div>
    </div>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', icon: Icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {Icon && (
          <Icon className="w-3.5 h-3.5 text-[#74859D] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        )}
        <input
          ref={ref}
          className={`w-full h-9 ${Icon ? 'pl-8' : 'px-3'} pr-3 rounded-lg bg-[#121D2D] border border-[#26364B] text-xs text-[#E8EEF7] placeholder-[#74859D] focus:outline-none focus:border-[#13B8D5] focus:ring-1 focus:ring-[#13B8D5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = 'Input';
