import LegalModal from '@/components/LegalModal';
import ConsentDoc from '@/components/legal/ConsentDoc';

export default function ConsentModal() {
  return (
    <LegalModal>
      <ConsentDoc embedded />
    </LegalModal>
  );
}
