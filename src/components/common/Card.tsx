import { type ReactNode, type HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardHeader({ children, className = '', ...props }: CardHeaderProps) {
  return (
    <div className={`card-header ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export function CardTitle({ children, className = '', ...props }: CardTitleProps) {
  return (
    <h3 className={`card-title ${className}`} {...props}>
      {children}
    </h3>
  );
}

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardBody({ children, className = '', ...props }: CardBodyProps) {
  return (
    <div className={`card-body ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardFooter({ children, className = '', ...props }: CardFooterProps) {
  return (
    <div className={`card-footer ${className}`} {...props}>
      {children}
    </div>
  );
}

// Stat Card variant
interface StatCardProps {
  value: string | number;
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'accent';
  className?: string;
}

export function StatCard({ value, label, variant = 'default', className = '' }: StatCardProps) {
  const variantClass = variant !== 'default' ? `stat-card-${variant}` : '';

  return (
    <div className={`stat-card ${variantClass} ${className}`}>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

// Nut Card variant
interface NutCardProps {
  value: number;
  label?: string;
  className?: string;
}

export function NutCard({ value, label = 'Total Nuts', className = '' }: NutCardProps) {
  return (
    <div className={`nut-card ${className}`}>
      <div className="nut-card-icon">🥜</div>
      <div className="nut-card-content">
        <div className="nut-card-value">{value.toLocaleString()}</div>
        <div className="nut-card-label">{label}</div>
      </div>
    </div>
  );
}

// Streak Card variant
interface StreakCardProps {
  days: number;
  multiplier?: number;
  className?: string;
}

export function StreakCard({ days, multiplier = 1, className = '' }: StreakCardProps) {
  return (
    <div className={`streak-card ${className}`}>
      <div className="streak-card-fire">🔥</div>
      <div>
        <div className="streak-card-days">{days}</div>
        <div className="streak-card-label">Day Streak</div>
      </div>
      {multiplier > 1 && (
        <span className="streak-card-multiplier">x{multiplier.toFixed(1)}</span>
      )}
    </div>
  );
}
