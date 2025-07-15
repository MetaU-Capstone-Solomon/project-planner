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
    clearErrorOnInput,
  } = useProfile();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="mt-2 text-gray-600">Manage your account settings and preferences</p>
        </div>

        {/* Success messages */}
        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Main Profile Container */}
        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
          {/* Header Banner */}
          <div className="relative h-32 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="absolute -bottom-16 left-8">
              <div className="relative">
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
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 shadow-md"
                  aria-label="Change profile picture"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </Button>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="px-8 pb-8 pt-20">
            {/* User Info Section */}
            <div className="mb-8">
              <h2 className="mb-2 text-2xl font-bold text-gray-900">{displayName}</h2>
              <p className="text-gray-600">{user?.email}</p>
            </div>

            {/* Settings Sections */}
            <div className="space-y-8">
              {/* Account Information */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Account Information</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Display Name
                    </label>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900">
                      {displayName}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900">
                      {user?.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Change Section */}
              {emailUser && (
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Security</h3>
                  {!showPasswordForm ? (
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div>
                        <p className="font-medium text-gray-900">Password</p>
                        <p className="text-sm text-gray-600">Last changed: Recently</p>
                      </div>
                      <Button
                        onClick={() => setShowPasswordForm(true)}
                        variant="primary"
                        aria-label="Open password change form"
                      >
                        Change Password
                      </Button>
                    </div>
                  ) : (
                    <form
                      onSubmit={handlePasswordChange}
                      className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPw ? 'text' : 'password'}
                              value={passwordData.newPassword}
                              onChange={(e) => {
                                setPasswordData({ ...passwordData, newPassword: e.target.value });
                                clearErrorOnInput(); // Clear error when user starts typing
                              }}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Enter new password"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPw(!showPw)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
                            >
                              {showPw ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPwConfirm ? 'text' : 'password'}
                              value={passwordData.confirmPassword}
                              onChange={(e) => {
                                setPasswordData({
                                  ...passwordData,
                                  confirmPassword: e.target.value,
                                });
                                clearErrorOnInput(); // Clear error when user starts typing
                              }}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                      </div>
                      {/* Password requirements text - turns red when validation fails */}
                      <p
                        className={`rounded border bg-white p-3 text-xs ${
                          error && passwordData.newPassword
                            ? 'border-red-300 bg-red-50 text-red-600'
                            : 'border-gray-200 text-gray-500'
                        }`}
                      >
                        Password must be at least 8 characters and include uppercase, lowercase,
                        number, and special character.
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

              {/* Sign Out Section */}
              <div className="pt-4">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Account Actions</h3>
                <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
                  <div>
                    <p className="font-medium text-red-900">Sign Out</p>
                    <p className="text-sm text-red-700">Sign out of your account on this device</p>
                  </div>
                  <Button
                    onClick={handleSignOut}
                    variant="danger"
                    aria-label="Sign out of application"
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
