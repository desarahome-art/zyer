import { useState } from 'react';
import Sheet from './Sheet';
import Icon from './Icon';
import { useApp } from '../AppContext';
import { addDays, fillTemplate, sisaOf, todayIso, waLink } from '../lib/format';

const INFO = {
  konfirmasi: { icon: 'check', label: 'Konfirmasi Booking', desc: 'Setelah client booking / DP' },
  pengingat: { icon: 'bell', label: 'Pengingat H-1', desc: 'Sehari sebelum sesi' },
  hasil: { icon: 'image', label: 'Kirim Hasil Foto', desc: 'Link Google Drive siap' },
  pelunasan: { icon: 'wallet', label: 'Tagih Pelunasan', desc: 'Masih ada sisa bayar' },
  terimakasih: { icon: 'heart', label: 'Terima Kasih', desc: 'Setelah semua beres' },
};

/** Template yang paling cocok dengan kondisi client saat ini. */
function suggest(c) {
  const sisa = sisaOf(c);
  if (c.selesai && c.link_hasil) return sisa ? 'pelunasan' : 'hasil';
  if (c.selesai) return sisa ? 'pelunasan' : 'terimakasih';
  if (c.tanggal === addDays(todayIso(), 1)) return 'pengingat';
  return 'konfirmasi';
}

export default function WaSheet() {
  const { waClient: c, closeWa, templates } = useApp();
  const sug = suggest(c);
  const [kode, setKode] = useState(() => (templates.some((t) => t.kode === sug) ? sug : templates[0]?.kode));
  const tpl = templates.find((t) => t.kode === kode) || templates[0];
  const text = fillTemplate(tpl?.isi, c);

  return (
    <Sheet open onClose={closeWa} title={'Kirim pesan ke ' + c.nama} sub={'WhatsApp ' + c.wa} maxWidth={560}
      footer={(
        <a className="wa-send" href={waLink(c, text)} target="_blank" rel="noopener noreferrer" onClick={closeWa}>
          <Icon name="chat" size={20} stroke={2.2} />Buka WhatsApp &amp; kirim
        </a>
      )}>
      <div>
        <p className="wa-step"><b>1</b>Pilih jenis pesan</p>
        <div className="tpl-grid" role="radiogroup" aria-label="Jenis pesan">
          {templates.map((t) => {
            const info = INFO[t.kode] || { icon: 'chat', label: t.judul, desc: '' };
            const on = t.kode === tpl?.kode;
            return (
              <button key={t.kode} type="button" role="radio" aria-checked={on} className={'tpl' + (on ? ' on' : '')} onClick={() => setKode(t.kode)}>
                {t.kode === sug ? <span className="sug">Disarankan</span> : null}
                <span className="ti"><Icon name={info.icon} size={20} /></span>
                <span style={{ minWidth: 0 }}><strong>{info.label}</strong>{info.desc ? <small>{info.desc}</small> : null}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="wa-step"><b>2</b>Cek isi pesan</p>
        <div className="wa-prev">
          <div className="bubble" style={{ maxWidth: '96%' }}>{text}</div>
        </div>
        {tpl?.kode === 'hasil' && !c.link_hasil ? (
          <p className="alert" style={{ margin: '10px 0 0', fontSize: 13 }}>Link hasil foto belum diisi. Tambahkan dulu di halaman Detail Client.</p>
        ) : (
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#5F6964' }}>Pesan masih bisa diubah di WhatsApp sebelum dikirim.</p>
        )}
      </div>
    </Sheet>
  );
}
