export const getDisplayName = (user) => {
  return user?.user_metadata?.full_name || 
         user?.user_metadata?.name || 
         user?.email?.split('@')[0] || 
         'User';
};

export const isEmailUser = (user) => {
  return user?.app_metadata?.provider === 'email';
}; 