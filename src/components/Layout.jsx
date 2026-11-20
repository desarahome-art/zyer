import { NavLink, Outlet } from 'react-router-dom';
import Icon from './Icon';
import { useApp } from '../AppContext';
import ClientForm from './ClientForm';
import WaSheet from './WaSheet';

const NAV = [
  { to: '/', label: 'Dashboard', icon: 'home', end: true },
  { to: '/client', label: 'Data Client', icon: 'users' },
  { to: '/kalender', label: 'Kalender', icon: 'calendar' },
  { to: '/pengaturan', label: 'Pengaturan', icon: 'settings' },
];
const cls = ({ isActive }) => (isActive ? 'on' : undefined);

export default function Layout() {
  const { toasts, dismissToast, form, waClient } = useApp();
  return (
    <div className="app">
      <nav className="side" aria-label="Menu utama">
        <div style={{ padding: '0 14px 22px' }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '0.08em', color: '#1F4A36' }}>ZYER</div>
          <div style={{ fontSize: 12, color: '#5F6964', marginTop: 2 }}>Rekap Client Foto Outdoor</div>
        </div>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={cls}><Icon name={n.icon} />{n.label}</NavLink>
        ))}
      </nav>

      <main className="main">
        <div className="wrap"><Outlet /></div>
      </main>

      <nav className="bnav" aria-label="Menu utama">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={cls}>
            <span className="ic"><Icon name={n.icon} size={22} /></span>{n.label}
          </NavLink>
        ))}
      </nav>

      <div className="toast-wrap" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="snack" role="status">
            <span>{t.msg}</span>
            {t.action ? (
              <button type="button" onClick={() => { t.action.run(); dismissToast(t.id); }}>{t.action.label}</button>
            ) : null}
          </div>
        ))}
      </div>

      {form ? <ClientForm /> : null}
      {waClient ? <WaSheet /> : null}
    </div>
  );
}
