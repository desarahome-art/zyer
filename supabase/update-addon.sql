-- =========================================================
-- ZYER · Update fitur PAKET GANDA + ADD-ON + DISKON
-- Jalankan SEKALI di Supabase: SQL Editor → New query → tempel → Run
-- Aman dijalankan ulang. Data client lama tidak berubah.
-- =========================================================

-- 1) Tabel add-on (berlaku untuk semua jenis sesi)
create table if not exists public.addon (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  keterangan text not null default '',
  harga bigint not null default 0 check (harga >= 0),
  per_jumlah boolean not null default false,
  satuan text not null default '',
  urutan int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.addon enable row level security;
drop policy if exists "akses_admin_addon" on public.addon;
create policy "akses_admin_addon" on public.addon for all to anon, authenticated using (true) with check (true);
grant select, insert, update, delete on public.addon to anon, authenticated;

-- 2) Kolom baru di client: rincian item & diskon
alter table public.clients add column if not exists items jsonb not null default '[]'::jsonb;
alter table public.clients add column if not exists diskon bigint not null default 0;
do $$ begin
  alter table public.clients add constraint clients_diskon_check check (diskon >= 0);
exception when duplicate_object then null; end $$;

-- 3) Template Konfirmasi Booking memakai {rincian}
--    (hanya diganti kalau isinya masih teks bawaan, jadi editan admin tidak tertimpa)
update public.template_wa
set isi = E'Halo kak {nama} 👋\n\nTerima kasih sudah booking sesi foto di ZYER. Berikut detail jadwalnya:\n\n📅 Tanggal : {tanggal}\n⏰ Jam : {jam}\n📍 Lokasi : {lokasi}\n\n📦 Rincian :\n{rincian}\n\n💰 Total : {harga}\n✅ DP diterima : {dp}\n🧾 Sisa pembayaran : {sisa}\n\nSisa pembayaran bisa dilunasi di hari sesi foto ya kak. Kalau ada pertanyaan, langsung chat di sini aja 😊\n\n– ZYER', updated_at = now()
where kode = 'konfirmasi' and isi = E'Halo kak {nama} 👋\n\nTerima kasih sudah booking sesi foto di ZYER. Berikut detail jadwalnya:\n\n📅 Tanggal : {tanggal}\n⏰ Jam : {jam}\n📍 Lokasi : {lokasi}\n📦 Paket : {paket}\n\n💰 Harga : {harga}\n✅ DP diterima : {dp}\n🧾 Sisa pembayaran : {sisa}\n\nSisa pembayaran bisa dilunasi di hari sesi foto ya kak. Kalau ada pertanyaan, langsung chat di sini aja 😊\n\n– ZYER';
