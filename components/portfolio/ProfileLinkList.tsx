import { LinkTile } from '@/components/icons';
import { PROFILE_LINKS } from '@/data/profile';

/**
 * Every profile link as a settings-style grouped list: a tile, the name, a handle under it, ↗.
 * Used by the Contact section's "Find me online" card and the phone Home Screen's Links sheet.
 */
export function ProfileLinkList({ labelledBy, ariaLabel }: { labelledBy?: string; ariaLabel?: string }) {
  return (
    <ul className="profile-links" aria-labelledby={labelledBy} aria-label={ariaLabel}>
      {PROFILE_LINKS.map(({ id, label, detail, href }) => (
        <li key={id}>
          <a href={href} target="_blank" rel="noopener noreferrer">
            <LinkTile id={id} />
            <span className="profile-link-text">
              <span className="profile-link-label">{label}</span>
              <span className="profile-link-detail">{detail}</span>
            </span>
            <span className="profile-link-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
