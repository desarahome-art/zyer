import { useEffect, useId } from 'react';
import Icon from './Icon';

/** Pop up: di tengah layar (laptop) atau muncul dari bawah (HP). */
export default function Sheet({ open, onClose, title, sub, children, footer, maxWidth, closeOnBackdrop = true }) {
  const id = useId();
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="bg" onClick={closeOnBackdrop ? onClose : undefined}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={id}
        onClick={(e) => e.stopPropagation()} style={maxWidth ? { maxWidth } : undefined}>
        <div className="handle" aria-hidden="true" />
        <div className="sh-head">
          <div>
            <h2 id={id} style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{title}</h2>
            {sub ? <div style={{ fontSize: 13, color: '#5F6964', marginTop: 2 }}>{sub}</div> : null}
          </div>
          <button className="x" type="button" aria-label="Tutup" onClick={onClose}><Icon name="x" size={18} stroke={2.5} /></button>
        </div>
        <div className="sh-body">{children}</div>
        {footer ? <div className="sh-foot">{footer}</div> : null}
      </div>
    </div>
  );
}
