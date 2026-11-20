import { useMemo, useState } from 'react';
import Sheet from './Sheet';
import { useApp } from '../AppContext';
import { insertClient, updateClient } from '../lib/api';
import { num, ribuan, rp } from '../lib/format';

const LAIN = '__lain__';
const METODE = ['Transfer', 'QRIS', 'Cash'];

function initialState(client, presetDate, jenis, lokasi) {
  if (client) {
    const inList = lokasi.some((l) => l.nama === client.lokasi);
    return {
      nama: client.nama, wa: client.wa, kampus: client.kampus || '',
      jenis: client.jenis || '', paket: client.paket || '',
      tanggal: client.tanggal || '', jam: client.jam ? String(client.jam).slice(0, 5) : '',
      orang: client.jumlah_orang ? String(client.jumlah_orang) : '',
      lok: client.lokasi ? (inList ? client.lokasi : LAIN) : (lokasi[0]?.nama || LAIN),
      lain: inList ? '' : (client.lokasi || ''),
      catatan: client.catatan || '',
      harga: ribuan(client.harga), dp: ribuan(client.dp), metode: client.metode || 'Transfer',
    };
  }
  const j = jenis[0];
  const p = j?.paket?.[0];
  return {
    nama: '', wa: '', kampus: '', jenis: j?.nama || '', paket: p?.nama || '',
    tanggal: presetDate || '', jam: '', orang: '',
    lok: lokasi[0]?.nama || LAIN, lain: '', catatan: '',
    harga: p ? ribuan(p.harga) : '', dp: '', metode: 'Transfer',
  };
}

