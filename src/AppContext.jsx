import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { listJenisWithPaket, listLokasi, listTemplates } from './lib/api';
import { DEFAULT_TEMPLATES } from './lib/defaults';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const FALLBACK_TEMPLATES = [
  ['konfirmasi', 'Konfirmasi Booking'], ['pengingat', 'Pengingat H-1'], ['hasil', 'Pengiriman Hasil Foto'],
  ['pelunasan', 'Pengingat Pelunasan'], ['terimakasih', 'Ucapan Terima Kasih'],
].map(([kode, judul], i) => ({ kode, judul, isi: DEFAULT_TEMPLATES[kode], urutan: i + 1 }));

export function AppProvider({ children }) {
  const [jenis, setJenis] = useState([]);
  const [lokasi, setLokasi] = useState([]);
  const [templates, setTemplates] = useState(FALLBACK_TEMPLATES);
  const [settingsError, setSettingsError] = useState('');

  // pop up global
  const [form, setForm] = useState(null); // { client?: row, presetDate?: 'YYYY-MM-DD' }
  const [waClient, setWaClient] = useState(null);

  // dinaikkan setiap ada perubahan data client, supaya halaman memuat ulang
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const [toasts, setToasts] = useState([]);
  const tid = useRef(0);
  const toast = useCallback((msg, action) => {
    const id = ++tid.current;
    setToasts((t) => [...t, { id, msg, action }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), action ? 6000 : 3000);
  }, []);
  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const reloadSettings = useCallback(async () => {
    try {
      const [j, l, t] = await Promise.all([listJenisWithPaket(), listLokasi(), listTemplates()]);
      setJenis(j); setLokasi(l); if (t.length) setTemplates(t);
      setSettingsError('');
    } catch (e) {
      setSettingsError(e.message);
    }
  }, []);

  useEffect(() => { reloadSettings(); }, [reloadSettings]);

  const value = {
    jenis, lokasi, templates, settingsError, reloadSettings, setJenis, setLokasi, setTemplates,
    form, openForm: (opts = {}) => setForm(opts), closeForm: () => setForm(null),
    waClient, openWa: (c) => setWaClient(c), closeWa: () => setWaClient(null),
    version, bump, toast, toasts, dismissToast,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
