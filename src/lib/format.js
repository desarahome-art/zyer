const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const HARI_S = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const BLN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const BLN_S = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
export { BLN, HARI };

export const num = (v) => parseInt(String(v ?? '').replace(/\D/g, ''), 10) || 0;
export const ribuan = (n) => (n ? Number(n).toLocaleString('id-ID') : '');
export const rp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

export const sisaOf = (c) => Math.max(0, (c.harga || 0) - (c.dp || 0) - (c.pelunasan || 0));

/** 'YYYY-MM-DD' -> Date (local) */
export const toDate = (iso) => {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
/** Date -> 'YYYY-MM-DD' (local) */
export const isoOf = (d) => {
  const p = (x) => String(x).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
};
export const todayIso = () => isoOf(new Date());
export const addDays = (iso, n) => { const d = toDate(iso); d.setDate(d.getDate() + n); return isoOf(d); };

export const tglPendek = (iso) => { if (!iso) return '–'; const d = toDate(iso); return HARI_S[d.getDay()] + ', ' + d.getDate() + ' ' + BLN_S[d.getMonth()] + ' ' + d.getFullYear(); };
export const tglPanjang = (iso) => { if (!iso) return '–'; const d = toDate(iso); return HARI[d.getDay()] + ', ' + d.getDate() + ' ' + BLN[d.getMonth()] + ' ' + d.getFullYear(); };
export const jamOf = (t) => (t ? String(t).slice(0, 5).replace(':', '.') : '–');

/** nomor lokal -> format wa.me (62...) */
export const waNumber = (wa) => {
  const d = String(wa || '').replace(/\D/g, '');
  if (d.startsWith('0')) return '62' + d.slice(1);
  if (d.startsWith('8')) return '62' + d;
  return d;
};

export const fillTemplate = (isi, c) => {
  const map = {
    nama: c.nama,
    tanggal: tglPanjang(c.tanggal),
    jam: jamOf(c.jam),
    lokasi: c.lokasi || '–',
    paket: [c.jenis, c.paket].filter(Boolean).join(' – ') || '–',
    harga: rp(c.harga),
    dp: rp(c.dp),
    sisa: sisaOf(c) ? rp(sisaOf(c)) : 'Lunas',
    link: c.link_hasil || '[link Google Drive]',
  };
  return String(isi || '').replace(/\{(\w+)\}/g, (m, k) => (k in map ? map[k] : m));
};

export const waLink = (c, text) => 'https://wa.me/' + waNumber(c.wa) + '?text=' + encodeURIComponent(text);
