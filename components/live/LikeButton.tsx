'use client';

import { useEffect, useId, useState } from 'react';
import { HeartIcon } from '@/components/icons';
import { useOsActions } from '@/components/os/OsProvider';
import { loadLikes, removeLike, sendLike, useLikes } from '@/lib/likes-client';
import { likeIdPreference } from '@/lib/preferences';

const formatCount = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

/**
 * Heart + shared like count. The count lives in Upstash Redis behind /api/likes. Each browser
 * likes once and can take it back by clicking again (it keeps its like's id; the server only
 * removes a like for its id). Two copies are rendered: in the status bar (computers: "Like · 12"
 * with a tooltip) and in the title bar (phones: heart + count); CSS shows the right one.
 * Hidden when the likes service is unavailable (for example locally without the env vars).
 */
export function LikeButton({ placement }: { placement: 'status' | 'title' }) {
  const liked = likeIdPreference.use() !== null;
  const { count, available } = useLikes();
  const { showToast } = useOsActions();
  const [popping, setPopping] = useState(false);
  const tipId = useId();

  useEffect(loadLikes, []);

  if (!available) return null;

  const toggle = async () => {
    if (liked) {
      // Unliking is quiet; only a failure is reported.
      if ((await removeLike()) === 'failed') {
        showToast('Like not removed', 'Something went wrong. Please try again in a moment.');
      }
      return;
    }
    setPopping(true);
    const result = await sendLike();
    if (result === 'saved') showToast('Thanks for the like!', 'It means a lot - Shubham');
    if (result === 'limit') showToast('Like not counted', "Your network has reached today's like limit. Please try again tomorrow.");
    if (result === 'failed') showToast('Like not saved', 'Something went wrong. Please try again in a moment.');
  };

  const label =
    count === null
      ? 'Like this portfolio'
      : `${liked ? 'You liked this portfolio' : 'Like this portfolio'} - ${count} ${count === 1 ? 'like' : 'likes'}`;
  const status = placement === 'status';

  return (
    <button
      type="button"
      className={`like-button like-button--${placement}${popping ? ' like-button--pop' : ''}`}
      aria-pressed={liked}
      aria-label={label}
      aria-describedby={status ? tipId : undefined}
      onClick={toggle}
      onAnimationEnd={() => setPopping(false)}
    >
      <HeartIcon />
      <span className="like-count">
        {status && `${liked ? 'Liked' : 'Like'} · `}
        {count === null ? (
          // Three dots in a small wave while the count loads.
          <span className="like-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        ) : (
          formatCount.format(count)
        )}
      </span>
      {status && (
        <span className="like-tip" role="tooltip" id={tipId}>
          {liked ? 'Unlike' : 'Like this portfolio'}
        </span>
      )}
    </button>
  );
}
