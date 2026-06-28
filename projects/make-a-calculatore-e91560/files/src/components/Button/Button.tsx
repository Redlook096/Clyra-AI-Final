import { useCallback, useRef } from 'react';
import type { ButtonConfig } from '../../types';
import './Button.css';

interface ButtonProps extends ButtonConfig {
  onClick: (value: string, type: ButtonConfig['type']) => void;
}

export function Button({ label, value, type, span, onClick }: ButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(() => {
    onClick(value, type);
  }, [onClick, value, type]);

  const handleRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    if (!btn) return;

    const ripple = document.createElement('span');
    ripple.classList.add('button__ripple');

    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    btn.appendChild(ripple);

    ripple.addEventListener('animationend', () => {
      ripple.remove();
    });
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      handleRipple(e);
    },
    [handleRipple]
  );

  const classNames = [
    'button',
    `button--${type}`,
    span === 2 ? 'button--span-2' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={btnRef}
      className={classNames}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      type="button"
      aria-label={label}
    >
      {label}
    </button>
  );
}
