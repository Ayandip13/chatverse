export const DEFAULT_BOY_AVATARS = [
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=500&auto=format&fit=crop&q=80',
];

export const DEFAULT_GIRL_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
];

export function getAvatarUrl(avatar?: string | null, name?: string, seedKey?: string, role: 'BOY' | 'GIRL' = 'GIRL'): string {
  if (
    avatar &&
    typeof avatar === 'string' &&
    avatar.trim().length > 0 &&
    !avatar.includes('via.placeholder.com') &&
    avatar !== 'undefined'
  ) {
    let cleanUrl = avatar.trim();
    if (cleanUrl.startsWith('/uploads') || cleanUrl.startsWith('uploads')) {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.105:5000/api/v1';
      const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
      const relativePath = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
      return `${baseUrl}${relativePath}`;
    }
    return cleanUrl;
  }

  const key = seedKey || name || 'creator';
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % (role === 'BOY' ? DEFAULT_BOY_AVATARS.length : DEFAULT_GIRL_AVATARS.length);
  return role === 'BOY' ? DEFAULT_BOY_AVATARS[index] : DEFAULT_GIRL_AVATARS[index];
}
