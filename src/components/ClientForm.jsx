import { useMemo, useState } from 'react';
import Sheet from './Sheet';
import Icon from './Icon';
import { useApp } from '../AppContext';
import { insertClient, updateClient } from '../lib/api';
import { itemsOf, itemLabel, itemTotal, num, ribuan, rp } from '../lib/format';

const LAIN = '__lain__';
const METODE = ['Transfer', 'QRIS', 'Cash'];

/**
 * Bentuk state pilihan:
 *  pakets: { [namaPaket]: true }              -> paket yang dicentang (dalam 1 jenis sesi)
 *  addons: { [namaAddon]: qty }               -> add-on yang dicentang + jumlahnya
 *  lama:   [item]                              -> item dari data lama yang tidak ada lagi di Pengaturan
 */
function initialState(client, presetDate, jenis, lokasi, addon) {
  if (client) {
    const inList = lokasi.some((l) => l.nama === client.lokasi);
    const j = jenis.find((x) => x.nama === client.jenis);
    const pakets = {}; const addons = {}; const lama = [];
    itemsOf(client).forEach((it) => {
      if (it.tipe === 'paket') {
        // data lama bisa menyimpan beberapa paket dalam 1 teks "A + B"
        const names = (client.items?.length ? [it.nama] : String(it.nama).split(' + '));
        const allKnown = j && names.every((n) => j.paket.some((p) => p.nama === n));
        if (allKnown) names.forEach((n) => { pakets[n] = true; });
        else lama.push({ ...it, on: true });
      } else if (addon.some((a) => a.nama === it.nama)) addons[it.nama] = it.qty || 1;
      else lama.push({ ...it, on: true });
    });
    return {
      nama: client.nama, wa: client.wa, kampus: client.kampus || '',
      jenis: client.jenis || '', pakets, addons, lama,
      tanggal: client.tanggal || '', jam: client.jam ? String(client.jam).slice(0, 5) : '',
      orang: client.jumlah_orang ? String(client.jumlah_orang) : '',
      lok: client.lokasi ? (inList ? client.lokasi : LAIN) : (lokasi[0]?.nama || LAIN),
      lain: inList ? '' : (client.lokasi || ''),
      catatan: client.catatan || '',
      diskon: ribuan(client.diskon), dp: ribuan(client.dp), metode: client.metode || 'Transfer',
    };
  }
  const j = jenis[0];
  return {
    nama: '', wa: '', kampus: '', jenis: j?.nama || '',
    pakets: j?.paket?.[0] ? { [j.paket[0].nama]: true } : {}, addons: {}, lama: [],
    tanggal: presetDate || '', jam: '', orang: '',
    lok: lokasi[0]?.nama || LAIN, lain: '', catatan: '',
    diskon: '', dp: '', metode: 'Transfer',
  };
}

