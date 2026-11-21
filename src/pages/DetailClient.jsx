import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/Icon';
import { useApp } from '../AppContext';
import { getClient, updateClient } from '../lib/api';
import useDeleteClient from '../lib/useDeleteClient';
import { itemLabel, itemTotal, itemsOf, jamOf, rp, sisaOf, tglPanjang } from '../lib/format';

export default function DetailClient() {
  const { id } = useParams();
  const nav = useNavigate();
  const { version, openForm, openWa, toast, bump } = useApp();
  const del = useDeleteClient();
  const [c, setC] = useState(null);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    getClient(id)
      .then((row) => { if (alive) { setC(row); setLink(row.link_hasil || ''); setError(''); } })
      .catch((e) => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, [id, version]);

  const patch = async (p, msg) => {
    setBusy(true);
    try { const row = await updateClient(c.id, p); setC(row); bump(); if (msg) toast(msg); }
    catch (e) { toast('Gagal menyimpan: ' + e.message); }
    finally { setBusy(false); }
  };

  if (error) return (<><Link to="/client">← Kembali ke Data Client</Link><p className="alert">Data tidak ditemukan atau gagal dimuat: {error}</p></>);
  if (!c) return <div className="loading"><span className="spin" />Memuat…</div>;

  const sisa = sisaOf(c);
  return (
    <>
      <Link to="/client" style={{ fontSize: 14, fontWeight: 700, minHeight: 44, display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start' }}>← Kembali ke Data Client</Link>
      <div className="ph">
        <div>
          <div className="eyebrow">{[c.jenis, c.paket].filter(Boolean).join(' · ') || 'Sesi foto'}</div>
          <h1>{c.nama}</h1>
        </div>
        <span className={'pill ' + (c.selesai ? 'st-selesai' : 'st-belum')} style={{ fontSize: 14, padding: '6px 14px' }}>{c.selesai ? 'Selesai' : 'Belum foto'}</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ flex: '2 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section className="box">
            <h2 style={{ margin: '0 0 12px', fontSize: 17, fontWeight: 800 }}>Info sesi</h2>
            <dl className="dl">
              <div><dt>Tanggal</dt><dd>{tglPanjang(c.tanggal)}</dd></div>
              <div><dt>Jam</dt><dd>{jamOf(c.jam)}</dd></div>
              <div><dt>Lokasi</dt><dd>{c.lokasi || '–'}</dd></div>
              <div><dt>Jumlah orang</dt><dd>{c.jumlah_orang ? c.jumlah_orang + ' orang' : '–'}</dd></div>
              <div><dt>WhatsApp</dt><dd>{c.wa}</dd></div>
              <div><dt>Kampus</dt><dd>{c.kampus || '–'}</dd></div>
            </dl>
            {c.catatan ? (
              <div style={{ marginTop: 14, padding: '12px 14px', background: '#F7F8F6', borderRadius: 12, fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                <strong style={{ display: 'block', fontSize: 12, color: '#5F6964', marginBottom: 2 }}>Catatan</strong>{c.catatan}
              </div>
            ) : null}
          </section>

          <section className="box">
            <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 800 }}>Link hasil foto</h2>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#5F6964' }}>Tempel link Google Drive. Link ini otomatis dipakai di template “Pengiriman Hasil Foto”.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="mf" aria-label="Link Google Drive" placeholder="https://drive.google.com/…" value={link} onChange={(e) => setLink(e.target.value)} style={{ flex: '1 1 220px', width: 'auto' }} />
              <button className="btn-p" type="button" disabled={busy || link === (c.link_hasil || '')} style={{ padding: '0 20px', flex: '1 0 auto' }}
                onClick={() => patch({ link_hasil: link.trim() }, 'Link hasil foto disimpan')}>Simpan link</button>
            </div>
          </section>
        </div>

        <div style={{ flex: '1 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section className="box">
            <h2 style={{ margin: '0 0 12px', fontSize: 17, fontWeight: 800 }}>Pembayaran</h2>
            <div className="bill">
              {itemsOf(c).map((it, i) => (
                <div key={i} className="bill-row"><span>{itemLabel(it, it.tipe === 'paket' ? c.jenis : '')}</span><span>{rp(itemTotal(it))}</span></div>
              ))}
              {c.diskon ? <div className="bill-row"><span>Diskon</span><span>– {rp(c.diskon)}</span></div> : null}
              <div className="bill-row bill-sum"><span>Harga akhir</span><span>{rp(c.harga)}</span></div>
              <div className="bill-row"><span>DP ({c.metode})</span><span>– {rp(c.dp)}</span></div>
              {c.pelunasan ? <div className="bill-row"><span>Pelunasan</span><span>– {rp(c.pelunasan)}</span></div> : null}
              <div className="bill-row bill-sum"><span>Sisa</span><span style={{ color: sisa ? '#7A4A00' : '#1E6B3A', fontSize: 18 }}>{sisa ? rp(sisa) : 'Lunas'}</span></div>
            </div>
            {sisa ? (
              <button className="btn-s" type="button" disabled={busy} style={{ width: '100%', marginTop: 14 }}
                onClick={() => patch({ pelunasan: (c.pelunasan || 0) + sisa }, 'Pelunasan dicatat, status Lunas')}>Catat pelunasan ({rp(sisa)})</button>
            ) : null}
          </section>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {c.selesai ? (
              <button className="b b-undo" type="button" disabled={busy} onClick={() => patch({ selesai: false }, 'Status dikembalikan ke Belum foto')} style={{ minHeight: 54 }}>Batalkan selesai</button>
            ) : (
              <button className="b b-done" type="button" disabled={busy} onClick={() => patch({ selesai: true }, c.nama + ' ditandai selesai')} style={{ minHeight: 54, fontSize: 16 }}><Icon name="check" size={18} stroke={3} />Tandai selesai foto</button>
            )}
            <button className="b b-wa" type="button" onClick={() => openWa(c)} style={{ minHeight: 54, fontSize: 16 }}><Icon name="chat" size={18} stroke={2.2} />Chat WA client</button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button className="btn-s" type="button" onClick={() => openForm({ client: c })}>Edit</button>
              <button className="btn-s" type="button" style={{ color: '#A1302A' }} onClick={() => del(c, () => nav('/client'))}>Hapus</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
