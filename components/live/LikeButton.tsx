'use client';

import { useEffect, useId, useRef, useState, type AnimationEvent } from 'react';
import { HeartIcon } from '@/components/icons';
import { useOsActions, type ToastEmoji } from '@/components/os/OsProvider';
import { loadLikes, removeLike, sendLike, useLikes } from '@/lib/likes-client';
import { likeIdPreference } from '@/lib/preferences';

const formatCount = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

/** The like toast's icon: a random one of these each time, each on a tile in its own tint. */
const THANKS_EMOJIS: readonly ToastEmoji[] = [
  { emoji: '😊', tint: '#ffb020' },
  { emoji: '🥰', tint: '#ff5e8a' },
  { emoji: '😄', tint: '#ffb020' },
  { emoji: '🤩', tint: '#ffc83d' },
  { emoji: '💗', tint: '#ff4f9a' },
  { emoji: '💖', tint: '#e84aa6' },
  { emoji: '✨', tint: '#a78bfa' },
  { emoji: '🎉', tint: '#8b5cf6' },
  { emoji: '🙌', tint: '#f59e0b' },
  { emoji: '🌟', tint: '#fbbf24' },
  { emoji: '🥳', tint: '#ec4899' },
];

let lastThanks = -1;

/** A random thanks emoji, never the same one twice in a row. */
function pickThanksEmoji(): ToastEmoji {
  let i = Math.floor(Math.random() * THANKS_EMOJIS.length);
  if (i === lastThanks) i = (i + 1) % THANKS_EMOJIS.length;
  lastThanks = i;
  return THANKS_EMOJIS[i] as ToastEmoji;
}

/** Unliking: a random one of these stands in for the heart (just the emoji, no tile). */
const SAD_EMOJIS = ['😞', '😢', '😔', '🥺', '😿', '💔'];

let lastSad = -1;

/** A random sad emoji, never the same one twice in a row. */
function pickSadEmoji(): string {
  let i = Math.floor(Math.random() * SAD_EMOJIS.length);
  if (i === lastSad) i = (i + 1) % SAD_EMOJIS.length;
  lastSad = i;
  return SAD_EMOJIS[i] as string;
}

/** How long the sad face stands in for the heart after an unlike. */
const SAD_MS = 2000;

/** 'sad': a sad face replaces the heart after an unlike; 'back': the heart is popping back in. */
type Mood = 'sad' | 'back' | null;

/**
 * Heart + shared like count. The count lives in Upstash Redis behind /api/likes. Each browser
 * likes once and can take it back by clicking again (it keeps its like's id; the server only
 * removes a like for its id). Two copies are rendered: in the status bar (computers: "Like · 12"
 * with a tooltip) and in the title bar (phones: heart + count); CSS shows the right one.
 * Liking shows a toast with a random happy emoji; unliking swaps the heart
 * for a random sad face for a moment.
 * Hidden when the likes service is unavailable (for example locally without the env vars).
 */
export function LikeButton({ placement }: { placement: 'status' | 'title' }) {
  const liked = likeIdPreference.use() !== null;
  const { count, available } = useLikes();
  const { showToast } = useOsActions();
  const [popping, setPopping] = useState(false);
  const [mood, setMood] = useState<Mood>(null);
  const [sadEmoji, setSadEmoji] = useState(SAD_EMOJIS[0]);
  const sadTimer = useRef<number | undefined>(undefined);
  const tipId = useId();

  useEffect(loadLikes, []);
  useEffect(() => () => window.clearTimeout(sadTimer.current), []);

  if (!available) return null;

  const toggle = async () => {
    window.clearTimeout(sadTimer.current);
    if (liked) {
      // No toast: a sad face stands in for the heart for a moment, then the heart comes back.
      setSadEmoji(pickSadEmoji());
      setMood('sad');
      sadTimer.current = window.setTimeout(() => setMood('back'), SAD_MS);
      const result = await removeLike();
      if (result !== 'saved') {
        window.clearTimeout(sadTimer.current);
        setMood(null);
      }
      if (result === 'failed') showToast('Like not removed', 'Something went wrong. Please try again in a moment.');
      return;
    }
    setMood(null);
    setPopping(true);
    const result = await sendLike();
    if (result === 'saved') showToast('Thanks for the like!', 'It means a lot - Shubham', pickThanksEmoji());
    if (result === 'limit') showToast('Like not counted', "Your network has reached today's like limit. Please try again tomorrow.");
    if (result === 'failed') showToast('Like not saved', 'Something went wrong. Please try again in a moment.');
  };

  const label =
    count === null
      ? 'Like this portfolio'
      : `${liked ? 'You liked this portfolio' : 'Like this portfolio'} - ${count} ${count === 1 ? 'like' : 'likes'}`;
  const status = placement === 'status';

  const onAnimationEnd = (e: AnimationEvent) => {
    if (e.animationName === 'heartPop') setPopping(false);
    if (e.animationName === 'heartBack') setMood(null);
  };

  return (
    <button
      type="button"
      className={`like-button like-button--${placement}${popping ? ' like-button--pop' : ''}${mood ? ` like-button--${mood}` : ''}`}
      aria-pressed={liked}
      aria-label={label}
      aria-describedby={status ? tipId : undefined}
      onClick={toggle}
      onAnimationEnd={onAnimationEnd}
    >
      {mood === 'sad' ? (
        <span className="like-sad" aria-hidden="true">
          {sadEmoji}
        </span>
      ) : (
        <HeartIcon />
      )}
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
