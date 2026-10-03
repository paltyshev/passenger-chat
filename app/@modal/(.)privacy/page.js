import LegalModal from '@/components/LegalModal';
import PrivacyDoc from '@/components/legal/PrivacyDoc';

export default function PrivacyModal() {
  return (
    <LegalModal>
      <PrivacyDoc embedded />
    </LegalModal>
  );
}
