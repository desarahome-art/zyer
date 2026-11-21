import { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import Sheet from '../components/Sheet';
import { useApp } from '../AppContext';
import {
  deleteAddon, deleteJenis, deleteLokasi, deletePaket, insertAddon, insertJenis, insertLokasi, insertPaket, saveTemplate, updateAddon, updatePaket,
} from '../lib/api';
import { DEFAULT_TEMPLATES } from '../lib/defaults';
import { num, ribuan, rp } from '../lib/format';

const TABS = [['paket', 'Paket'], ['addon', 'Add-on'], ['lokasi', 'Lokasi'], ['wa', 'Template WA']];

export default function Pengaturan() {
  const [tab, setTab] = useState('paket');
  const { settingsError } = useApp();
  return (
    <>
      <div className="ph"><div><div className="eyebrow">Data dasar untuk form Tambah Client</div><h1>Pengaturan</h1></div></div>
      <div className="seg" role="group" aria-label="Bagian pengaturan" style={{ maxWidth: 620, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        {TABS.map(([id, label]) => (
          <button key={id} type="button" className={tab === id ? 'on' : undefined} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      {settingsError ? <p className="alert">Gagal memuat pengaturan: {settingsError}</p> : null}
      {tab === 'paket' ? <TabPaket /> : null}
      {tab === 'addon' ? <TabAddon /> : null}
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

/* ---------------- Add-on ---------------- */
const EMPTY_ADDON = { nama: '', harga: '', ket: '', per: false, satuan: '' };
function TabAddon() {
  const { addon, reloadSettings, toast } = useApp();
  const [sheet, setSheet] = useState(null); // { item? }
  const [af, setAf] = useState(EMPTY_ADDON);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const open = (item) => {
    setSheet({ item });
    setAf(item ? { nama: item.nama, harga: ribuan(item.harga), ket: item.keterangan || '', per: !!item.per_jumlah, satuan: item.satuan || '' } : EMPTY_ADDON);
    setErr('');
  };
  const run = async (fn, msg) => {
    setBusy(true);
    try { await fn(); await reloadSettings(); setSheet(null); toast(msg); }
    catch (e) { setErr(e.message.includes('duplicate') ? 'Nama add-on sudah dipakai.' : e.message); }
    finally { setBusy(false); }
  };
  const save = () => {
    if (!af.nama.trim() || !num(af.harga)) { setErr('Nama dan harga add-on wajib diisi.'); return; }
    const row = { nama: af.nama.trim(), harga: num(af.harga), keterangan: af.ket.trim(), per_jumlah: af.per, satuan: af.per ? af.satuan.trim() : '' };
    if (sheet.item) run(() => updateAddon(sheet.item.id, row), 'Add-on diperbarui');
    else run(() => insertAddon({ ...row, urutan: addon.length + 1 }), 'Add-on ditambahkan');
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <p style={{ margin: 0, fontSize: 14, color: '#5F6964', lineHeight: 1.45 }}>Layanan tambahan yang bisa dipilih untuk semua jenis sesi.</p>
        <button className="chip" type="button" onClick={() => open(null)}>+ Add-on</button>
      </div>
      <div className="grid-cards">
        {addon.map((a) => (
          <button key={a.id} className="prow" type="button" onClick={() => open(a)} style={{ background: '#FFFFFF', border: '1px solid #E3E6E2', marginBottom: 0 }}>
            <span className="jbadge" aria-hidden="true"><Icon name="plus" size={18} stroke={2.6} /></span>
            <span style={{ flex: 1, minWidth: 0 }}><strong style={{ display: 'block', fontSize: 15 }}>{a.nama}</strong>
              <span style={{ fontSize: 12, color: '#5F6964' }}>{a.keterangan || (a.per_jumlah ? 'Dihitung per ' + (a.satuan || 'item') : 'Harga tetap')}</span></span>
            <strong style={{ fontSize: 15, color: '#1F4A36', whiteSpace: 'nowrap' }}>{rp(a.harga)}{a.per_jumlah ? <span style={{ fontSize: 12, fontWeight: 600 }}> /{a.satuan || 'item'}</span> : null}</strong>
            <Icon name="edit" size={16} style={{ color: '#5F6964' }} />
          </button>
        ))}
        {addon.length === 0 ? <p className="empty">Belum ada add-on. Contoh: Tambah outfit, Tambah orang, Cetak foto.</p> : null}
      </div>

      {sheet ? (
        <Sheet open onClose={() => setSheet(null)} maxWidth={520} title={sheet.item ? 'Edit Add-on' : 'Tambah Add-on'} sub="Berlaku untuk semua jenis sesi"
          footer={(<>
            <button className="btn-s" type="button" onClick={() => setSheet(null)}>Batal</button>
            <button className="btn-p" type="button" onClick={save} disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
          </>)}>
          <div><label className="ml" htmlFor="a-nm">Nama add-on</label>
            <input className="mf" id="a-nm" value={af.nama} onChange={(e) => { setAf({ ...af, nama: e.target.value }); setErr(''); }} placeholder="Contoh: Tambah orang" /></div>
          <div><label className="ml" htmlFor="a-hg">Harga</label><div className="rp"><span aria-hidden="true">Rp</span>
            <input className="mf" id="a-hg" inputMode="numeric" value={af.harga} onChange={(e) => { setAf({ ...af, harga: ribuan(num(e.target.value)) }); setErr(''); }} placeholder="0" /></div></div>
          <div><label className="ml" htmlFor="a-kt">Keterangan <span style={{ fontWeight: 500, color: '#5F6964' }}>(opsional)</span></label>
            <input className="mf" id="a-kt" value={af.ket} onChange={(e) => setAf({ ...af, ket: e.target.value })} placeholder="Contoh: maks. 3 orang tambahan" /></div>
          <button type="button" role="switch" aria-checked={af.per} className={'pk' + (af.per ? ' on' : '')} onClick={() => setAf({ ...af, per: !af.per })} style={{ marginBottom: 0 }}>
            <span className="cbx" aria-hidden="true">{af.per ? <Icon name="check" size={14} stroke={3.4} /> : null}</span>
            <span style={{ flex: 1 }}><strong style={{ display: 'block', fontSize: 15 }}>Dihitung per jumlah</strong>
              <span style={{ fontSize: 12, color: '#5F6964' }}>Admin bisa isi jumlahnya, mis. 2 orang = 2 × harga</span></span>
          </button>
          {af.per ? (
            <div><label className="ml" htmlFor="a-st">Satuan</label>
              <input className="mf" id="a-st" value={af.satuan} onChange={(e) => setAf({ ...af, satuan: e.target.value })} placeholder="Contoh: orang, outfit, lembar" /></div>
          ) : null}
          {sheet.item ? (
            <button className="menu-b red" type="button" disabled={busy} onClick={() => run(() => deleteAddon(sheet.item.id), 'Add-on dihapus')}><Icon name="trash" />Hapus add-on ini</button>
          ) : null}
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
          Kode otomatis: {'{nama} {tanggal} {jam} {lokasi} {paket} {rincian} {harga} {dp} {sisa} {link}'}
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: 10 }}>
        <button className="btn-s" type="button" onClick={() => setText(DEFAULT_TEMPLATES[cur.kode] || cur.isi)}>Reset</button>
        <button className="btn-p" type="button" onClick={save} disabled={busy || text === cur.isi}>{busy ? 'Menyimpan…' : 'Simpan Template'}</button>
      </div>
    </div>
  );
}
