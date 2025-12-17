type BoardOwner = {
  id?: string;
  username?: string;
  avatar?: string | null;
};

type Board = {
  id: string;
  title: string;
  description?: string | null;
  background: string;
  owner?: BoardOwner;
};

type BoardCardProps = {
  board: Board;
  onClick?: () => void;
};

export default function BoardCard({ board, onClick }: BoardCardProps) {
  return (
    <div
      onClick={onClick}
      className="group relative h-24 rounded-lg cursor-pointer overflow-hidden shadow-sm hover:shadow-md transition-all"
      style={{ backgroundColor: board.background }}
    >
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      <div className="relative p-3 h-full flex flex-col">
        <h3 className="font-bold text-white text-sm drop-shadow-sm">{board.title}</h3>
        {board.description && (
          <p className="text-white/80 text-xs mt-1 line-clamp-2">{board.description}</p>
        )}
      </div>
      <button className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg className="w-4 h-4 text-white/80 hover:text-yellow-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      </button>
    </div>
  );
}

