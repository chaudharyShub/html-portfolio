'use client';

import { useEffect, useState } from 'react';
import { HeartIcon } from '@/components/icons';
import { useOsActions } from '@/components/os/OsProvider';
import { likedPreference } from '@/lib/preferences';

const formatCount = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

/**
 * Heart + shared like count in the status bar. The count lives in Upstash Redis behind
 * /api/likes; this browser remembers its own like, so each visitor likes once (no unlike).
 * Hidden when the likes service is unavailable (for example locally without the env vars).
 */
export function LikeButton() {
  const liked = likedPreference.use();
  const { showToast } = useOsActions();
  const [count, setCount] = useState<number | null>(null);
  const [available, setAvailable] = useState(true);
  const [popping, setPopping] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/likes', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: { count: number }) => {
        if (!cancelled) setCount(data.count);
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!available) return null;

  const like = async () => {
    if (liked) {
      showToast('Thank you', 'You already liked this portfolio.');
      return;
    }
    // Show the like at once, then settle on the server's total.
    likedPreference.set(true);
    setPopping(true);
    setCount((c) => (c === null ? c : c + 1));
    try {
      const res = await fetch('/api/likes', { method: 'POST' });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { count: number };
      setCount(data.count);
      showToast('Thanks for the like!', 'It means a lot - Shubham');
    } catch {
      likedPreference.set(false);
      setCount((c) => (c === null ? c : Math.max(0, c - 1)));
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
      id="like-button"
      className={popping ? 'like-button like-button--pop' : 'like-button'}
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
