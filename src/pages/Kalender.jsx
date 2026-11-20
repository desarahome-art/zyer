import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { useApp } from '../AppContext';
import { listClientsBetween } from '../lib/api';
import { BLN, isoOf, jamOf, tglPanjang, todayIso } from '../lib/format';

const HEADS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export default function Kalender() {
  const { version, openForm } = useApp();
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [sel, setSel] = useState(todayIso());
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  const first = new Date(ym.y, ym.m, 1);
  const last = new Date(ym.y, ym.m + 1, 0);

  useEffect(() => {
    let alive = true;
    setRows(null);
    listClientsBetween(isoOf(first), isoOf(last))
      .then((r) => { if (alive) { setRows(r); setError(''); } })
      .catch((e) => { if (alive) setError(e.message); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ym.y, ym.m, version]);

  const byDate = useMemo(() => {
    const m = {};
    (rows || []).forEach((c) => { (m[c.tanggal] = m[c.tanggal] || []).push(c); });
    return m;
  }, [rows]);

  const lead = (first.getDay() + 6) % 7; // Senin = kolom pertama
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(isoOf(new Date(ym.y, ym.m, d)));
  while (cells.length % 7) cells.push(null);

  const move = (n) => {
    const d = new Date(ym.y, ym.m + n, 1);
    setYm({ y: d.getFullYear(), m: d.getMonth() });
    setSel(isoOf(d));
  };
  const today = todayIso();
  const selEvs = byDate[sel] || [];

  return (
    <>
      <div className="ph">
        <div><div className="eyebrow">Jadwal sesi foto</div><h1>Kalender</h1></div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button className="x" type="button" aria-label="Bulan sebelumnya" onClick={() => move(-1)} style={{ background: '#FFFFFF', border: '1px solid #E3E6E2' }}><Icon name="chevLeft" /></button>
          <div style={{ fontWeight: 800, fontSize: 16, minWidth: 150, textAlign: 'center' }}>{BLN[ym.m]} {ym.y}</div>
          <button className="x" type="button" aria-label="Bulan berikutnya" onClick={() => move(1)} style={{ background: '#FFFFFF', border: '1px solid #E3E6E2' }}><Icon name="chevRight" /></button>
        </div>
      </div>

      {error ? <p className="alert">Gagal memuat jadwal: {error}</p> : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        <section className="box" style={{ flex: '3 1 480px', minWidth: 0, padding: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4 }}>
            {HEADS.map((h) => <div key={h} style={{ fontSize: 12, fontWeight: 800, color: '#5F6964', textAlign: 'center', padding: '6px 0' }}>{h}</div>)}
            {cells.map((iso, i) => {
              if (!iso) return <div key={'b' + i} aria-hidden="true" />;
              const evs = byDate[iso] || [];
              const cls = 'day' + (iso === today ? ' today' : '') + (iso === sel ? ' sel' : '');
              return (
                <button key={iso} type="button" className={cls} onClick={() => setSel(iso)} aria-label={tglPanjang(iso) + ', ' + evs.length + ' sesi'}>
                  <span className="n">{Number(iso.slice(8))}</span>
                  <span className="evs hide-m">
                    {evs.slice(0, 3).map((e) => <span key={e.id} className="ev">{jamOf(e.jam)} {e.nama}</span>)}
                    {evs.length > 3 ? <span style={{ fontSize: 11, color: '#5F6964', fontWeight: 700 }}>+{evs.length - 3} lagi</span> : null}
                  </span>
                  {evs.length ? <span className="dots show-m">{evs.length}</span> : null}
                </button>
              );
            })}
          </div>
          {!rows && !error ? <div className="loading" style={{ padding: '16px 0 4px' }}><span className="spin" />Memuat…</div> : null}
        </section>

        <section className="box" style={{ flex: '1 1 280px', minWidth: 0 }}>
          <div className="eyebrow">Jadwal tanggal</div>
          <h2 style={{ margin: '2px 0 14px', fontSize: 19, fontWeight: 800 }}>{tglPanjang(sel)}</h2>
          {selEvs.map((e) => (
            <Link key={e.id} to={'/client/' + e.id} style={{ display: 'block', padding: '12px 14px', border: '1px solid #E3E6E2', borderRadius: 14, marginBottom: 8, textDecoration: 'none', color: '#1C2321' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <strong style={{ fontSize: 16 }}>{jamOf(e.jam)}</strong>
                <span className={'pill ' + (e.selesai ? 'st-selesai' : 'st-belum')}>{e.selesai ? 'Selesai' : 'Belum foto'}</span>
              </div>
              <div style={{ fontWeight: 800, marginTop: 6 }}>{e.nama}</div>
              <div style={{ fontSize: 13, color: '#5F6964', marginTop: 2 }}>{e.jenis || '–'} · {e.lokasi || '–'}</div>
            </Link>
          ))}
          {rows && selEvs.length === 0 ? <p style={{ margin: '0 0 8px', fontSize: 14, color: '#5F6964' }}>Belum ada sesi di tanggal ini.</p> : null}
          <button className="btn-p" type="button" style={{ marginTop: 8, width: '100%' }} onClick={() => openForm({ presetDate: sel })}>+ Tambah client di tanggal ini</button>
        </section>
      </div>
    </>
  );
}
