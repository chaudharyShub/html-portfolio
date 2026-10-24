import { DownloadIcon } from '@/components/icons';
import { PROFILE } from '@/data/profile';
import { getWeb3FormsAccessKey } from '@/lib/contact';
import { ContactForm } from './ContactForm';
import { ResumeButton } from './ResumeButton';

export function Contact() {
  return (
    <fieldset className="section" id="section-contact">
      <legend>
        <h2>Message</h2>
      </legend>
      <p>Recipient: {PROFILE.name}</p>
      <ContactForm accessKey={getWeb3FormsAccessKey()} />
      <div className="links-row">
        <a className="btn" href={`mailto:${PROFILE.email}`}>
          Email
        </a>
        <a className="btn" href={PROFILE.links.github} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <a className="btn" href={PROFILE.links.linkedin} target="_blank" rel="noopener noreferrer">
          LinkedIn
        </a>
        <ResumeButton>
          <DownloadIcon />
          Download Resume (PDF)
        </ResumeButton>
      </div>
    </fieldset>
  );
}
