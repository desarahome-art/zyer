import { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import Sheet from '../components/Sheet';
import { useApp } from '../AppContext';
import {
  deleteJenis, deleteLokasi, deletePaket, insertJenis, insertLokasi, insertPaket, saveTemplate, updatePaket,
} from '../lib/api';
import { DEFAULT_TEMPLATES } from '../lib/defaults';
import { num, ribuan, rp } from '../lib/format';

const TABS = [['paket', 'Sesi & Paket'], ['lokasi', 'Lokasi'], ['wa', 'Template WA']];

export default function Pengaturan() {
  const [tab, setTab] = useState('paket');
  const { settingsError } = useApp();
  return (
    <>
      <div className="ph"><div><div className="eyebrow">Data dasar untuk form Tambah Client</div><h1>Pengaturan</h1></div></div>
      <div className="seg" role="group" aria-label="Bagian pengaturan" style={{ maxWidth: 520 }}>
        {TABS.map(([id, label]) => (
          <button key={id} type="button" className={tab === id ? 'on' : undefined} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      {settingsError ? <p className="alert">Gagal memuat pengaturan: {settingsError}</p> : null}
      {tab === 'paket' ? <TabPaket /> : null}
      {tab === 'lokasi' ? <TabLokasi /> : null}
      {tab === 'wa' ? <TabTemplate /> : null}
    </>
  );
}

/* ---------------- Sesi & Paket ---------------- */
function TabPaket() {
  const { jenis, reloadSettings, toast } = useApp();
  const [open, setOpen] = useState(null);
  const [sheet, setSheet] = useState(null); // {kind:'jenis'} | {kind:'paket', jenis, paket?}
  const [pf, setPf] = useState({ nama: '', harga: '', ket: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open === null && jenis.length) setOpen(jenis[0].id); }, [jenis, open]);

  const openSheet = (s, init = { nama: '', harga: '', ket: '' }) => { setSheet(s); setPf(init); setErr(''); };
  const run = async (fn, msg) => {
    setBusy(true);
    try { await fn(); await reloadSettings(); setSheet(null); if (msg) toast(msg); }
    catch (e) { setErr(e.message.includes('duplicate') ? 'Nama sudah dipakai.' : e.message); }
    finally { setBusy(false); }
  };

  const save = () => {
    if (sheet.kind === 'jenis') {
      if (!pf.nama.trim()) { setErr('Nama jenis sesi wajib diisi.'); return; }
      run(async () => { const j = await insertJenis(pf.nama.trim(), jenis.length + 1); setOpen(j.id); }, 'Jenis sesi ditambahkan');
      return;
    }
    if (!pf.nama.trim() || !num(pf.harga)) { setErr('Nama paket dan harga wajib diisi.'); return; }
    const row = { nama: pf.nama.trim(), harga: num(pf.harga), keterangan: pf.ket.trim() };
    if (sheet.paket) run(() => updatePaket(sheet.paket.id, row), 'Paket diperbarui');
    else run(() => insertPaket({ ...row, jenis_id: sheet.jenis.id, urutan: sheet.jenis.paket.length + 1 }), 'Paket ditambahkan');
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <p style={{ margin: 0, fontSize: 14, color: '#5F6964', lineHeight: 1.45 }}>Paket dan harga di sini muncul otomatis saat menambah client.</p>
        <button className="chip" type="button" onClick={() => openSheet({ kind: 'jenis' })}>+ Jenis sesi</button>
      </div>
      <div className="grid-cards">
        {jenis.map((j) => {
          const isOpen = open === j.id;
          const min = j.paket.length ? rp(Math.min(...j.paket.map((p) => p.harga))) : '–';
          return (
            <section key={j.id} className={'jc' + (isOpen ? ' open' : '')}>
              <button className="jh" type="button" onClick={() => setOpen(isOpen ? '' : j.id)} aria-expanded={isOpen}>
                <span className="jbadge" aria-hidden="true">{j.nama.charAt(0)}</span>
                <span><strong style={{ display: 'block', fontSize: 16 }}>{j.nama}</strong>
                  <span style={{ fontSize: 13, color: '#5F6964' }}>{j.paket.length} paket · mulai {min}</span></span>
                <Icon name="chevDown" className="chev" stroke={2.4} />
              </button>
              {isOpen ? (
                <div style={{ padding: '0 14px 14px' }}>
                  {j.paket.map((p) => (
                    <button key={p.id} className="prow" type="button"
                      onClick={() => openSheet({ kind: 'paket', jenis: j, paket: p }, { nama: p.nama, harga: ribuan(p.harga), ket: p.keterangan })}>
                      <span style={{ flex: 1, minWidth: 0 }}><strong style={{ display: 'block', fontSize: 15 }}>{p.nama}</strong>
                        <span style={{ fontSize: 12, color: '#5F6964' }}>{p.keterangan || '–'}</span></span>
                      <strong style={{ fontSize: 15, color: '#1F4A36', whiteSpace: 'nowrap' }}>{rp(p.harga)}</strong>
                      <Icon name="edit" size={16} style={{ color: '#5F6964' }} />
                    </button>
                  ))}
                  <button className="addp" type="button" onClick={() => openSheet({ kind: 'paket', jenis: j })}>+ Tambah paket {j.nama}</button>
                  <button type="button" onClick={() => {
                    if (window.confirm('Hapus jenis sesi "' + j.nama + '" beserta semua paketnya? Data client lama tidak ikut terhapus.')) {
                      run(() => deleteJenis(j.id), 'Jenis sesi dihapus');
                    }
                  }} style={{ marginTop: 8, width: '100%', minHeight: 44, border: 0, background: 'transparent', color: '#A1302A', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Hapus jenis sesi ini</button>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      {sheet ? (
        <Sheet open onClose={() => setSheet(null)} maxWidth={520}
          title={sheet.kind === 'jenis' ? 'Tambah Jenis Sesi' : sheet.paket ? 'Edit Paket' : 'Tambah Paket'}
          sub={sheet.kind === 'jenis' ? 'Contoh: Maternity, Graduation Group' : 'Jenis sesi: ' + sheet.jenis.nama}
          footer={(<>
            <button className="btn-s" type="button" onClick={() => setSheet(null)}>Batal</button>
            <button className="btn-p" type="button" onClick={save} disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
          </>)}>
          {sheet.kind === 'jenis' ? (
            <div><label className="ml" htmlFor="s-jn">Nama jenis sesi</label>
              <input className="mf" id="s-jn" value={pf.nama} onChange={(e) => { setPf({ ...pf, nama: e.target.value }); setErr(''); }} placeholder="Contoh: Maternity" /></div>
          ) : (<>
            <div><label className="ml" htmlFor="s-nm">Nama paket</label>
              <input className="mf" id="s-nm" value={pf.nama} onChange={(e) => { setPf({ ...pf, nama: e.target.value }); setErr(''); }} placeholder="Contoh: Paket C" /></div>
            <div><label className="ml" htmlFor="s-hg">Harga</label><div className="rp"><span aria-hidden="true">Rp</span>
              <input className="mf" id="s-hg" inputMode="numeric" value={pf.harga} onChange={(e) => { setPf({ ...pf, harga: ribuan(num(e.target.value)) }); setErr(''); }} placeholder="0" /></div></div>
            <div><label className="ml" htmlFor="s-kt">Keterangan</label>
              <input className="mf" id="s-kt" value={pf.ket} onChange={(e) => setPf({ ...pf, ket: e.target.value })} placeholder="Contoh: 2 jam · 1 lokasi · 20 foto edit" /></div>
            {sheet.paket ? (
              <button className="menu-b red" type="button" disabled={busy} onClick={() => run(() => deletePaket(sheet.paket.id), 'Paket dihapus')}><Icon name="trash" />Hapus paket ini</button>
            ) : null}
          </>)}
          {err ? <p role="alert" className="alert" style={{ margin: 0 }}>{err}</p> : null}
        </Sheet>
      ) : null}
    </>
  );
}

/* ---------------- Lokasi ---------------- */
function TabLokasi() {
  const { lokasi, reloadSettings, toast } = useApp();
  const [nama, setNama] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    const v = nama.trim();
    if (!v) return;
    setBusy(true);
    try { await insertLokasi(v, lokasi.length + 1); setNama(''); await reloadSettings(); toast('Lokasi ditambahkan'); }
    catch (er) { toast(er.message.includes('duplicate') ? 'Lokasi itu sudah ada' : 'Gagal: ' + er.message); }
    finally { setBusy(false); }
  };
  const remove = async (l) => {
    try { await deleteLokasi(l.id); await reloadSettings(); toast(l.nama + ' dihapus'); }
    catch (er) { toast('Gagal: ' + er.message); }
  };

  return (
    <>
      <form className="panel" onSubmit={add} style={{ maxWidth: 760 }}>
        <label className="ml" htmlFor="newlok">Tambah lokasi outdoor</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="mf" id="newlok" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama lokasi" />
          <button className="btn-p" type="submit" disabled={busy} style={{ flex: 'none', padding: '0 18px' }}>Tambah</button>
        </div>
      </form>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0 10px' }}>
        {lokasi.map((l) => (
          <div key={l.id} className="lrow">
            <Icon name="pin" size={18} style={{ color: '#2F6B4F' }} />
            {l.nama}
            <button className="icb" type="button" onClick={() => remove(l)} aria-label={'Hapus ' + l.nama}><Icon name="trash" /></button>
          </div>
        ))}
      </div>
      {lokasi.length === 0 ? <p className="empty">Belum ada lokasi.</p> : null}
    </>
  );
}

/* ---------------- Template WA ---------------- */
function TabTemplate() {
  const { templates, setTemplates, toast } = useApp();
  const [kode, setKode] = useState(templates[0]?.kode);
  const cur = templates.find((t) => t.kode === kode) || templates[0];
  const [text, setText] = useState(cur?.isi || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => { setText(cur?.isi || ''); }, [cur?.kode]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    setBusy(true);
    try {
      const row = await saveTemplate(cur.kode, text);
      setTemplates(templates.map((t) => (t.kode === row.kode ? row : t)));
      toast('Template "' + cur.judul + '" disimpan');
    } catch (e) { toast('Gagal menyimpan: ' + e.message); }
    finally { setBusy(false); }
  };

  if (!cur) return null;
  return (
    <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="chips" role="group" aria-label="Pilih template" style={{ flexWrap: 'wrap' }}>
        {templates.map((t) => (
          <button key={t.kode} type="button" className={'chip' + (t.kode === cur.kode ? ' on' : '')} onClick={() => setKode(t.kode)}>{t.judul}</button>
        ))}
      </div>
      <div className="panel">
        <label className="ml" htmlFor="isi">{cur.judul}</label>
        <textarea className="mf" id="isi" rows={14} value={text} onChange={(e) => setText(e.target.value)} style={{ resize: 'vertical', lineHeight: 1.5, fontSize: 15 }} />
        <p style={{ margin: '10px 0 0', fontSize: 12, color: '#5F6964', lineHeight: 1.7 }}>
          Kode otomatis: {'{nama} {tanggal} {jam} {lokasi} {paket} {harga} {dp} {sisa} {link}'}
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: 10 }}>
        <button className="btn-s" type="button" onClick={() => setText(DEFAULT_TEMPLATES[cur.kode] || cur.isi)}>Reset</button>
        <button className="btn-p" type="button" onClick={save} disabled={busy || text === cur.isi}>{busy ? 'Menyimpan…' : 'Simpan Template'}</button>
      </div>
    </div>
  );
}
