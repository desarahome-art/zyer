import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { useApp } from '../AppContext';
import useClients from '../lib/useClients';
import { addDays, jamOf, tglPanjang, todayIso } from '../lib/format';

export default function Dashboard() {
  const { openForm } = useApp();
  const { data, error } = useClients();
  const today = todayIso();
  const tomorrow = addDays(today, 1);

  const total = data?.length ?? 0;
  const selesai = data?.filter((c) => c.selesai).length ?? 0;
  const days = [
    { label: 'Hari ini · ' + tglPanjang(today), items: (data || []).filter((c) => c.tanggal === today) },
    { label: 'Besok · ' + tglPanjang(tomorrow), items: (data || []).filter((c) => c.tanggal === tomorrow) },
  ];
  const stat = (label, value, color) => (
    <Link className="box" to="/client" style={{ textDecoration: 'none', color: '#1C2321' }}>
      <div className="eyebrow">{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, marginTop: 6, color }}>{data ? value : '–'}</div>
    </Link>
  );

  return (
    <>
      <div className="ph">
        <div>
          <div className="eyebrow">{tglPanjang(today)}</div>
          <h1>Dashboard</h1>
        </div>
        <button className="btn-top hide-m" type="button" onClick={() => openForm()}><Icon name="plus" stroke={2.8} /> Tambah Client</button>
      </div>

      {error ? <p className="alert">Gagal memuat data: {error}</p> : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
        {stat('Total client', total)}
        {stat('Belum foto', total - selesai, '#7A4A00')}
        {stat('Selesai', selesai, '#1E6B3A')}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        <section className="box" style={{ flex: '2 1 420px', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Jadwal foto</h2>
            <Link to="/kalender" style={{ fontSize: 14, fontWeight: 700, minHeight: 44, display: 'flex', alignItems: 'center' }}>Lihat kalender</Link>
          </div>
          {!data && !error ? <div className="loading"><span className="spin" />Memuat…</div> : null}
          {data ? days.map((d) => (
            <div key={d.label}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#5F6964', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '12px 0 8px' }}>{d.label}</div>
              {d.items.length === 0 ? <p style={{ margin: '0 0 8px', fontSize: 14, color: '#5F6964' }}>Tidak ada jadwal.</p> : null}
              {d.items.map((c) => (
                <Link key={c.id} to={'/client/' + c.id} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: 12, border: '1px solid #E3E6E2', borderRadius: 14, marginBottom: 8, textDecoration: 'none', color: '#1C2321', background: '#FFFFFF' }}>
                  <div style={{ width: 62, flex: 'none', textAlign: 'center', background: '#E3EEE8', borderRadius: 10, padding: '10px 0', fontWeight: 800, color: '#1F4A36', fontSize: 15 }}>{jamOf(c.jam)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{c.nama}</div>
                    <div style={{ fontSize: 13, color: '#5F6964', marginTop: 2 }}>{c.jenis || '–'} · {c.lokasi || '–'}</div>
                  </div>
                  <span className={'pill ' + (c.selesai ? 'st-selesai' : 'st-belum')}>{c.selesai ? 'Selesai' : 'Belum foto'}</span>
                </Link>
              ))}
            </div>
          )) : null}
        </section>

        <section className="box" style={{ flex: '1 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>Akses cepat</h2>
          <button className="menu-b" type="button" onClick={() => openForm()}><Icon name="plus" stroke={2.8} /> Tambah client baru</button>
          <Link className="menu-b" to="/client" style={{ textDecoration: 'none' }}><Icon name="users" /> Lihat semua client</Link>
          <Link className="menu-b" to="/pengaturan" style={{ textDecoration: 'none' }}><Icon name="settings" /> Atur paket &amp; harga</Link>
        </section>
      </div>

      <button className="fab show-m" type="button" onClick={() => openForm()}><Icon name="plus" stroke={2.8} />Tambah Client</button>
    </>
  );
}
