import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, LogOut, UploadCloud } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { Avatar } from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { pageTransition, spring } from '@/constants/motion';

function SectionHeading({ title, description }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{description}</p>}
    </div>
  );
}

function Divider() {
  return <div className="my-8 border-t border-[var(--border)]" />;
}

export default function Profile() {
  const {
    user,
    profileData,
    setProfileData,
    showPasswordForm,
    setShowPasswordForm,
    passwordData,
    setPasswordData,
    isLoading,
    profileSaving,
    deleteLoading,
    error,
    success,
    handlePasswordChange,
    handleProfileSave,
    handleSignOut,
    handleAvatarUpload,
    handleDeleteAccount,
    avatarLoading,
    resetPasswordForm,
    clearErrorOnInput,
  } = useProfile();

  const [showPassword, setShowPassword] = useState(false);
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Profile</h1>
        </div>
      </div>

      {success && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleProfileSave}>
        <SectionHeading
          title="Personal details"
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Full name</label>
            <Input
              value={profileData.fullName}
              onChange={(e) => setProfileData((prev) => ({ ...prev, fullName: e.target.value }))}
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Email address</label>
            <Input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAvatarPreview(true)}
              className="rounded-full outline-none ring-transparent transition hover:ring-2 hover:ring-[var(--accent)]"
            >
              <Avatar
                src={user?.user_metadata?.avatar_url}
                name={profileData.fullName || user?.email}
                size="lg"
                className="cursor-pointer"
              />
            </button>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Avatar</p>
            </div>
          </div>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)]">
            <UploadCloud className="mr-2 h-4 w-4" />
            {avatarLoading ? 'Uploading...' : 'Upload avatar'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarUpload(file);
              }}
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit" loading={profileSaving} disabled={profileSaving}>
            Save profile
          </Button>
        </div>
      </form>

      {showAvatarPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowAvatarPreview(false)}
              className="absolute right-3 top-3 rounded-full border border-[var(--border)] bg-[var(--bg-base)] p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface)]"
            >
              ✕
            </button>
            <div className="flex flex-col items-center gap-4">
              <Avatar
                src={user?.user_metadata?.avatar_url}
                name={profileData.fullName || user?.email}
                size="lg"
                className="h-28 w-28"
              />
              <p className="text-sm font-semibold text-[var(--text-primary)]">Profile photo</p>
              <p className="text-xs text-[var(--text-secondary)] text-center">
                This is a preview of your current avatar.
              </p>
            </div>
          </div>
        </div>
      )}

      <Divider />

      <SectionHeading
        title="Security"
        description="Update your password and keep your account secure."
      />

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Password</p>
            <p className="text-xs text-[var(--text-secondary)]">Change your password for email sign-in accounts.</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              setShowPasswordForm(!showPasswordForm);
              setShowPassword(!showPassword);
            }}
            size="sm"
          >
            {showPasswordForm ? 'Hide' : 'Change'}
          </Button>
        </div>

        {showPasswordForm && (
          <form onSubmit={handlePasswordChange} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">New password</label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => {
                    setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }));
                    clearErrorOnInput();
                  }}
                  placeholder="Enter a strong password"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Confirm password</label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => {
                    setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }));
                    clearErrorOnInput();
                  }}
                  placeholder="Repeat the password"
                />
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => { resetPasswordForm(); setShowPasswordForm(false); setShowPassword(false); }}>
                Cancel
              </Button>
              <Button type="submit" loading={isLoading}>
                Save password
              </Button>
            </div>
          </form>
        )}
      </div>

      <Divider />

      <SectionHeading
        title="Danger zone"
        description="This action cannot be undone. Deleting your account removes your profile and access."
      />

      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-red-700">Delete account</p>
            <p className="mt-1 text-sm text-red-700/80">
              Permanently remove your account and all linked data.
            </p>
          </div>
          <Button
            variant="destructive"
            loading={deleteLoading}
            onClick={() => {
              if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                handleDeleteAccount();
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete account
          </Button>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="secondary" onClick={handleSignOut} size="sm">
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    </motion.div>
  );
}
