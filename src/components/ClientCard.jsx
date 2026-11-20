import Icon from './Icon';
import { jamOf, rp, sisaOf, tglPendek } from '../lib/format';

export default function ClientCard({ c, onToggle, onWa, onMore, onOpen, busy }) {
  const sisa = sisaOf(c);
  return (
    <article className={'card' + (c.selesai ? ' done' : '')}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <button type="button" className="card-name" onClick={onOpen} style={{ fontSize: 17, fontWeight: 800 }}>{c.nama}</button>
          <div style={{ fontSize: 13, color: '#5F6964', marginTop: 2 }}>{c.wa}{c.kampus ? ' · ' + c.kampus : ''}</div>
        </div>
        <span className={'pill ' + (c.selesai ? 'st-selesai' : 'st-belum')}>{c.selesai ? 'Selesai' : 'Belum foto'}</span>
      </div>
      <div className="meta">
        <div><Icon name="calendar" size={16} />{tglPendek(c.tanggal)} · {jamOf(c.jam)}</div>
        <div><Icon name="camera" size={16} />{[c.jenis, c.paket].filter(Boolean).join(' · ') || '–'}</div>
        <div><Icon name="pin" size={16} />{c.lokasi || '–'}</div>
      </div>
      <div className="pay"><span>Sisa bayar</span><strong className={sisa ? 'owe' : 'paid'}>{sisa ? rp(sisa) : 'Lunas'}</strong></div>
      <div className="acts">
        {c.selesai ? (
          <button className="b b-undo" type="button" onClick={onToggle} disabled={busy}>Batalkan selesai</button>
        ) : (
          <button className="b b-done" type="button" onClick={onToggle} disabled={busy}><Icon name="check" size={18} stroke={3} />Selesai</button>
        )}
        <button className="b b-wa" type="button" onClick={onWa}><Icon name="chat" size={18} stroke={2.2} />Chat WA</button>
        <button className="b b-more" type="button" onClick={onMore} aria-label={'Opsi lain untuk ' + c.nama}><Icon name="more" size={20} /></button>
      </div>
    </article>
  );
}
