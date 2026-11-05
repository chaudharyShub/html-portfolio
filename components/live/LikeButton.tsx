'use client';

import { useEffect, useState } from 'react';
import { HeartIcon } from '@/components/icons';
import { useOsActions } from '@/components/os/OsProvider';
import { loadLikes, sendLike, useLikes } from '@/lib/likes-client';
import { likedPreference } from '@/lib/preferences';

const formatCount = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

/**
 * Heart + shared like count. The count lives in Upstash Redis behind /api/likes; this browser
 * remembers its own like, so each visitor likes once (no unlike). Two copies are rendered: in the
 * status bar (computers) and in the title bar (phones); CSS shows the right one.
 * Hidden when the likes service is unavailable (for example locally without the env vars).
 */
export function LikeButton({ placement }: { placement: 'status' | 'title' }) {
  const liked = likedPreference.use();
  const { count, available } = useLikes();
  const { showToast } = useOsActions();
  const [popping, setPopping] = useState(false);

  useEffect(loadLikes, []);

  if (!available) return null;

  const like = async () => {
    if (liked) {
      showToast('Thank you', 'You already liked this portfolio.');
      return;
    }
    setPopping(true);
    if (await sendLike()) {
      showToast('Thanks for the like!', 'It means a lot - Shubham');
    } else {
      showToast('Like not saved', 'Something went wrong. Please try again in a moment.');
    }
  };

  const label =
    count === null
      ? 'Like this portfolio'
      : `${liked ? 'You liked this portfolio' : 'Like this portfolio'} - ${count} ${count === 1 ? 'like' : 'likes'}`;

  return (
    <button
      type="button"
      className={`like-button like-button--${placement}${popping ? ' like-button--pop' : ''}`}
      aria-pressed={liked}
      aria-label={label}
      title={label}
      onClick={like}
      onAnimationEnd={() => setPopping(false)}
    >
      <HeartIcon />
      <span className="like-count">{count === null ? '-' : formatCount.format(count)}</span>
    </button>
  );
}
