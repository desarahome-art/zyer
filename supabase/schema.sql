-- =========================================================
-- ZYER · Rekap Client Foto Outdoor
-- Jalankan seluruh file ini di Supabase: SQL Editor → New query → Run
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------- Jenis sesi ----------
create table if not exists public.jenis_sesi (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  urutan int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- Paket per jenis sesi ----------
create table if not exists public.paket (
  id uuid primary key default gen_random_uuid(),
  jenis_id uuid not null references public.jenis_sesi(id) on delete cascade,
  nama text not null,
  keterangan text not null default '',
  harga bigint not null default 0 check (harga >= 0),
  urutan int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists paket_jenis_idx on public.paket(jenis_id);

-- ---------- Lokasi outdoor ----------
create table if not exists public.lokasi (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  urutan int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- Template pesan WhatsApp ----------
create table if not exists public.template_wa (
  kode text primary key,
  judul text not null,
  isi text not null,
  urutan int not null default 0,
  updated_at timestamptz not null default now()
);

-- ---------- Client ----------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  wa text not null,
  kampus text not null default '',
  jenis text not null default '',
  paket text not null default '',
  tanggal date not null,
  jam time,
  jumlah_orang int,
  lokasi text not null default '',
  catatan text not null default '',
  harga bigint not null default 0 check (harga >= 0),
  dp bigint not null default 0 check (dp >= 0),
  pelunasan bigint not null default 0 check (pelunasan >= 0),
  metode text not null default 'Transfer',
  selesai boolean not null default false,
  link_hasil text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists clients_tanggal_idx on public.clients(tanggal);

-- =========================================================
-- Akses data
-- Website ini TANPA login, jadi akses diberikan ke peran "anon".
-- Artinya siapa pun yang tahu alamat website + anon key bisa membaca/mengubah data.
-- Lihat README bagian "Keamanan" untuk cara memperketat nanti.
-- =========================================================
alter table public.jenis_sesi enable row level security;
alter table public.paket enable row level security;
alter table public.lokasi enable row level security;
alter table public.template_wa enable row level security;
alter table public.clients enable row level security;

do $$
declare t text;
begin
  foreach t in array array['jenis_sesi','paket','lokasi','template_wa','clients'] loop
    execute format('drop policy if exists "akses_admin_%1$s" on public.%1$I', t);
    execute format('create policy "akses_admin_%1$s" on public.%1$I for all to anon, authenticated using (true) with check (true)', t);
  end loop;
end $$;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;

-- =========================================================
-- Data awal (contoh — silakan ubah lewat menu Pengaturan)
-- =========================================================
insert into public.jenis_sesi (nama, urutan) values
  ('Wisuda', 1), ('Prewedding', 2), ('Couple', 3), ('Family', 4), ('Personal', 5)
on conflict (nama) do nothing;

insert into public.paket (jenis_id, nama, keterangan, harga, urutan)
select j.id, p.nama, p.ket, p.harga, p.urutan
from (values
  ('Wisuda', 'Paket A', '1 jam · 1 lokasi · 15 foto edit', 350000, 1),
  ('Wisuda', 'Paket B', '2 jam · grup s/d 5 orang · 30 foto edit', 600000, 2),
  ('Prewedding', 'Paket A', '3 jam · 2 outfit', 1500000, 1),
  ('Prewedding', 'Paket B', '5 jam · 2 lokasi · 3 outfit', 2500000, 2),
  ('Couple', 'Paket A', '2 jam · 1 lokasi', 800000, 1),
  ('Family', 'Paket A', '2 jam · maks. 8 orang', 1200000, 1),
  ('Personal', 'Paket A', '1 jam · 1 outfit', 500000, 1)
) as p(jenis, nama, ket, harga, urutan)
join public.jenis_sesi j on j.nama = p.jenis
where not exists (select 1 from public.paket x where x.jenis_id = j.id and x.nama = p.nama);

insert into public.lokasi (nama, urutan) values
  ('Taman Alun Kapuas', 1), ('Tugu Khatulistiwa', 2), ('Rumah Radakng', 3),
  ('Waterfront Kapuas', 4), ('Taman Digulis', 5), ('Kampus UNTAN', 6)
on conflict (nama) do nothing;

insert into public.template_wa (kode, judul, isi, urutan) values
('konfirmasi', 'Konfirmasi Booking', E'Halo kak {nama} 👋\n\nTerima kasih sudah booking sesi foto di ZYER. Berikut detail jadwalnya:\n\n📅 Tanggal : {tanggal}\n⏰ Jam : {jam}\n📍 Lokasi : {lokasi}\n📦 Paket : {paket}\n\n💰 Harga : {harga}\n✅ DP diterima : {dp}\n🧾 Sisa pembayaran : {sisa}\n\nSisa pembayaran bisa dilunasi di hari sesi foto ya kak. Kalau ada pertanyaan, langsung chat di sini aja 😊\n\n– ZYER', 1),
('pengingat', 'Pengingat H-1', E'Halo kak {nama} 😊\n\nMengingatkan, besok kita ada jadwal sesi foto:\n\n📅 {tanggal}\n⏰ {jam}\n📍 {lokasi}\n\nMohon datang 15 menit sebelum jadwal ya kak, supaya bisa persiapan dan dapat cahaya terbaik. Jangan lupa siapkan outfit dan properti yang sudah direncanakan.\n\nSampai ketemu besok! 📸\n– ZYER', 2),
('hasil', 'Pengiriman Hasil Foto', E'Halo kak {nama} 🙌\n\nHasil foto sesi {paket} sudah selesai dan bisa diunduh di link berikut:\n\n🔗 {link}\n\nLink aktif selama 30 hari, jadi segera diunduh ya kak. Terima kasih sudah percaya sama ZYER. Kalau berkenan, tag kami di Instagram @zyer.memoto saat upload ya ✨\n\n– ZYER', 3),
('pelunasan', 'Pengingat Pelunasan', E'Halo kak {nama} 😊\n\nMau mengingatkan untuk sisa pembayaran sesi foto tanggal {tanggal}:\n\n🧾 Sisa pembayaran : {sisa}\n\nPembayaran bisa melalui transfer, QRIS, atau cash. Setelah transfer, mohon kirim bukti pembayarannya di chat ini ya kak.\n\nTerima kasih 🙏\n– ZYER', 4),
('terimakasih', 'Ucapan Terima Kasih', E'Halo kak {nama} 🤍\n\nTerima kasih sudah foto bareng ZYER! Semoga kakak suka dengan hasilnya.\n\nKami senang sekali kalau kakak mau kasih ulasan singkat atau merekomendasikan ZYER ke teman-teman. Sampai ketemu di sesi foto berikutnya ya 📸\n\n– ZYER', 5)
on conflict (kode) do nothing;
