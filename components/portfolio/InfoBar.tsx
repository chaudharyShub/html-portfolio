import { YearsExperience } from '@/components/live/CareerStats';
import { PROFILE } from '@/data/profile';

/**
 * Name, role, status and experience. On desktop it is the profile card at the top of the
 * window's sidebar; on phones it is a row under the title bar.
 */
export function InfoBar() {
  return (
    <header className="info-bar">
      {/* Decorative: the name is right next to it. Small static file, so a plain <img>. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="info-avatar" src={PROFILE.photo} alt="" width={42} height={42} />
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
