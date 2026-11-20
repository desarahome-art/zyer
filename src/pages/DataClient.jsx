import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import ClientCard from '../components/ClientCard';
import ClientMenu from '../components/ClientMenu';
import { useApp } from '../AppContext';
import useClients from '../lib/useClients';
import useDeleteClient from '../lib/useDeleteClient';

const TABS = [['semua', 'Semua'], ['belum', 'Belum foto'], ['selesai', 'Selesai']];

export default function DataClient() {
  const nav = useNavigate();
  const { openForm, openWa } = useApp();
  const { data, error, toggleSelesai } = useClients();
  const del = useDeleteClient();
  const [tab, setTab] = useState('semua');
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState(null);

  const rows = useMemo(() => {
    if (!data) return [];
    const s = q.trim().toLowerCase();
    const digits = s.replace(/\D/g, '');
    const filtered = data.filter((c) =>
      (tab === 'semua' || (tab === 'selesai' ? c.selesai : !c.selesai)) &&
      (!s || c.nama.toLowerCase().includes(s) || (digits && c.wa.replace(/\D/g, '').includes(digits)) || (c.kampus || '').toLowerCase().includes(s)));
    // Belum foto: jadwal terdekat dulu. Selesai: terbaru dulu.
    const belum = filtered.filter((c) => !c.selesai);
    const done = filtered.filter((c) => c.selesai).reverse();
    return [...belum, ...done];
  }, [data, tab, q]);

  const nSelesai = data?.filter((c) => c.selesai).length ?? 0;
  const nBelum = (data?.length ?? 0) - nSelesai;

  return (
    <>
      <div className="ph">
        <div>
          <div className="eyebrow">{nBelum} belum foto · {nSelesai} selesai</div>
          <h1>Data Client</h1>
        </div>
        <button className="btn-top hide-m" type="button" onClick={() => openForm()}><Icon name="plus" stroke={2.8} /> Tambah Client</button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <label className="search" style={{ flex: '2 1 280px', background: '#FFFFFF' }}>
          <Icon name="search" size={18} stroke={2.2} style={{ color: '#5F6964' }} />
          <input aria-label="Cari client" placeholder="Cari nama, nomor WA, atau kampus" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="seg" role="group" aria-label="Filter status" style={{ flex: '1 1 300px' }}>
          {TABS.map(([id, label]) => (
            <button key={id} type="button" className={tab === id ? 'on' : undefined} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>
      </div>

      {error ? <p className="alert">Gagal memuat data: {error}</p> : null}
      {!data && !error ? <div className="loading"><span className="spin" />Memuat data client…</div> : null}

      {data ? (
        <div className="grid-cards">
          {rows.map((c) => (
            <ClientCard key={c.id} c={c}
              onToggle={() => toggleSelesai(c)}
              onWa={() => openWa(c)}
              onMore={() => setMenu(c)}
              onOpen={() => nav('/client/' + c.id)} />
          ))}
          {rows.length === 0 ? (
            <p className="empty">{data.length === 0 ? 'Belum ada client. Tekan "Tambah Client" untuk mulai.' : 'Tidak ada client yang cocok.'}</p>
          ) : null}
        </div>
      ) : null}

      <button className="fab show-m" type="button" onClick={() => openForm()}><Icon name="plus" stroke={2.8} />Tambah Client</button>

      <ClientMenu client={menu} onClose={() => setMenu(null)}
        onDetail={() => { const id = menu.id; setMenu(null); nav('/client/' + id); }}
        onEdit={() => { const c = menu; setMenu(null); openForm({ client: c }); }}
        onDelete={() => { const c = menu; setMenu(null); del(c); }} />
    </>
  );
}
