export const getDisplayName = (user) => {
  return user?.user_metadata?.full_name || 
         user?.user_metadata?.name || 
         user?.email?.split('@')[0] || 
         'User';
};

export const isEmailUser = (user) => {
  return user?.app_metadata?.provider === 'email';
};

// Derive an avatar URL from user metadata or fall back to a generated placeholder.
// 1. OAuth providers supply `avatar_url`.
// 2. For email users we generate a placeholder via https://ui-avatars.com.
// This will keep our logic in one place and avoids UI conditionals.
export const getAvatarUrl = (user) => {
  if (!user) return 'https://ui-avatars.com/api/?name=User&background=random';

  const directUrl = user?.user_metadata?.avatar_url;
  if (directUrl) return directUrl;

  const displayName = getDisplayName(user);
  const encodedName = encodeURIComponent(displayName || 'User');
  return `https://ui-avatars.com/api/?name=${encodedName}&background=random`;
};