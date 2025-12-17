import { useState, FormEvent } from 'react';

const COLORS = ['#0079bf', '#d29034', '#519839', '#b04632', '#89609e', '#cd5a91', '#4bbf6b', '#00aecc', '#838c91'];

type CreateBoardModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { title: string; background: string }) => void;
};

export default function CreateBoardModal({ isOpen, onClose, onSubmit }: CreateBoardModalProps) {
  const [title, setTitle] = useState('');
  const [background, setBackground] = useState(COLORS[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title, background });
    setTitle('');
    setBackground(COLORS[0]);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
          <div className="h-28 rounded-t-lg p-4 flex items-center justify-center" style={{ backgroundColor: background }}>
            <div className="bg-white/20 rounded px-4 py-2">
              <span className="text-white font-medium">{title || 'Titre du tableau'}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-trello-navy mb-1">
                Titre du tableau <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Entrez le titre..."
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-trello-blue focus:border-trello-blue outline-none transition-all text-sm"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-trello-navy mb-2">Couleur de fond</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setBackground(color)}
                    className={`w-10 h-8 rounded transition-all ${background === color ? 'ring-2 ring-trello-navy ring-offset-2' : 'hover:opacity-80'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!title.trim()}
                className="flex-1 bg-trello-blue hover:bg-trello-blue-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded font-medium text-sm transition-colors"
              >
                Créer
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-trello-gray hover:text-trello-navy hover:bg-gray-100 rounded font-medium text-sm transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

