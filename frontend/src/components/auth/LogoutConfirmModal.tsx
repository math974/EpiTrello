import { Button } from '@/components/shadcn/ui/button';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function LogoutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: LogoutConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-semibold text-trello-navy mb-2">
            Se déconnecter
          </h2>
          <p className="text-sm text-trello-gray mb-6">
            Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à votre compte.
          </p>
          
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="border-gray-300 text-trello-gray hover:bg-gray-50"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? 'Déconnexion...' : 'Se déconnecter'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

