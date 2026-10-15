import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

/*
 * Shared building blocks for the calm design system.
 * Use semantic token classes only (see index.css), never raw palette colors.
 */

export type Tone = 'feed' | 'sleep' | 'diaper' | 'weight' | 'primary' | 'neutral';

// Full class strings so Tailwind can detect them.
export const TONE: Record<Tone, { soft: string; icon: string; ink: string; solid: string }> = {
  feed: { soft: 'bg-feed-soft', icon: 'text-feed', ink: 'text-feed-ink', solid: 'bg-feed' },
  sleep: { soft: 'bg-sleep-soft', icon: 'text-sleep', ink: 'text-sleep-ink', solid: 'bg-sleep' },
  diaper: { soft: 'bg-diaper-soft', icon: 'text-diaper', ink: 'text-diaper-ink', solid: 'bg-diaper' },
  weight: { soft: 'bg-weight-soft', icon: 'text-weight', ink: 'text-weight-ink', solid: 'bg-weight' },
  primary: { soft: 'bg-primary-soft', icon: 'text-primary-ink', ink: 'text-primary-ink', solid: 'bg-primary' },
  neutral: { soft: 'bg-sunken', icon: 'text-muted', ink: 'text-muted', solid: 'bg-muted' },
};

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => (
  <div className={cx('bg-surface rounded-[28px] shadow-soft', className)} {...rest} />
);

export const SectionTitle: React.FC<{ children: React.ReactNode; aside?: React.ReactNode; className?: string }> = ({
  children,
  aside,
  className,
}) => (
  <div className={cx('flex items-baseline justify-between px-1', className)}>
    <h2 className="text-[15px] font-medium text-ink">{children}</h2>
    {aside && <span className="text-[13px] text-muted">{aside}</span>}
  </div>
);

export const IconBadge: React.FC<{ tone: Tone; size?: 'sm' | 'md' | 'lg'; onSurface?: boolean; children: React.ReactNode }> = ({
  tone,
  size = 'md',
  onSurface = false,
  children,
}) => {
  const dims = size === 'sm' ? 'w-9 h-9' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  return (
    <span
      aria-hidden="true"
      className={cx(
        dims,
        'rounded-full flex items-center justify-center shrink-0 [&_svg]:w-5 [&_svg]:h-5',
        onSurface ? 'bg-surface' : TONE[tone].soft,
        TONE[tone].icon
      )}
    >
      {children}
    </span>
  );
};

type ButtonVariant = 'primary' | 'soft' | 'ghost' | 'danger';

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; tone?: Tone; block?: boolean; size?: 'md' | 'lg' }
> = ({ variant = 'primary', tone = 'primary', block, size = 'lg', className, children, ...rest }) => {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-full transition-[transform,background-color] duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none [&_svg]:w-5 [&_svg]:h-5';
  const sizing = size === 'lg' ? 'h-[54px] px-6 text-base' : 'h-11 px-5 text-[15px]';
  const look =
    variant === 'primary'
      ? cx(TONE[tone].soft, tone === 'primary' ? 'text-primary-ink' : 'text-ink')
      : variant === 'soft'
      ? 'bg-sunken text-ink'
      : variant === 'danger'
      ? 'bg-danger-soft text-danger'
      : 'bg-transparent text-muted';
  return (
    <button className={cx(base, sizing, look, block && 'w-full', className)} {...rest}>
      {children}
    </button>
  );
};

