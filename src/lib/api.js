import { supabase } from './supabase';

const ok = ({ data, error }) => { if (error) throw new Error(error.message); return data; };

// ---------- Client ----------
export const listClients = async () =>
  ok(await supabase.from('clients').select('*').order('tanggal', { ascending: true }).order('jam', { ascending: true, nullsFirst: false }));

export const listClientsBetween = async (from, to) =>
  ok(await supabase.from('clients').select('*').gte('tanggal', from).lte('tanggal', to).order('tanggal').order('jam', { nullsFirst: false }));

export const getClient = async (id) => ok(await supabase.from('clients').select('*').eq('id', id).single());

export const insertClient = async (row) => ok(await supabase.from('clients').insert(row).select().single());
export const updateClient = async (id, patch) => ok(await supabase.from('clients').update(patch).eq('id', id).select().single());
export const deleteClient = async (id) => ok(await supabase.from('clients').delete().eq('id', id));

// ---------- Jenis sesi & paket ----------
export const listJenisWithPaket = async () => {
  const jenis = ok(await supabase.from('jenis_sesi').select('*').order('urutan').order('created_at'));
  const paket = ok(await supabase.from('paket').select('*').order('urutan').order('harga'));
  return jenis.map((j) => ({ ...j, paket: paket.filter((p) => p.jenis_id === j.id) }));
};
export const insertJenis = async (nama, urutan) => ok(await supabase.from('jenis_sesi').insert({ nama, urutan }).select().single());
export const deleteJenis = async (id) => ok(await supabase.from('jenis_sesi').delete().eq('id', id));
export const insertPaket = async (row) => ok(await supabase.from('paket').insert(row).select().single());
export const updatePaket = async (id, patch) => ok(await supabase.from('paket').update(patch).eq('id', id).select().single());
export const deletePaket = async (id) => ok(await supabase.from('paket').delete().eq('id', id));

// ---------- Lokasi ----------
export const listLokasi = async () => ok(await supabase.from('lokasi').select('*').order('urutan').order('created_at'));
export const insertLokasi = async (nama, urutan) => ok(await supabase.from('lokasi').insert({ nama, urutan }).select().single());
export const deleteLokasi = async (id) => ok(await supabase.from('lokasi').delete().eq('id', id));

// ---------- Template WA ----------
export const listTemplates = async () => ok(await supabase.from('template_wa').select('*').order('urutan'));
export const saveTemplate = async (kode, isi) =>
  ok(await supabase.from('template_wa').update({ isi, updated_at: new Date().toISOString() }).eq('kode', kode).select().single());
