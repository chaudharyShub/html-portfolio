import { YearsExperience } from '@/components/live/CareerStats';
import { PROFILE } from '@/data/profile';

export function InfoBar() {
  return (
    <header className="info-bar">
      <span>
        <b>Name:</b> {PROFILE.name}
      </span>
      <span>
        <b>Role:</b> {PROFILE.role}
      </span>
      <span>
        <b>Status:</b> <span className="status-dot">&#9679;</span> ONLINE
      </span>
      <span>
        <b>Experience:</b> <YearsExperience withUnit />
      </span>
    </header>
  );
}
