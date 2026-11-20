# ZYER · Rekap Client Foto Outdoor

Website admin untuk mencatat client foto outdoor. Bisa dipakai di laptop dan HP.
Dibuat dengan **React (Vite)** + **Supabase** (database), siap di-deploy ke **Vercel**.

---

## 1. Siapkan database di Supabase

1. Buka https://supabase.com → **New project** (pilih region **Southeast Asia (Singapore)** supaya cepat).
2. Setelah project jadi, buka **SQL Editor** → **New query**.
3. Salin seluruh isi file `supabase/schema.sql`, tempel, lalu klik **Run**.
   Ini membuat tabel `clients`, `jenis_sesi`, `paket`, `lokasi`, `template_wa` beserta data awal.
   (File ini aman dijalankan ulang; data yang sudah ada tidak dobel.)
4. Buka **Project Settings → API** (atau **Connect**), lalu catat:
   - **Project URL** → contoh `https://abcd1234.supabase.co`
   - **anon public key** (di project baru bisa bernama **Publishable key**, `sb_publishable_…` — keduanya bisa dipakai)

## 2. Coba di laptop (opsional)

Butuh Node.js 18 atau lebih baru.

```bash
npm install
cp .env.example .env.local     # lalu isi URL & anon key dari langkah 1
npm run dev                    # buka http://localhost:5173
```

## 3. Upload ke Vercel

**Cara A — lewat GitHub (disarankan):**
1. Upload folder ini ke repository GitHub baru (file `.env.local` tidak ikut, sudah diatur di `.gitignore`).
2. Di https://vercel.com → **Add New → Project** → pilih repository tadi.
   Vercel otomatis mengenali **Vite** (Build: `npm run build`, Output: `dist`).
3. Buka **Environment Variables**, tambahkan:

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | Project URL dari Supabase |
   | `VITE_SUPABASE_ANON_KEY` | anon public key |
   | `VITE_APP_PIN` | (opsional) PIN untuk membuka website, mis. `2580` |

4. Klik **Deploy**. Selesai — alamat website muncul (mis. `zyer-rekap.vercel.app`).

**Cara B — lewat Vercel CLI:**
```bash
npm i -g vercel
vercel            # ikuti pertanyaan, lalu isi Environment Variables di dashboard Vercel
vercel --prod
```

> Setiap kali mengubah Environment Variables di Vercel, lakukan **Redeploy** supaya perubahannya terpakai.

File `vercel.json` sudah diatur supaya alamat seperti `/client` atau `/kalender` tetap bisa dibuka langsung / di-refresh.

## 4. Pasang di layar utama HP (opsional)

Buka alamat website di Chrome Android → menu **⋮** → **Tambahkan ke layar utama**. Website akan terbuka seperti aplikasi.

---

## Struktur folder

```
supabase/schema.sql      → tabel + data awal + aturan akses
src/pages/               → Dashboard, DataClient, DetailClient, Kalender, Pengaturan
src/components/          → menu, form Tambah/Edit Client, pop up Chat WA, dll.
src/lib/api.js           → semua perintah ke Supabase
src/lib/format.js        → format Rupiah, tanggal, nomor WA, isi template
src/styles.css           → tampilan (otomatis menyesuaikan laptop & HP)
```

## Kode otomatis di Template WA

`{nama}` `{tanggal}` `{jam}` `{lokasi}` `{paket}` `{harga}` `{dp}` `{sisa}` `{link}`
— diganti dengan data client saat tombol **Chat WA** ditekan. `{link}` diambil dari kolom "Link hasil foto" di halaman Detail Client.

---

## Keamanan (penting dibaca)

Website ini sesuai permintaan **tanpa login**. Konsekuensinya:

- Data dibuka dengan **anon key**, yang memang ikut terkirim ke browser. Siapa pun yang tahu alamat website
  (atau anon key) secara teknis bisa membaca dan mengubah data client.
- `VITE_APP_PIN` hanya **penghalang ringan** di tampilan (PIN tersimpan di kode website), bukan pengaman sungguhan.

Saran:
1. Jangan sebarkan alamat website selain ke admin.
2. Kalau nanti ingin benar-benar aman, aktifkan **Supabase Auth** (login email admin) lalu ubah aturan akses
   di `schema.sql` dari `to anon, authenticated` menjadi `to authenticated` saja.
