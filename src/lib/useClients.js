import { useCallback, useEffect, useState } from 'react';
import { listClients, updateClient } from './api';
import { useApp } from '../AppContext';

/** Memuat semua client dan menyediakan aksi umum. */
export default function useClients() {
  const { version, bump, toast } = useApp();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    listClients()
      .then((rows) => { if (alive) { setData(rows); setError(''); } })
      .catch((e) => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, [version]);

  const toggleSelesai = useCallback(async (c) => {
    const next = !c.selesai;
    setData((d) => d && d.map((x) => (x.id === c.id ? { ...x, selesai: next } : x)));
    try {
      await updateClient(c.id, { selesai: next });
      toast(next ? c.nama + ' ditandai selesai' : 'Status ' + c.nama + ' dikembalikan');
    } catch (e) {
      setData((d) => d && d.map((x) => (x.id === c.id ? { ...x, selesai: c.selesai } : x)));
      toast('Gagal mengubah status: ' + e.message);
    }
  }, [toast]);

  return { data, setData, error, toggleSelesai, reload: bump };
}