export const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: 'surface' | 'sunken' | 'ghost' }> = ({
  label,
  tone = 'surface',
  className,
  children,
  ...rest
}) => (
  <button
    aria-label={label}
    title={label}
    className={cx(
      'w-11 h-11 rounded-full flex items-center justify-center text-muted transition-transform active:scale-95 shrink-0 [&_svg]:w-5 [&_svg]:h-5',
      tone === 'surface' && 'bg-surface shadow-soft',
      tone === 'sunken' && 'bg-sunken',
      className
    )}
    {...rest}
  >
    {children}
  </button>
);

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { value: T; label: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={cx('flex p-1 bg-sunken rounded-full', className)}>
      {options.map(o => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={cx(
            'flex-1 h-9 px-4 rounded-full text-sm transition-colors whitespace-nowrap',
            o.value === value ? 'bg-surface text-ink font-medium shadow-soft' : 'text-muted'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; description?: React.ReactNode }> = ({
  checked,
  onChange,
  label,
  description,
}) => (
  <label className="flex items-center gap-3 px-[18px] py-3 cursor-pointer">
    <span className="flex-1 flex flex-col">
      <span className="text-[15px] font-medium text-ink">{label}</span>
      {description && <span className="text-[13px] text-muted">{description}</span>}
    </span>
    <input type="checkbox" className="sr-only peer" checked={checked} onChange={e => onChange(e.target.checked)} />
    <span
      aria-hidden="true"
      className={cx(
        'relative w-[50px] h-[30px] rounded-full shrink-0 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary',
        checked ? 'bg-primary' : 'bg-sunken'
      )}
    >
      <span
        className={cx(
          'absolute top-[3px] w-6 h-6 rounded-full bg-white shadow-sm transition-all',
          checked ? 'left-[3px]' : 'left-[23px]'
        )}
      />
    </span>
  </label>
);

/** A short, soft vibration on devices that support it (Android). */
export function haptic(ms = 10) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // not supported
  }
}

export const CheckCircle: React.FC<{ done: boolean; tone?: Tone }> = ({ done }) => {
  // Animate only when it flips to done, not when a done item first renders
  const prev = useRef(done);
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    if (done && !prev.current) {
      setCelebrate(true);
      const t = setTimeout(() => setCelebrate(false), 700);
      prev.current = done;
      return () => clearTimeout(t);
    }
    prev.current = done;
  }, [done]);

  return (
    <span
      aria-hidden="true"
      className={cx(
        'w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-300',
        done ? 'bg-diaper text-white' : 'border-[1.5px] border-faint',
        celebrate && 'animate-check-pop'
      )}
    >
      {done && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" className={celebrate ? 'animate-check-draw' : undefined} />
        </svg>
      )}
    </span>
  );
};

/** Text input / select / textarea styling shared by forms */
export const fieldClass =
  'w-full h-12 px-4 rounded-2xl bg-sunken text-ink text-[15px] placeholder:text-muted border-0 outline-none focus:ring-2 focus:ring-primary transition-shadow';

export const Field: React.FC<{ label: string; children: React.ReactNode; hint?: React.ReactNode }> = ({ label, children, hint }) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-[13px] text-muted px-1">{label}</span>
    {children}
    {hint && <span className="text-[13px] text-muted px-1">{hint}</span>}
  </label>
);

/**
 * Bottom sheet. Slides up from the bottom, closes on backdrop tap or Escape.
 */
export const Sheet: React.FC<{
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  icon?: React.ReactNode;
  tone?: Tone;
  footer?: React.ReactNode;
  children: React.ReactNode;
}> = ({ open, onClose, title, icon, tone = 'primary', footer, children }) => {
  // Stay mounted briefly after closing so the sheet can slide away
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return;
    }
    if (!mounted) return;
    setClosing(true);
    const t = setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, 260);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Only the top-most dialog reacts (e.g. a delete confirm opened over this sheet)
      const dialogs = document.querySelectorAll('[role="dialog"], [role="alertdialog"]');
      if (dialogs[dialogs.length - 1] === rootRef.current) onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div ref={rootRef} className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <div
        className={cx('absolute inset-0 bg-[#2A2230]/35 backdrop-blur-[3px]', closing ? 'animate-fade-out' : 'animate-fade-in')}
        onClick={onClose}
      />
      <div
        className={cx(
          'relative w-full max-w-md bg-ground rounded-t-[32px] shadow-float max-h-[92dvh] flex flex-col safe-bottom',
          closing ? 'animate-sheet-down' : 'animate-sheet-up'
        )}
      >
        <div className="pt-3 flex justify-center">
          <span className="w-10 h-1 rounded-full bg-faint" />
        </div>
        <div className="flex items-center gap-3 px-6 pt-3 pb-4">
          {icon && <IconBadge tone={tone}>{icon}</IconBadge>}
          <h2 className="flex-1 text-xl font-medium text-ink">{title}</h2>
          <IconButton label="סגירה" tone="sunken" onClick={onClose}>
            <X />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">{children}</div>
        {footer && <div className="px-6 pt-2 pb-6">{footer}</div>}
      </div>
    </div>
  );
};

/** Pill choice used for options inside sheets (breast side, diaper type, ...) */
export const Choice: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean; tone?: Tone }> = ({
  selected,
  tone = 'primary',
  className,
  children,
  ...rest
}) => (
  <button
    type="button"
    aria-pressed={selected}
    className={cx(
      'min-h-12 px-4 rounded-2xl text-[15px] flex items-center justify-center gap-2 transition-colors',
      selected ? cx(TONE[tone].soft, 'text-ink font-medium ring-2 ring-inset ring-current', TONE[tone].icon) : 'bg-sunken text-ink',
      className
    )}
    {...rest}
  >
    <span className={selected ? 'text-ink' : undefined}>{children}</span>
  </button>
);
