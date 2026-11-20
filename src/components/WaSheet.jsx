import { useState } from 'react';
import Sheet from './Sheet';
import { useApp } from '../AppContext';
import { fillTemplate, waLink } from '../lib/format';

export default function WaSheet() {
  const { waClient: c, closeWa, templates } = useApp();
  const [kode, setKode] = useState(templates[0]?.kode);
  const tpl = templates.find((t) => t.kode === kode) || templates[0];
  const text = fillTemplate(tpl?.isi, c);

  return (
    <Sheet open onClose={closeWa} title={'Chat WA ke ' + c.nama} sub={c.wa} maxWidth={560}>
      <div className="chips" role="group" aria-label="Template pesan" style={{ flexWrap: 'wrap' }}>
        {templates.map((t) => (
          <button key={t.kode} type="button" className={'chip' + (t.kode === tpl?.kode ? ' on' : '')} onClick={() => setKode(t.kode)}>{t.judul}</button>
        ))}
      </div>
      <div style={{ background: '#EFEAE2', borderRadius: 16, padding: 14, display: 'flex', justifyContent: 'flex-end' }}>
        <div className="bubble" style={{ maxWidth: '94%' }}>{text}</div>
      </div>
      <a className="btn-p" href={waLink(c, text)} target="_blank" rel="noopener noreferrer" onClick={closeWa}
        style={{ background: '#1E6B3A', color: '#FFFFFF' }}>Kirim lewat WhatsApp</a>
      <p style={{ margin: 0, fontSize: 12, color: '#5F6964' }}>Pesan masih bisa diubah di WhatsApp sebelum dikirim.</p>
    </Sheet>
  );
}
