import { useState, useEffect } from 'react';
import { X, Users, Trash2 } from 'lucide-react';
import { getProjectCollaborators, removeCollaborator } from '@/services/projectService';
import LoadingSpinner from '@/components/Loading/LoadingSpinner';
import { showErrorToast, showSuccessToast } from '@/utils/toastUtils';
import { MESSAGES } from '@/constants/messages';

const ROLE_COLORS = {
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  editor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

export default function TeamPanel({ isOpen, onClose, projectId, currentUserId, isAdmin }) {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    fetchCollaborators();
  }, [isOpen, projectId]);

  const fetchCollaborators = async () => {
    setLoading(true);
    const result = await getProjectCollaborators(projectId);
    if (result.success) {
      setCollaborators(result.collaborators);
    } else {
      showErrorToast(MESSAGES.ERROR.COLLABORATORS_LOAD_FAILED);
    }
    setLoading(false);
  };

  const handleRemove = async (userId) => {
    if (!confirm('Remove this team member from the project?')) return;
    const result = await removeCollaborator(projectId, userId);
    if (result.success) {
      showSuccessToast(MESSAGES.SUCCESS.COLLABORATOR_REMOVED);
      setCollaborators((prev) => prev.filter((c) => c.user_id !== userId));
    } else {
      showErrorToast(result.error || MESSAGES.ERROR.PERMISSION_DENIED);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Team Members</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : collaborators.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              No team members yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {collaborators.map((c) => (
                <li
                  key={c.user_id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-700"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {c.full_name || c.email}
                      {c.user_id === currentUserId && (
                        <span className="ml-2 text-xs text-gray-400">(you)</span>
                      )}
                    </p>
                    {c.full_name && (
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">{c.email}</p>
                    )}
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[c.role] || ROLE_COLORS.viewer}`}
                    >
                      {c.role}
                    </span>
                  </div>
                  {isAdmin && c.user_id !== currentUserId && (
                    <button
                      onClick={() => handleRemove(c.user_id)}
                      className="ml-3 flex-shrink-0 text-red-400 hover:text-red-600 dark:hover:text-red-300"
                      title="Remove member"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
