import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import PublicFooter from '../ui/PublicFooter.jsx';
import PublicHeader from '../ui/PublicHeader.jsx';

const LAST_UPDATED = 'September 6, 2026';

function Section({ number, title, children }) {
  return (
    <section className="legal-section">
      <h2>{number}. {title}</h2>
      {children}
    </section>
  );
}

function PrivacyPolicy() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="legal-lead">Learn how SkillSignal collects, uses, and protects your information.</p>
      <p className="legal-date"><strong>Date effective:</strong> {LAST_UPDATED}</p>

      <Section number="1" title="Who this policy applies to">
        <p>This policy applies to SkillSignal, the SkillSignal website, account areas, developer and employer profiles, AI matching tools, messaging features, and related services (together, the “Service”). “SkillSignal,” “we,” “us,” and “our” refer to the operator of the Service. “You” means anyone who visits or uses it.</p>
        <p>SkillSignal is a portfolio and discovery tool, and is the data controller for information collected directly through the Service. If you submit information about another person, you must have the authority and lawful basis to do so.</p>
      </Section>

      <Section number="2" title="Information we collect">
        <h3>Information you provide</h3>
        <ul>
          <li>Account details such as your name, email address, role, presence status, account timestamps, and a securely hashed password. We do not store your readable password.</li>
          <li>Profile and portfolio information, including title, summary, skills, availability, work preferences, projects, project descriptions, GitHub or live-project links, contact links, posts, profile images, and visibility choices.</li>
          <li>Employer briefs, matching requests, messages, message image URLs, connection requests, saved candidates, proof signals, support questions, and other content you submit.</li>
          <li>Preferences and settings, including notification and display choices.</li>
        </ul>
        <h3>Information collected automatically</h3>
        <p>The browser stores a sign-in token, cached profile information, notification state, theme, and preferences in local storage. The Service does not currently use advertising cookies or third-party cross-site tracking. For unauthenticated AI search limits, the server derives a one-way hash from the request IP address and user-agent; the application uses that hash to count daily searches. Hosting and web infrastructure may also create ordinary security and error logs.</p>
        <h3>Information from other sources</h3>
        <p>We may receive information from another user when they send a connection request or message. We do not currently import profiles from external social networks or connect to external employer systems.</p>
      </Section>

      <Section number="3" title="How we use information">
        <p>We use information to:</p>
        <ul>
          <li>create and secure accounts, profiles, portfolios, and conversations;</li>
          <li>display public profile content according to your settings;</li>
          <li>run AI matching and generate fit explanations from employer briefs and profile evidence;</li>
          <li>deliver messages, connection requests, notifications, and requested support;</li>
          <li>monitor performance, prevent abuse, investigate security incidents, and enforce our terms;</li>
          <li>maintain, troubleshoot, measure, and improve the Service, including enforcing daily AI search limits; and</li>
          <li>meet legal, regulatory, and accounting obligations.</li>
        </ul>
        <p>We do not sell personal information or use it for advertising. If UK, EU, or similar privacy law applies, our intended legal bases are performance of the account and Service contract, legitimate interests in operating and securing the Service, consent where the law requires it, and compliance with legal obligations. We will not rely on consent where another lawful basis is required or more appropriate.</p>
      </Section>

      <Section number="4" title="AI matching and public profiles">
        <p>Matching first runs a local, rules-based analysis and ranking. If an OpenAI API key is configured for the deployment, SkillSignal sends the matching brief, the derived signals, and selected profile and project fields to OpenAI to rerank results. The candidate rundown feature sends the requested brief and the selected public profile’s name, title, summary, skills, and project evidence to OpenAI. Messages and passwords are not sent to OpenAI by these features.</p>
        <p>OpenAI’s API states that business API inputs and outputs are not used to train its models by default, but its standard API controls can retain abuse-monitoring or application-state data for a limited period. SkillSignal does not currently configure zero-data-retention controls, so do not put secrets, sensitive personal data, or confidential employer information into a brief. We will update this section if the AI provider or retention configuration changes.</p>
        <p>AI results are suggestions, not verified facts, recommendations, employment decisions, or guarantees. Employers and developers must make their own decisions and provide meaningful human review. Profile pages and project evidence are visible publicly only when the owner enables profile display. Do not publish credentials, private contact details, or information you are not allowed to share.</p>
      </Section>

      <Section number="5" title="When we share information">
        <p>We share information only as needed to run the Service, at your direction, or as required by law. The current application uses its configured PostgreSQL database and hosting environment to store and serve Service data. When enabled, OpenAI processes the AI inputs described above. We may add other providers later; we will identify material provider changes in this policy before relying on them for new processing.</p>
        <p>We may disclose information to comply with valid legal process, protect users or the Service, investigate fraud or abuse, or support a merger, financing, acquisition, or sale of assets. We do not disclose private messages or profile data to unrelated advertisers.</p>
      </Section>

      <Section number="6" title="Retention and deletion">
        <p>You can permanently delete your account from Settings. After you confirm, SkillSignal immediately removes the account and associated server-side records, including your profile, projects, posts, messages, connections, saved candidates, proof signals, and AI usage history. The deletion is irreversible, and you are signed out.</p>
        <p>Active Service records are removed when deletion is confirmed. Limited technical information may remain in encrypted backups or infrastructure logs until those systems rotate or overwrite it, and information already sent to OpenAI is subject to OpenAI’s retention controls. We may retain narrowly scoped information where necessary for security, fraud prevention, disputes, or legal obligations. Local-storage copies remain on your device until the browser, site data, or the relevant account cache is cleared. If deletion fails or you have a personal-information question, contact <a href="mailto:joejewell99@hotmail.com">joejewell99@hotmail.com</a>.</p>
      </Section>

      <Section number="7" title="Your choices and rights">
        <p>Depending on where you live, you may have rights to access, correct, delete, export, restrict, or object to certain uses of your information. You can update profile content, visibility, and notification settings in the Service. You can also request that we stop using your information for a particular purpose where the law gives you that right.</p>
        <p>Send requests to <a href="mailto:joejewell99@hotmail.com">joejewell99@hotmail.com</a>. We may need to verify your identity and may refer a request to the employer or developer who controls the relevant content.</p>
        <p>If you are in the UK or EEA, you may also complain to your local data-protection authority. If you are in the UK, the relevant authority is the Information Commissioner’s Office.</p>
      </Section>

      <Section number="8" title="Security and children">
        <p>We use access controls, encrypted connections, secure authentication practices, monitoring, and other safeguards appropriate to the Service. No online service is completely secure, and you are responsible for protecting your password and devices.</p>
        <p>SkillSignal is intended for people who are at least 18 years old. We do not knowingly collect personal information from children. Contact us if you believe a child has provided information so we can investigate and remove it where appropriate.</p>
      </Section>

      <Section number="9" title="International processing and changes">
        <p>The Service may be hosted or supported in countries different from where you live, including where our deployment provider or OpenAI processes requests. We do not currently maintain a formal list of regions or a published transfer mechanism. Before serving UK or EEA users at scale, the operator should confirm hosting regions, execute required data-processing agreements, and document appropriate transfer safeguards.</p>
        <p>We may update this policy as the Service changes. We will post the revised version here and update the date above; material changes may also be communicated through the Service.</p>
      </Section>

      <Section number="10" title="Contact">
        <p>Questions about privacy or this policy can be sent to <a href="mailto:joejewell99@hotmail.com">joejewell99@hotmail.com</a>.</p>
      </Section>
    </>
  );
}

