import { useState } from 'react';
import { supabaseReady } from '../lib/supabase';

const PIN = import.meta.env.VITE_APP_PIN;
const KEY = 'zyer_pin_ok';
const read = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };
const write = () => { try { localStorage.setItem(KEY, '1'); } catch { /* abaikan */ } };

export default function Gate({ children }) {
  const [ok, setOk] = useState(() => !PIN || read());
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');

  if (!supabaseReady) {
    return (
      <div className="center-page">
        <div className="center-card">
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.08em', color: '#1F4A36' }}>ZYER</div>
          <h1 style={{ fontSize: 22, margin: '8px 0' }}>Database belum tersambung</h1>
          <p style={{ color: '#5F6964', lineHeight: 1.6, margin: 0 }}>
            Isi <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code> di file <code>.env.local</code> (lokal)
            atau di Vercel → Settings → Environment Variables, lalu deploy ulang. Panduan lengkap ada di README.md.
          </p>
        </div>
      </div>
    );
  }

  if (!ok) {
    const submit = (e) => {
      e.preventDefault();
      if (pin === PIN) { write(); setOk(true); } else { setErr('PIN salah, coba lagi.'); setPin(''); }
    };
    return (
      <div className="center-page">
        <form className="center-card" onSubmit={submit}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.08em', color: '#1F4A36' }}>ZYER</div>
          <h1 style={{ fontSize: 22, margin: '8px 0 4px' }}>Masukkan PIN admin</h1>
          <p style={{ color: '#5F6964', margin: '0 0 16px', fontSize: 14 }}>Rekap Client Foto Outdoor</p>
          <label className="ml" htmlFor="pin">PIN</label>
          <input className="mf" id="pin" type="password" inputMode="numeric" autoFocus value={pin} onChange={(e) => { setPin(e.target.value); setErr(''); }} />
          {err ? <p className="alert" role="alert" style={{ margin: '12px 0 0' }}>{err}</p> : null}
          <button className="btn-p" type="submit" style={{ width: '100%', marginTop: 16 }}>Masuk</button>
        </form>
      </div>
    );
  }
  return children;
}
