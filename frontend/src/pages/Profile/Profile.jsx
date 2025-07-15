import React, { useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import Button from '@/components/Button/Button';

const Profile = () => {
  const [showPw, setShowPw] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const fileInputRef = useRef(null);
  const {
    user,
    displayName,
    emailUser,
    avatarUrl,
    handleAvatarUpload,
    avatarLoading,
    showPasswordForm,
    setShowPasswordForm,
    passwordData,
    setPasswordData,
    isLoading,
    error,
    success,
    handlePasswordChange,
    handleSignOut,
    resetPasswordForm,
  } = useProfile();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        </div>

        {/* Error and success messages */}
        {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>
        )}

        {/* Avatar */}
        <div className="flex flex-col items-center rounded-lg bg-white shadow-lg">
          <div className="h-24 w-full rounded-t-lg bg-gray-300" />
          <div className="-mt-12 flex flex-col items-center pb-6">
            <img
              src={avatarUrl}
              alt="Profile picture"
              className="h-32 w-32 rounded-full object-cover shadow-lg ring-4 ring-white"
            />
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleAvatarUpload(e.target.files[0]);
                }
              }}
            />
            <Button
              type="button"
              disabled={avatarLoading}
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              aria-label="Change profile picture"
            >
              {avatarLoading ? 'Uploading…' : 'Change Picture'}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* User account information */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-semibold text-indigo-600">Account Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Name</label>
                <p className="mt-1 rounded-md bg-gray-50 px-3 py-2 text-gray-900">{displayName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Email</label>
                <p className="mt-1 rounded-md bg-gray-50 px-3 py-2 text-gray-900">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Password change for email users */}
          {emailUser && (
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Change Password</h2>
              {!showPasswordForm ? (
                <Button
                  onClick={() => setShowPasswordForm(true)}
                  variant="primary"
                  aria-label="Open password change form"
                >
                  Change Password
                </Button>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, newPassword: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:border-blue-500 focus:outline-none"
                        placeholder="Enter new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
                      >
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPwConfirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:border-blue-500 focus:outline-none"
                        placeholder="Confirm new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwConfirm(!showPwConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
                      >
                        {showPwConfirm ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Password must be at least 8 characters and include uppercase, lowercase, number,
                    and special character.
                  </p>
                  <div className="flex space-x-3">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      variant="primary"
                      aria-label="Update password"
                    >
                      {isLoading ? 'Updating...' : 'Update Password'}
                    </Button>
                    <Button
                      type="button"
                      onClick={resetPasswordForm}
                      variant="outline"
                      aria-label="Cancel password change"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Sign out */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Sign Out</h2>
            <Button onClick={handleSignOut} variant="danger" aria-label="Sign out of application">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
