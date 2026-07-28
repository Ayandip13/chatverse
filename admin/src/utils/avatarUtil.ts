const DEFAULT_GIRL_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&auto=format&fit=crop&q=80',
];

export function getAvatarUrl(avatar?: string | null, name?: string): string {
  if (
    avatar &&
    typeof avatar === 'string' &&
    avatar.trim().length > 0 &&
    !avatar.includes('via.placeholder.com') &&
    avatar !== 'undefined'
  ) {
    let cleanUrl = avatar.trim();
    if (cleanUrl.startsWith('/uploads') || cleanUrl.startsWith('uploads')) {
      const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api/v1';
      const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
      const relativePath = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
      return `${baseUrl}${relativePath}`;
    }
    return cleanUrl;
  }

  const key = name || 'creator';
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DEFAULT_GIRL_AVATARS.length;
  return DEFAULT_GIRL_AVATARS[index];
}
