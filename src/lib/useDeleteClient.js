import { useCallback } from 'react';
import { deleteClient, insertClient } from './api';
import { useApp } from '../AppContext';

/** Hapus client dengan tombol "Urungkan" di notifikasi. */
export default function useDeleteClient() {
  const { toast, bump } = useApp();
  return useCallback(async (c, after) => {
    try {
      await deleteClient(c.id);
      bump();
      after?.();
      toast(c.nama + ' dihapus', {
        label: 'Urungkan',
        run: async () => {
          try { await insertClient(c); bump(); toast(c.nama + ' dikembalikan'); }
          catch (e) { toast('Gagal mengembalikan: ' + e.message); }
        },
      });
    } catch (e) {
      toast('Gagal menghapus: ' + e.message);
    }
  }, [toast, bump]);
}
