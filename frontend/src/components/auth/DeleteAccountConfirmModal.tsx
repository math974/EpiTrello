import { Button } from '@/components/shadcn/ui/button';

interface DeleteAccountConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export default function DeleteAccountConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: DeleteAccountConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Delete account</h2>
          <p className="text-sm text-gray-600 mb-6">
            Deleting your account will permanently remove all your data. This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isLoading ? 'Deleting…' : 'Delete my account'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