function Terms() {
  return (
    <>
      <h1>Terms and Conditions</h1>
      <p className="legal-lead">The rules for creating an account, publishing work, using matching tools, and communicating through SkillSignal.</p>
      <p className="legal-date"><strong>Date effective:</strong> {LAST_UPDATED}</p>

      <Section number="1" title="Agreement and eligibility">
        <p>These Terms and Conditions (“Terms”) are an agreement between you and SkillSignal for your use of the Service. When you create an account, you must expressly accept these Terms and acknowledge our <Link to="/privacy">Privacy Policy</Link>. If you do not agree, do not create an account or use account-only features. Public browsing remains available without account acceptance.</p>
        <p>You must be at least 18 years old and legally able to enter this agreement. If you use SkillSignal for a company or client, you confirm that you are authorized to accept these Terms for them.</p>
      </Section>

      <Section number="2" title="What SkillSignal provides">
        <p>SkillSignal provides tools for developers to present project proof and for employers to discover, evaluate, and contact potential candidates. The Service may include public profiles, search, AI-assisted matching, fit explanations, connection requests, messaging, notifications, and account settings.</p>
        <p>SkillSignal is an evolving beta service. Features may change, be paused, or be retired, and we may limit access while we maintain or improve the platform. Keep your own copies of important portfolio material. We do not promise that the Service, any profile, any match, or any message will always be available, accurate, safe, or suitable for a particular hiring outcome.</p>
      </Section>

      <Section number="3" title="Accounts and acceptable use">
        <p>You are responsible for accurate account information, keeping credentials confidential, and activity under your account. You may not:</p>
        <ul>
          <li>impersonate another person, misrepresent experience, or publish work you did not create or have permission to show;</li>
          <li>access another account, private profile, message, or system without authorization;</li>
          <li>scrape, crawl, harvest, spam, or bulk-contact users outside supported features;</li>
          <li>upload malware, confidential information, unlawful material, discriminatory content, or another person’s personal data without permission;</li>
          <li>reverse engineer, disrupt, overload, bypass security, or probe the Service;</li>
          <li>use SkillSignal to make a high-impact decision without appropriate human review, or treat an AI match as a guarantee; or</li>
          <li>use the Service to build a competing directory or matching product.</li>
        </ul>
      </Section>

      <Section number="4" title="Your content and our license">
        <p>You keep ownership of the text, images, links, project details, messages, and other material you submit (“User Content”). You give SkillSignal a non-exclusive, worldwide, royalty-free license to host, reproduce, format, display, transmit, and process User Content only as needed to provide, operate, secure, and support the Service and to show content to the audience you select. This license does not give SkillSignal ownership of your work or permission to sell it or use it to train a general-purpose model.</p>
        <p>You confirm that you own or have the rights and permissions needed for User Content, and that it does not violate law or another person’s rights. You can remove User Content through available controls, but copies may persist in backups or in messages already delivered to other users.</p>
      </Section>

      <Section number="5" title="AI output and hiring decisions">
        <p>SkillSignal may use automated systems or third-party model providers to summarize briefs, identify signals, rank profiles, and explain matches. AI output is an assistive suggestion, not a fact, endorsement, background check, employment offer, or professional advice. A match score or ranking does not determine whether someone is hired, rejected, contacted, or qualified.</p>
        <p>You must independently verify claims, permissions, identity, work history, and technical ability before relying on them. Employers must provide meaningful human review before making a hiring decision, consider candidates fairly, and comply with applicable recruiting, privacy, anti-discrimination, and recordkeeping requirements. SkillSignal does not assess protected characteristics and does not guarantee that AI output is complete, unbiased, or accurate.</p>
      </Section>

      <Section number="6" title="Communication and safety">
        <p>Connection requests and messages are user-to-user communications. You are responsible for what you send and for deciding whether to continue a conversation, share contact details, interview someone, or enter a contract.</p>
        <p>Report suspected abuse, harassment, impersonation, stolen work, unlawful content, spam, intellectual property violations, or security problems through <a href="mailto:joejewell99@hotmail.com">joejewell99@hotmail.com</a>. We may review reports, remove content, restrict visibility, or suspend an account while we investigate. We will provide notice where practical and legally permitted. Do not use the Service to submit passwords, financial details, health information, government identifiers, or confidential information you are not authorized to share.</p>
      </Section>

      <Section number="7" title="Intellectual property">
        <p>The Service, including its software, design, branding, documentation, and underlying systems, belongs to SkillSignal or its licensors. These Terms give you a limited, revocable right to use the Service for its intended purpose. You may not copy, modify, sell, sublicense, or create a competing service from it without written permission.</p>
      </Section>

      <Section number="8" title="Suspension and termination">
        <p>You may permanently delete your account from Settings at any time. We may suspend or terminate access when needed to protect users or the Service, respond to a legal requirement, investigate abuse, or address a breach of these Terms. We will provide notice where reasonable and legally permitted.</p>
        <p>Sections concerning User Content, intellectual property, disclaimers, liability, disputes, and any provisions that should reasonably survive termination will continue after an account ends.</p>
      </Section>

      <Section number="9" title="Disclaimers and limits of liability">
        <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICE AND AI OUTPUT ARE PROVIDED “AS IS” AND “AS AVAILABLE.” SKILLSIGNAL DISCLAIMS WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, ACCURACY, AVAILABILITY, AND UNINTERRUPTED OR ERROR-FREE OPERATION.</p>
        <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, SKILLSIGNAL WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE LOSS, OR FOR LOST PROFITS, OPPORTUNITIES, DATA, OR BUSINESS. OUR TOTAL LIABILITY FOR CLAIMS RELATING TO THE SERVICE WILL NOT EXCEED THE GREATER OF THE AMOUNT YOU PAID US IN THE 12 MONTHS BEFORE THE EVENT OR THE MINIMUM AMOUNT PERMITTED BY LAW. Nothing in these Terms limits liability that cannot legally be limited.</p>
      </Section>

      <Section number="10" title="Indemnity">
        <p>To the extent permitted by law, you agree to defend and indemnify SkillSignal and its officers, employees, and providers against third-party claims and reasonable costs arising from your User Content, misuse of the Service, breach of these Terms, or violation of another person’s rights or applicable law.</p>
      </Section>

      <Section number="11" title="Disputes and general terms">
        <p>Before starting a formal claim, you agree to contact us at <a href="mailto:joejewell99@hotmail.com">joejewell99@hotmail.com</a> and give us a reasonable opportunity to resolve the issue. Any dispute will be handled under the mandatory laws and courts that apply to you and to the operator of SkillSignal; nothing here removes rights that cannot be waived under local law.</p>
        <p>We may update these Terms by posting a revised version and changing the date above. If a change is material, we will provide reasonable notice. If any provision is unenforceable, the rest remains effective. These Terms and the Privacy Policy are the complete agreement about the Service unless a written agreement says otherwise.</p>
      </Section>
    </>
  );
}

export default function LegalPage() {
  const { pathname } = useLocation();
  const isPrivacy = pathname === '/privacy';

  return (
    <main className="public-page legal-page">
      <PublicHeader />
      <article className="legal-document">
        <div className="legal-breadcrumb"><Link to="/">SkillSignal</Link><span aria-hidden="true">/</span><span>{isPrivacy ? 'Privacy' : 'Terms'}</span></div>
        {isPrivacy ? <PrivacyPolicy /> : <Terms />}
      </article>
      <PublicFooter />
    </main>
  );
}
