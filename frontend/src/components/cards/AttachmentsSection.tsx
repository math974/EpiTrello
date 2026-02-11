import { useState, useRef } from 'react';
import { FiPaperclip, FiDownload, FiTrash2, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import {
  uploadAttachment,
  deleteAttachment,
  updateAttachmentFileName,
  getAttachmentDownloadUrl,
} from '@/lib/attachmentsClient';
import type { AttachmentModel } from '../../generated/graphql';

type AttachmentsSectionProps = {
  cardId: string;
  boardId: string;
  attachments: AttachmentModel[];
  onUpdate: () => void;
};

const MAX_FILE_SIZE_MB = 50;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 0) {
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, { dateStyle: 'short' });
}

export default function AttachmentsSection({
  cardId,
  boardId,
  attachments,
  onUpdate,
}: AttachmentsSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setUploadError(`File must be under ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    setUploadError(null);
    setUploading(true);
    try {
      await uploadAttachment(cardId, file, boardId);
      onUpdate();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    setDeletingId(attachmentId);
    try {
      await deleteAttachment(attachmentId, boardId);
      onUpdate();
    } catch (err) {
      console.error('Delete attachment failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const startRename = (att: AttachmentModel) => {
    setRenamingId(att.id);
    setRenameValue(att.fileName);
  };

  const cancelRename = () => {
    setRenamingId(null);
  };

  const saveRename = async () => {
    if (!renamingId || !renameValue.trim()) {
      setRenamingId(null);
      return;
    }
    try {
      await updateAttachmentFileName(renamingId, renameValue.trim(), boardId);
      onUpdate();
    } catch (err) {
      console.error('Rename failed:', err);
    }
    setRenamingId(null);
  };

  const handleDownload = async (attachmentId: string) => {
    try {
      const url = await getAttachmentDownloadUrl(attachmentId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
        <FiPaperclip size={16} />
        Attachments
      </h3>

      {uploadError && (
        <div className="mb-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
          {uploadError}
        </div>
      )}

      <div className="mb-3">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          disabled={uploading}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Add attachment'}
        </button>
        <span className="ml-2 text-xs text-gray-500">Max {MAX_FILE_SIZE_MB}MB</span>
      </div>

      <ul className="space-y-2">
        {(attachments || []).map((att) => (
          <li
            key={att.id}
            className="flex items-center gap-2 py-2 px-3 rounded-md border border-gray-200 bg-gray-50/50 hover:bg-gray-50 group"
          >
            {renamingId === att.id ? (
              <div className="flex-1 flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveRename();
                    if (e.key === 'Escape') cancelRename();
                  }}
                  className="flex-1 min-w-[120px] px-2 py-1 text-sm border border-gray-300 rounded"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={saveRename}
                  disabled={!renameValue.trim()}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                  aria-label="Save"
                >
                  <FiCheck size={16} />
                </button>
                <button type="button" onClick={cancelRename} className="p-1 text-gray-500 hover:bg-gray-200 rounded" aria-label="Cancel">
                  <FiX size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate" title={att.fileName}>
                    {att.fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatSize(att.size)} · {formatDate(att.createdAt)}
                    {att.uploader && ` · ${att.uploader.username || att.uploader.email}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleDownload(att.id)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Download"
                  >
                    <FiDownload size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => startRename(att)}
                    className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded"
                    title="Rename"
                  >
                    <FiEdit2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(att.id)}
                    disabled={deletingId === att.id}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                    title="Delete"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      {(attachments?.length ?? 0) === 0 && !uploading && (
        <p className="text-sm text-gray-500 py-2">No attachments yet.</p>
      )}
    </div>
  );
}
