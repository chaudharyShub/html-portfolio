import { Clock } from '@/components/live/Clock';
import { CurrentYear } from '@/components/live/CurrentYear';
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
      <span>Made with HTML | CSS | JavaScript - No Frameworks</span>
      <span>
        &copy; <CurrentYear /> {PROFILE.name}
      </span>
      <VisitorCounter />
    </footer>
  );
}
