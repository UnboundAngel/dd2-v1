import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Search, Upload, X } from 'lucide-react';

export const Card = ({
  children,
  className = '',
  onClick
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={`bg-zinc-900 border border-zinc-800 rounded-lg p-4 shadow-sm hover:border-zinc-600 transition-colors ${className}`}
  >
    {children}
  </div>
);

export const Badge = ({
  children,
  variant = 'default'
}: {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'accent' | 'success';
}) => {
  const styles = {
    default: 'bg-zinc-800 text-zinc-300',
    outline: 'border border-zinc-700 text-zinc-400',
    accent: 'bg-red-900/30 text-red-400 border border-red-900/50',
    success: 'bg-green-900/30 text-green-400 border border-green-900/50'
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[variant]}`}>{children}</span>;
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  icon: Icon,
  disabled
}: any) => {
  const variants = {
    primary: 'bg-red-700 hover:bg-red-600 text-white shadow-red-900/20 shadow-lg',
    secondary: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700',
    ghost: 'hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200',
    icon: 'p-2 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-full'
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant] || variants.primary} ${variant === 'icon' ? '' : sizes[size]} ${className}`}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
};

export const SearchInput = ({ placeholder = 'Search...', value, onChange, className = '', containerClassName = '', ...props }: any) => (
  <div className={`relative group ${containerClassName}`}>
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-400 transition-colors" size={16} />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full bg-zinc-950/70 backdrop-blur-md border border-zinc-800 text-zinc-100 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-red-500/80 focus:ring-2 focus:ring-red-500/40 placeholder:text-zinc-600 text-sm transition-all shadow-[0_10px_35px_-24px_rgba(0,0,0,0.6)] ${className}`}
      placeholder={placeholder}
      {...props}
    />
  </div>
);

export const ThemedSelect = ({ value, onChange, children, className = '', ...props }: any) => (
  <div className="relative group">
    <select
      value={value}
      onChange={onChange}
      {...props}
      className={`appearance-none bg-gradient-to-br from-red-950/40 via-zinc-950/70 to-zinc-950/40 backdrop-blur-xl border border-red-900/50 text-red-50 text-sm pl-3 pr-10 py-2.5 rounded-xl shadow-[0_12px_40px_-24px_rgba(var(--accent-rgb),0.65)] focus:outline-none focus:ring-2 focus:ring-red-500/70 focus:border-red-500/80 transition-all hover:border-red-600/70 hover:shadow-[0_0_22px_rgba(var(--accent-rgb),0.25)] ${className}`}
    >
      {children}
    </select>
    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-200/70 group-focus-within:text-red-300 transition-colors pointer-events-none" />
  </div>
);

export const NumberStepper = ({ value, min = 0, max = 999, onChange, label, step = 1 }: any) => (
  <NumberStepperInner value={value} min={min} max={max} onChange={onChange} label={label} step={step} />
);

const NumberStepperInner = ({ value, min = 0, max = 999, onChange, label, step = 1 }: any) => {
  const holdRef = useRef<{ active: boolean; timer: any; delay: number; ignoreClick: boolean } | null>(null);
  const valueRef = useRef(value);
  const minRef = useRef(min);
  const maxRef = useRef(max);
  const stepRef = useRef(step);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    minRef.current = min;
  }, [min]);

  useEffect(() => {
    maxRef.current = max;
  }, [max]);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    return () => {
      if (holdRef.current?.timer) clearTimeout(holdRef.current.timer);
    };
  }, []);

  const applyDelta = (direction: number) => {
    const next = Math.max(
      minRef.current,
      Math.min(maxRef.current, valueRef.current + (direction * stepRef.current))
    );
    if (next !== valueRef.current) onChange(next);
  };

  const stopHold = () => {
    if (holdRef.current?.timer) clearTimeout(holdRef.current.timer);
    if (holdRef.current) {
      holdRef.current.active = false;
      holdRef.current.timer = null;
      holdRef.current.delay = 0;
    }
  };

  const startHold = (direction: number) => (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    applyDelta(direction);
    stopHold();
    holdRef.current = { active: true, timer: null, delay: 420, ignoreClick: true };
    const tick = () => {
      if (!holdRef.current?.active) return;
      applyDelta(direction);
      const nextDelay = Math.max(40, holdRef.current.delay * 0.85);
      holdRef.current.delay = nextDelay;
      holdRef.current.timer = setTimeout(tick, nextDelay);
    };
    holdRef.current.timer = setTimeout(tick, holdRef.current.delay);
  };

  const handleClick = (direction: number) => () => {
    if (holdRef.current?.ignoreClick) {
      holdRef.current.ignoreClick = false;
      return;
    }
    applyDelta(direction);
  };

  const handleStop = () => stopHold();

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{label}</span>}
      <div className="flex items-center bg-zinc-900 rounded-md border border-zinc-800 overflow-hidden">
        <button
          onMouseDown={startHold(-1)}
          onMouseUp={handleStop}
          onMouseLeave={handleStop}
          onTouchStart={startHold(-1)}
          onTouchEnd={handleStop}
          onTouchCancel={handleStop}
          onClick={handleClick(-1)}
          className="p-2 hover:bg-zinc-800 text-zinc-400 active:text-red-400 transition-colors"
        >
          <ChevronDown size={14} />
        </button>
        <div className="flex-1 text-center font-mono text-sm text-zinc-200 min-w-[3rem]">
          {value}
        </div>
        <button
          onMouseDown={startHold(1)}
          onMouseUp={handleStop}
          onMouseLeave={handleStop}
          onTouchStart={startHold(1)}
          onTouchEnd={handleStop}
          onTouchCancel={handleStop}
          onClick={handleClick(1)}
          className="p-2 hover:bg-zinc-800 text-zinc-400 active:text-green-400 transition-colors"
        >
          <ChevronUp size={14} />
        </button>
      </div>
    </div>
  );
};

export const Modal = ({ isOpen, onClose, title, children, className = '', size = 'md' }: any) => {
  if (!isOpen) return null;
  const sizes: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`bg-zinc-950 border border-zinc-800 rounded-xl w-full ${sizes[size] || sizes.md} shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col ${className}`}>
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

export const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-sm w-full shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-zinc-400 text-sm mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={onConfirm} className="bg-red-600 hover:bg-red-700">Confirm</Button>
        </div>
      </div>
    </div>
  );
};

export const InlineInput = ({ value, onSave, onCancel, placeholder, type = 'text', autoFocus = true, allowFile = false }: any) => {
  const [text, setText] = useState(value || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSave(text);
    if (e.key === 'Escape') onCancel();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setText(ev.target.result as string);
          onSave(ev.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 flex items-center gap-1 bg-zinc-950 border border-zinc-700 rounded px-2 py-1 focus-within:border-red-500 transition-colors">
        <input
          ref={inputRef}
          type={type}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-white outline-none"
        />
        {allowFile && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1 text-zinc-500 hover:text-blue-400 transition-colors"
              title="Upload Image"
            >
              <Upload size={14} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </>
        )}
      </div>
      <button onClick={() => onSave(text)} className="p-1.5 text-green-500 hover:bg-zinc-800 rounded"><Check size={14} /></button>
      <button onClick={onCancel} className="p-1.5 text-red-500 hover:bg-zinc-800 rounded"><X size={14} /></button>
    </div>
  );
};

export const ProgressBar = ({ progress, color = 'bg-green-500' }: { progress: number; color?: string }) => (
  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
    <div
      className={`h-full transition-all duration-500 ${color}`}
      style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
    />
  </div>
);
