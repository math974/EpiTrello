import { useState } from 'react';
import { CommentModel } from '../../generated/graphql';
import { addComment, deleteComment } from '@/lib/commentsClient';
import { FiMessageSquare, FiTrash2 } from 'react-icons/fi';

type CommentsSectionProps = {
  cardId: string;
  boardId: string;
  comments: CommentModel[];
  onCommentsChange?: () => void;
};

function AuthorAvatar({ comment }: { comment: CommentModel }) {
  const author = comment.author;
  const name = author?.username || author?.email || '?';
  const initial = name.charAt(0).toUpperCase();
  const avatarUrl = author?.avatar ?? null;

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0 bg-trello-blue overflow-hidden"
      title={name}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        initial
      )}
    </div>
  );
}

export default function CommentsSection({
  cardId,
  boardId,
  comments,
  onCommentsChange,
}: CommentsSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newComment.trim();
    if (!content || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment(cardId, content, boardId);
      setNewComment('');
      onCommentsChange?.();
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (deletingId) return;
    setDeletingId(commentId);
    try {
      await deleteComment(commentId, boardId);
      onCommentsChange?.();
    } catch (err) {
      console.error('Failed to delete comment:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <FiMessageSquare size={16} />
        Commentaires {comments.length > 0 && `(${comments.length})`}
      </h3>

      {/* Add comment */}
      <form onSubmit={handleSubmit} className="mb-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Écrire un commentaire..."
          rows={2}
          disabled={isSubmitting}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || isSubmitting}
          className="mt-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Envoi...' : 'Envoyer'}
        </button>
      </form>

      {/* List of comments */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun commentaire.</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-3 p-2 rounded-md hover:bg-gray-50 group"
            >
              <AuthorAvatar comment={comment} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900">
                    {comment.author?.username || comment.author?.email || 'Utilisateur'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {comment.createdAt
                      ? new Date(comment.createdAt).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })
                      : ''}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
                <button
                  type="button"
                  onClick={() => handleDelete(comment.id)}
                  disabled={deletingId === comment.id}
                  className="mt-1 text-xs text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  aria-label="Supprimer le commentaire"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