export default function ClientForm() {
  const { form, closeForm, jenis, lokasi, addon, bump, toast } = useApp();
  const editing = form?.client || null;
  const [f, setF] = useState(() => initialState(editing, form?.presetDate, jenis, lokasi, addon));
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k, v) => { setF((s) => ({ ...s, [k]: v })); setErr(''); };
  const onText = (k) => (e) => set(k, e.target.value);
  const onMoney = (k) => (e) => set(k, ribuan(num(e.target.value)));

  const jenisAktif = useMemo(() => jenis.find((j) => j.nama === f.jenis), [jenis, f.jenis]);

  // ---- daftar item tagihan dari pilihan saat ini ----
  const items = useMemo(() => {
    const list = [];
    (jenisAktif?.paket || []).forEach((p) => { if (f.pakets[p.nama]) list.push({ tipe: 'paket', nama: p.nama, harga: p.harga, qty: 1 }); });
    f.lama.forEach((it) => { if (it.on) { const { on, ...rest } = it; list.push(rest); } });
    addon.forEach((a) => {
      const q = f.addons[a.nama];
      if (q) list.push({ tipe: 'addon', nama: a.nama, harga: a.harga, qty: a.per_jumlah ? q : 1, satuan: a.per_jumlah ? a.satuan || '' : '' });
    });
    return list;
  }, [jenisAktif, f.pakets, f.lama, f.addons, addon]);

  const subtotal = items.reduce((s, it) => s + itemTotal(it), 0);
  const diskon = Math.min(num(f.diskon), subtotal);
  const total = subtotal - diskon;
  const sisa = Math.max(0, total - num(f.dp) - (editing?.pelunasan || 0));

  const pickJenis = (j) => {
    if (j.nama === f.jenis) return;
    setF((s) => ({ ...s, jenis: j.nama, pakets: j.paket[0] ? { [j.paket[0].nama]: true } : {}, lama: s.lama.filter((it) => it.tipe !== 'paket') }));
    setErr('');
  };
  const togglePaket = (p) => setF((s) => {
    const next = { ...s.pakets };
    if (next[p.nama]) delete next[p.nama]; else next[p.nama] = true;
    return { ...s, pakets: next };
  });
  const toggleAddon = (a) => setF((s) => {
    const next = { ...s.addons };
    if (next[a.nama]) delete next[a.nama]; else next[a.nama] = 1;
    return { ...s, addons: next };
  });
  const qtyAddon = (a, d) => setF((s) => ({ ...s, addons: { ...s.addons, [a.nama]: Math.max(1, (s.addons[a.nama] || 1) + d) } }));
  const toggleLama = (i) => setF((s) => ({ ...s, lama: s.lama.map((it, k) => (k === i ? { ...it, on: !it.on } : it)) }));

  const save = async () => {
    if (!f.nama.trim() || !f.wa.trim() || !f.tanggal) { setErr('Nama, nomor WA, dan tanggal wajib diisi.'); return; }
    if (!items.some((it) => it.tipe === 'paket') && items.length === 0) { setErr('Pilih minimal satu paket atau add-on.'); return; }
    if (num(f.dp) > total) { setErr('DP tidak boleh lebih besar dari harga akhir.'); return; }
    const row = {
      nama: f.nama.trim(), wa: f.wa.trim(), kampus: f.kampus.trim(),
      jenis: f.jenis,
      paket: items.filter((it) => it.tipe === 'paket').map((it) => it.nama).join(' + '),
      items, diskon, harga: total,
      tanggal: f.tanggal, jam: f.jam || null, jumlah_orang: f.orang ? parseInt(f.orang, 10) : null,
      lokasi: f.lok === LAIN ? f.lain.trim() : f.lok,
      catatan: f.catatan.trim(), dp: num(f.dp), metode: f.metode,
    };
    setSaving(true);
    try {
      if (editing) { await updateClient(editing.id, row); toast('Data ' + row.nama + ' diperbarui'); }
      else { await insertClient(row); toast(row.nama + ' berhasil ditambahkan'); }
      bump();
      closeForm();
    } catch (e) {
      setErr(e.message.includes('items') || e.message.includes('diskon')
        ? 'Database belum diperbarui. Jalankan supabase/update-addon.sql di Supabase.'
        : 'Gagal menyimpan: ' + e.message);
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
          <div className="ml" id="m-paket">Paket {f.jenis} <span style={{ fontWeight: 500, color: '#5F6964' }}>— boleh pilih lebih dari satu</span></div>
          <div role="group" aria-labelledby="m-paket">
            {(jenisAktif?.paket || []).map((p) => {
              const on = !!f.pakets[p.nama];
              return (
                <button key={p.id} type="button" role="checkbox" aria-checked={on} className={'pk' + (on ? ' on' : '')} onClick={() => togglePaket(p)}>
                  <span className="cbx" aria-hidden="true">{on ? <Icon name="check" size={14} stroke={3.4} /> : null}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: 'block', fontSize: 15 }}>{p.nama}</strong>
                    <span style={{ fontSize: 12, color: '#5F6964' }}>{p.keterangan}</span>
                  </span>
                  <strong style={{ fontSize: 15, color: '#1F4A36', whiteSpace: 'nowrap' }}>{rp(p.harga)}</strong>
                </button>
              );
            })}
            {jenisAktif && jenisAktif.paket.length === 0 ? <p style={{ margin: 0, fontSize: 13, color: '#5F6964' }}>Belum ada paket untuk sesi ini.</p> : null}
          </div>
        </>)}

        {f.lama.length ? (
          <div style={{ marginTop: 10 }}>
            <div className="ml">Item dari data lama</div>
            {f.lama.map((it, i) => (
              <button key={i} type="button" role="checkbox" aria-checked={it.on} className={'pk' + (it.on ? ' on' : '')} onClick={() => toggleLama(i)}>
                <span className="cbx" aria-hidden="true">{it.on ? <Icon name="check" size={14} stroke={3.4} /> : null}</span>
                <span style={{ flex: 1, minWidth: 0, fontWeight: 700 }}>{itemLabel(it, it.tipe === 'paket' ? f.jenis : '')}</span>
                <strong style={{ fontSize: 15, color: '#1F4A36', whiteSpace: 'nowrap' }}>{rp(itemTotal(it))}</strong>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {addon.length ? (
        <div>
          <div className="sec">Add-on <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 600, color: '#5F6964' }}>(opsional)</span></div>
          {addon.map((a) => {
            const q = f.addons[a.nama];
            const on = !!q;
            return (
              <div key={a.id} className={'pk addon-row' + (on ? ' on' : '')}>
                <button type="button" role="checkbox" aria-checked={on} onClick={() => toggleAddon(a)} className="addon-hit">
                  <span className="cbx" aria-hidden="true">{on ? <Icon name="check" size={14} stroke={3.4} /> : null}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: 'block', fontSize: 15 }}>{a.nama}</strong>
                    <span style={{ fontSize: 12, color: '#5F6964' }}>{rp(a.harga)}{a.per_jumlah ? ' / ' + (a.satuan || 'item') : ''}{a.keterangan ? ' · ' + a.keterangan : ''}</span>
                  </span>
                </button>
                {on && a.per_jumlah ? (
                  <div className="qty" aria-label={'Jumlah ' + a.nama}>
                    <button type="button" onClick={() => qtyAddon(a, -1)} aria-label="Kurangi" disabled={q <= 1}>–</button>
                    <span>{q}</span>
                    <button type="button" onClick={() => qtyAddon(a, 1)} aria-label="Tambah">+</button>
                  </div>
                ) : (
                  <strong style={{ fontSize: 15, color: '#1F4A36', whiteSpace: 'nowrap' }}>{on ? rp(a.harga) : ''}</strong>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

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
        <div className="bill">
          {items.length === 0 ? <div className="bill-row" style={{ color: '#5F6964' }}><span>Belum ada paket dipilih</span><span>–</span></div> : null}
          {items.map((it, i) => (
            <div key={i} className="bill-row"><span>{itemLabel(it, it.tipe === 'paket' ? f.jenis : '')}</span><span>{rp(itemTotal(it))}</span></div>
          ))}
          <div className="bill-row bill-sum"><span>Total</span><span>{rp(subtotal)}</span></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, margin: '12px 0' }}>
          <div><label className="ml" htmlFor="m-disk">Diskon <span style={{ fontWeight: 500, color: '#5F6964' }}>(opsional)</span></label><div className="rp"><span aria-hidden="true">Rp</span>
            <input className="mf" id="m-disk" inputMode="numeric" value={f.diskon} onChange={onMoney('diskon')} placeholder="0" /></div></div>
          <div><label className="ml" htmlFor="m-dp">DP</label><div className="rp"><span aria-hidden="true">Rp</span>
            <input className="mf" id="m-dp" inputMode="numeric" value={f.dp} onChange={onMoney('dp')} placeholder="0" /></div></div>
        </div>
        <div className="ml" id="m-met">Metode bayar</div>
        <div className="chips" role="group" aria-labelledby="m-met" style={{ marginBottom: 12 }}>
          {METODE.map((m) => (
            <button key={m} type="button" className={'chip' + (f.metode === m ? ' on' : '')} onClick={() => set('metode', m)}>{m}</button>
          ))}
        </div>
        <div className="bill" style={{ background: '#F2F8F4', borderColor: '#D5E8DC' }}>
          {diskon ? <div className="bill-row"><span>Diskon</span><span>– {rp(diskon)}</span></div> : null}
          <div className="bill-row"><span>Harga akhir</span><strong>{rp(total)}</strong></div>
          {num(f.dp) ? <div className="bill-row"><span>DP</span><span>– {rp(num(f.dp))}</span></div> : null}
          <div className="bill-row bill-sum" style={{ color: '#1F4A36' }}><span>Sisa pembayaran</span><span style={{ fontSize: 20 }}>{sisa ? rp(sisa) : 'Lunas'}</span></div>
        </div>
      </div>

      {err ? <p role="alert" className="alert" style={{ margin: 0 }}>{err}</p> : null}
    </Sheet>
  );
}
