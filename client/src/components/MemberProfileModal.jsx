import { useQuery } from '../lib/context';
import { getMember } from '../lib/data';
import { ErrorBox, MemberProfileCard, Modal, Spinner } from './ui';

/**
 * Kartu profil popup: memuat satu pengurus lengkap dengan foto, nama,
 * jabatan, kelas, Instagram, dan motto. Data diambil ulang dari server agar
 * selalu sama dengan isi form Edit Pengurus.
 */
export default function MemberProfileModal({ memberId, onClose }) {
  const open = Boolean(memberId);
  const { data: member, loading, error } = useQuery(
    () => (memberId ? getMember(memberId) : Promise.resolve(null)),
    [memberId],
  );

  return (
    <Modal open={open} onClose={onClose} title={member?.name || 'Profil Pengurus'}>
      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      {member && <MemberProfileCard member={member} />}
    </Modal>
  );
}