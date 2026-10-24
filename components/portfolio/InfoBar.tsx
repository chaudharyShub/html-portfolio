import { YearsExperience } from '@/components/live/CareerStats';
import { PROFILE } from '@/data/profile';

const initials = PROFILE.name
  .split(/\s+/)
  .map((part) => part[0])
  .join('')
  .slice(0, 2)
  .toUpperCase();

/**
 * Name, role, status and experience. On desktop it is the profile card at the top of the
 * window's sidebar; on phones it is a row under the title bar.
 */
export function InfoBar() {
  return (
    <header className="info-bar">
      <span className="info-avatar" aria-hidden="true">
        {initials}
      </span>
      <span className="info-item info-name">
        <b>Name:</b> {PROFILE.name}
      </span>
      <span className="info-item info-role">
        <b>Role:</b> {PROFILE.role}
      </span>
      <span className="info-item info-status">
        <b>Status:</b> <span className="status-dot">&#9679;</span> ONLINE
      </span>
      <span className="info-item info-exp">
        <b>Experience:</b> <YearsExperience withUnit />
      </span>
    </header>
  );
}
