import { Clock } from '@/components/live/Clock';
import { CurrentYear } from '@/components/live/CurrentYear';
import { LikeButton } from '@/components/live/LikeButton';
import { VisitorCounter } from '@/components/live/VisitorCounter';
import { PROFILE } from '@/data/profile';

export function StatusBar() {
  return (
    <footer className="status-bar">
      <span className="status-time">
        Time:{' '}
        <span id="clock">
          <Clock />
        </span>
      </span>
      <span className="status-state">Status: System Online</span>
      <span className="status-made">Made with Next.js | React | TypeScript</span>
      <span className="status-copy">
        &copy; <CurrentYear /> {PROFILE.name}
      </span>
      <span className="status-chips">
        <LikeButton placement="status" />
        <VisitorCounter />
      </span>
    </footer>
  );
}
