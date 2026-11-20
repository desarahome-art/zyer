import Sheet from './Sheet';
import Icon from './Icon';

export default function ClientMenu({ client, onClose, onDetail, onEdit, onDelete }) {
  if (!client) return null;
  return (
    <Sheet open onClose={onClose} title={client.nama} sub="Pilih aksi" maxWidth={440}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {onDetail ? <button className="menu-b" type="button" onClick={onDetail}><Icon name="eye" />Lihat detail</button> : null}
        <button className="menu-b" type="button" onClick={onEdit}><Icon name="edit" />Edit data client</button>
        <button className="menu-b red" type="button" onClick={onDelete}><Icon name="trash" />Hapus client</button>
        <button className="btn-s" type="button" onClick={onClose} style={{ marginTop: 6 }}>Batal</button>
      </div>
    </Sheet>
  );
}
