export const DEFAULT_GIRL_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
];

export function getAvatarUrl(avatar?: string | null, name?: string, seedKey?: string): string {
  if (
    avatar &&
    typeof avatar === 'string' &&
    avatar.trim().length > 0 &&
    !avatar.includes('via.placeholder.com') &&
    avatar !== 'undefined'
  ) {
    return avatar;
  }

  const key = seedKey || name || 'creator';
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DEFAULT_GIRL_AVATARS.length;
  return DEFAULT_GIRL_AVATARS[index];
}
