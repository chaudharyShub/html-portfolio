import { DownloadIcon } from '@/components/icons';
import { PROFILE } from '@/data/profile';
import { getWeb3FormsAccessKey } from '@/lib/contact';
import { ContactForm } from './ContactForm';
import { ProfileLinkList } from './ProfileLinkList';
import { ResumeButton } from './ResumeButton';

/** The form on the left and "Find me online" on the right; stacked when the window is narrow. */
export function Contact() {
  return (
    <fieldset className="section" id="section-contact">
      <legend>
        <h2>Message</h2>
      </legend>
      <p>Recipient: {PROFILE.name}</p>
      <div className="contact-layout">
        <div className="contact-grid">
          <div className="contact-main">
            <ContactForm accessKey={getWeb3FormsAccessKey()} />
            <div className="links-row">
              <a className="btn" href={`mailto:${PROFILE.email}`}>
                Email
              </a>
              <ResumeButton>
                <DownloadIcon />
                Download Resume (PDF)
              </ResumeButton>
            </div>
          </div>
          <div className="contact-links">
            <h3 className="sub" id="profile-links-title">
              Find me online
            </h3>
            <ProfileLinkList labelledBy="profile-links-title" />
          </div>
        </div>
      </div>
    </fieldset>
  );
}