export default function ClientForm() {
  const { form, closeForm, jenis, lokasi, bump, toast } = useApp();
  const editing = form?.client || null;
  const [f, setF] = useState(() => initialState(editing, form?.presetDate, jenis, lokasi));
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k, v) => { setF((s) => ({ ...s, [k]: v })); setErr(''); };
  const onText = (k) => (e) => set(k, e.target.value);
  const onMoney = (k) => (e) => set(k, ribuan(num(e.target.value)));

  const jenisAktif = useMemo(() => jenis.find((j) => j.nama === f.jenis), [jenis, f.jenis]);
  const sisa = Math.max(0, num(f.harga) - num(f.dp) - (editing?.pelunasan || 0));

  const pickJenis = (j) => {
    const p = j.paket[0];
    setF((s) => ({ ...s, jenis: j.nama, paket: p?.nama || '', harga: p ? ribuan(p.harga) : s.harga }));
  };
  const pickPaket = (p) => setF((s) => ({ ...s, paket: p.nama, harga: ribuan(p.harga) }));

  const save = async () => {
    if (!f.nama.trim() || !f.wa.trim() || !f.tanggal) { setErr('Nama, nomor WA, dan tanggal wajib diisi.'); return; }
    if (num(f.dp) > num(f.harga)) { setErr('DP tidak boleh lebih besar dari harga.'); return; }
    const row = {
      nama: f.nama.trim(), wa: f.wa.trim(), kampus: f.kampus.trim(),
      jenis: f.jenis, paket: f.paket,
      tanggal: f.tanggal, jam: f.jam || null, jumlah_orang: f.orang ? parseInt(f.orang, 10) : null,
      lokasi: f.lok === LAIN ? f.lain.trim() : f.lok,
      catatan: f.catatan.trim(), harga: num(f.harga), dp: num(f.dp), metode: f.metode,
    };
    setSaving(true);
    try {
      if (editing) { await updateClient(editing.id, row); toast('Data ' + row.nama + ' diperbarui'); }
      else { await insertClient(row); toast(row.nama + ' berhasil ditambahkan'); }
      bump();
      closeForm();
    } catch (e) {
      setErr('Gagal menyimpan: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open onClose={closeForm} closeOnBackdrop={false}
      title={editing ? 'Edit Client' : 'Tambah Client'} sub="Isi data booking client"
      footer={(<>
        <button className="btn-s" type="button" onClick={closeForm}>Batal</button>
        <button className="btn-p" type="button" onClick={save} disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan'}</button>
      </>)}>

      <div>
        <div className="sec">Data client</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label className="ml" htmlFor="m-nama">Nama client</label>
            <input className="mf" id="m-nama" value={f.nama} onChange={onText('nama')} placeholder="Contoh: Nadia & Rizky" autoComplete="off" /></div>
          <div><label className="ml" htmlFor="m-wa">Nomor WhatsApp</label>
            <input className="mf" id="m-wa" type="tel" inputMode="tel" value={f.wa} onChange={onText('wa')} placeholder="08xx xxxx xxxx" autoComplete="off" /></div>
          <div><label className="ml" htmlFor="m-kampus">Kampus <span style={{ fontWeight: 500, color: '#5F6964' }}>(opsional)</span></label>
            <input className="mf" id="m-kampus" value={f.kampus} onChange={onText('kampus')} placeholder="Contoh: Universitas Tanjungpura" /></div>
        </div>
      </div>

      <div>
        <div className="sec">Sesi &amp; paket</div>
        {jenis.length === 0 ? (
          <p className="alert" style={{ margin: 0 }}>Belum ada jenis sesi. Tambahkan dulu di menu Pengaturan.</p>
        ) : (<>
          <div className="ml" id="m-jenis">Jenis sesi</div>
          <div className="chips" role="group" aria-labelledby="m-jenis" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
            {jenis.map((j) => (
              <button key={j.id} type="button" className={'chip' + (f.jenis === j.nama ? ' on' : '')} onClick={() => pickJenis(j)}>{j.nama}</button>
            ))}
          </div>
          <div className="ml" id="m-paket">Paket {f.jenis}</div>
          <div role="group" aria-labelledby="m-paket">
            {(jenisAktif?.paket || []).map((p) => (
              <button key={p.id} type="button" className={'pk' + (f.paket === p.nama ? ' on' : '')} onClick={() => pickPaket(p)}>
                <span className="radio" aria-hidden="true" />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ display: 'block', fontSize: 15 }}>{p.nama}</strong>
                  <span style={{ fontSize: 12, color: '#5F6964' }}>{p.keterangan}</span>
                </span>
                <strong style={{ fontSize: 15, color: '#1F4A36', whiteSpace: 'nowrap' }}>{rp(p.harga)}</strong>
              </button>
            ))}
            {jenisAktif && jenisAktif.paket.length === 0 ? <p style={{ margin: 0, fontSize: 13, color: '#5F6964' }}>Belum ada paket untuk sesi ini.</p> : null}
          </div>
        </>)}
      </div>

      <div>
        <div className="sec">Jadwal &amp; lokasi</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 12 }}>
          <div><label className="ml" htmlFor="m-tgl">Tanggal</label><input className="mf" id="m-tgl" type="date" value={f.tanggal} onChange={onText('tanggal')} /></div>
          <div><label className="ml" htmlFor="m-jam">Jam</label><input className="mf" id="m-jam" type="time" value={f.jam} onChange={onText('jam')} /></div>
        </div>
        <div style={{ marginBottom: 14 }}><label className="ml" htmlFor="m-org">Jumlah orang</label>
          <input className="mf" id="m-org" type="number" inputMode="numeric" min="1" value={f.orang} onChange={onText('orang')} placeholder="2" /></div>
        <div className="ml" id="m-lok">Lokasi outdoor</div>
        <div className="chips" role="group" aria-labelledby="m-lok" style={{ flexWrap: 'wrap' }}>
          {lokasi.map((l) => (
            <button key={l.id} type="button" className={'chip' + (f.lok === l.nama ? ' on' : '')} onClick={() => set('lok', l.nama)}>{l.nama}</button>
          ))}
          <button type="button" className={'chip' + (f.lok === LAIN ? ' on' : '')} onClick={() => set('lok', LAIN)}>Lainnya…</button>
        </div>
        {f.lok === LAIN ? (
          <div style={{ marginTop: 12 }}><label className="ml" htmlFor="m-lain">Tulis lokasi lainnya</label>
            <input className="mf" id="m-lain" value={f.lain} onChange={onText('lain')} placeholder="Contoh: Kebun sawit Rasau Jaya" /></div>
        ) : null}
        <div style={{ marginTop: 14 }}><label className="ml" htmlFor="m-cat">Catatan <span style={{ fontWeight: 500, color: '#5F6964' }}>(opsional)</span></label>
          <textarea className="mf" id="m-cat" rows={2} value={f.catatan} onChange={onText('catatan')} placeholder="Konsep, outfit, request pose…" style={{ resize: 'vertical' }} /></div>
      </div>

      <div>
        <div className="sec">Pembayaran</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 12 }}>
          <div><label className="ml" htmlFor="m-harga">Harga</label><div className="rp"><span aria-hidden="true">Rp</span>
            <input className="mf" id="m-harga" inputMode="numeric" value={f.harga} onChange={onMoney('harga')} placeholder="0" /></div></div>
          <div><label className="ml" htmlFor="m-dp">DP</label><div className="rp"><span aria-hidden="true">Rp</span>
            <input className="mf" id="m-dp" inputMode="numeric" value={f.dp} onChange={onMoney('dp')} placeholder="0" /></div></div>
        </div>
        <div className="ml" id="m-met">Metode bayar</div>
        <div className="chips" role="group" aria-labelledby="m-met" style={{ marginBottom: 12 }}>
          {METODE.map((m) => (
            <button key={m} type="button" className={'chip' + (f.metode === m ? ' on' : '')} onClick={() => set('metode', m)}>{m}</button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: 14, background: '#F2F8F4', border: '1px solid #D5E8DC' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1F4A36' }}>Sisa pembayaran</span>
          <strong style={{ fontSize: 20, color: '#1F4A36' }}>{sisa ? rp(sisa) : 'Lunas'}</strong>
        </div>
      </div>

      {err ? <p role="alert" className="alert" style={{ margin: 0 }}>{err}</p> : null}
    </Sheet>
  );
}
