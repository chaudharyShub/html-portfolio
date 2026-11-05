import { Clock } from '@/components/live/Clock';
import { CurrentYear } from '@/components/live/CurrentYear';
import { LikeButton } from '@/components/live/LikeButton';
import { VisitorCounter } from '@/components/live/VisitorCounter';
import { PROFILE } from '@/data/profile';

export function StatusBar() {
  return (
    <footer className="status-bar">
      <span>
        Time:{' '}
        <span id="clock">
          <Clock />
        </span>
      </span>
      <span>Status: System Online</span>
      <span>Made with Next.js | React | TypeScript</span>
      <span>
        &copy; <CurrentYear /> {PROFILE.name}
      </span>
      <span className="status-chips">
        <LikeButton placement="status" />
        <VisitorCounter />
      </span>
    </footer>
  );
}
