import { useEffect } from "react";
import { Link } from "react-router-dom";

const S = {
  page: {
    minHeight: "100vh",
    background: "#faf8f4",
    fontFamily: "Lora, Georgia, serif",
    color: "#2c2c2c",
    padding: "0 0 80px",
  },
  header: {
    background: "#1a3a2a",
    color: "#fff",
    padding: "28px 24px 24px",
    textAlign: "center",
  },
  logo: {
    fontSize: "22px",
    fontWeight: "700",
    letterSpacing: "0.5px",
    marginBottom: "4px",
  },
  subtitle: {
    fontSize: "13px",
    opacity: 0.75,
    fontFamily: "system-ui, sans-serif",
  },
  wrap: {
    maxWidth: "760px",
    margin: "0 auto",
    padding: "40px 24px 0",
  },
  h1: {
    fontSize: "28px",
    fontWeight: "700",
    marginBottom: "6px",
    color: "#1a3a2a",
  },
  effective: {
    fontSize: "13px",
    color: "#888",
    fontFamily: "system-ui, sans-serif",
    marginBottom: "36px",
  },
  section: {
    marginBottom: "36px",
  },
  h2: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#1a3a2a",
    marginBottom: "10px",
    paddingBottom: "6px",
    borderBottom: "1px solid #ddd",
  },
  p: {
    fontSize: "15px",
    lineHeight: "1.75",
    marginBottom: "12px",
    color: "#333",
  },
  ul: {
    paddingLeft: "22px",
    margin: "8px 0 12px",
  },
  li: {
    fontSize: "15px",
    lineHeight: "1.7",
    color: "#333",
    marginBottom: "6px",
  },
  highlight: {
    background: "#f0f7ee",
    border: "1px solid #c5dfc0",
    borderRadius: "6px",
    padding: "14px 18px",
    marginBottom: "16px",
    fontSize: "14px",
    lineHeight: "1.7",
    color: "#2a4a2a",
    fontFamily: "system-ui, sans-serif",
  },
  backLink: {
    display: "inline-block",
    marginTop: "32px",
    fontSize: "14px",
    color: "#1a3a2a",
    textDecoration: "none",
    fontFamily: "system-ui, sans-serif",
    borderBottom: "1px solid #1a3a2a",
  },
  contact: {
    background: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    padding: "18px 22px",
    marginTop: "8px",
    fontSize: "14px",
    lineHeight: "1.8",
    fontFamily: "system-ui, sans-serif",
    color: "#444",
  },
};

export default function TermsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Terms of Service — StoryClue.ai";
  }, []);

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.logo}>📖 StoryClue.ai</div>
        <div style={S.subtitle}>AI-Generated Educational Crossword Puzzles</div>
      </div>

      <div style={S.wrap}>
        <h1 style={S.h1}>Terms of Service</h1>
        <p style={S.effective}>Effective Date: June 4, 2026 &nbsp;·&nbsp; Last Updated: June 4, 2026</p>

        <div style={S.highlight}>
          Please read these Terms of Service carefully before using StoryClue.ai. By creating an account
          or generating a puzzle, you agree to be bound by these terms.
        </div>

        {/* 1 */}
        <div style={S.section}>
          <h2 style={S.h2}>1. About StoryClue.ai</h2>
          <p style={S.p}>
            StoryClue.ai ("StoryClue," "we," "our," or "us") is an AI-powered educational crossword
            puzzle generator operated by Bob Buckmaster as a sole proprietorship. The Service is
            designed for homeschool families, classroom teachers, Sunday school educators, and
            independent learners of all ages.
          </p>
          <p style={S.p}>
            Our mailing address and contact information are provided in Section 14 below.
          </p>
        </div>

        {/* 2 */}
        <div style={S.section}>
          <h2 style={S.h2}>2. Acceptance of Terms</h2>
          <p style={S.p}>
            By accessing or using StoryClue.ai — including browsing the website, creating an account,
            or generating a puzzle — you agree to these Terms of Service and our Privacy Policy.
            If you do not agree, do not use the Service.
          </p>
          <p style={S.p}>
            If you are using StoryClue on behalf of a school, co-op, or organization, you represent
            that you have authority to bind that organization to these terms.
          </p>
        </div>

        {/* 3 */}
        <div style={S.section}>
          <h2 style={S.h2}>3. Age Requirements and Children's Accounts</h2>
          <p style={S.p}>
            You must be at least 13 years old to create a StoryClue account. Children under 13 may
            use StoryClue only under direct parent or guardian supervision, using a parent's account.
          </p>
          <p style={S.p}>
            StoryClue does not knowingly collect personal information from children under 13 without
            verifiable parental consent in accordance with the Children's Online Privacy Protection
            Act (COPPA). Child profile names entered on the Family Dashboard are stored only to
            personalize the experience and are never shared with third parties.
          </p>
          <p style={S.p}>
            If you believe a child under 13 has created an account without parental consent, please
            contact us immediately at the address in Section 14 and we will promptly delete the account.
          </p>
        </div>

        {/* 4 */}
        <div style={S.section}>
          <h2 style={S.h2}>4. Content Scope and Editorial Discretion</h2>
          <p style={S.p}>
            StoryClue generates educational crossword puzzles aligned with traditional academic
            curriculum standards. Our content library is designed for family and classroom settings
            rooted in traditional American educational values.
          </p>
          <p style={S.p}>
            StoryClue reserves the right, at its sole discretion, to decline to generate content on
            any topic that falls outside the scope of our educational content library. A declined
            request does not constitute a judgment about the user — it reflects the defined scope
            of our product.
          </p>
          <p style={S.p}>
            Content that is always available includes: Biblical and scriptural narratives of all
            recognized faith traditions, classic literature, world history, science, geography,
            American history, patriotic content, and standard K-12 academic subjects.
          </p>
        </div>

        {/* 5 */}
        <div style={S.section}>
          <h2 style={S.h2}>5. AI-Generated Content Disclaimer</h2>
          <p style={S.p}>
            Crossword puzzles, clues, and vocabulary words on StoryClue are generated by artificial
            intelligence. While we make reasonable efforts to ensure accuracy and grade-appropriateness,
            AI-generated content may occasionally contain errors, inaccuracies, or content that
            requires review before classroom use.
          </p>
          <p style={S.p}>
            StoryClue makes no warranty that AI-generated content is factually accurate, complete,
            or free of error. We recommend that educators review generated puzzles before distributing
            them to students. StoryClue is not liable for any errors in AI-generated content.
          </p>
          <p style={S.p}>
            Spanish-language content includes the additional disclaimer: AI-generated Spanish content
            may contain translation errors. We recommend review by a fluent Spanish speaker for
            formal classroom use.
          </p>
        </div>

        {/* 6 */}
        <div style={S.section}>
          <h2 style={S.h2}>6. User Accounts</h2>
          <p style={S.p}>
            You are responsible for maintaining the confidentiality of your account credentials and
            for all activity that occurs under your account. Notify us immediately at the address
            in Section 14 if you suspect unauthorized use of your account.
          </p>
          <p style={S.p}>
            You may not share your account with others or use another person's account without
            their permission. Each paid subscription is for a single family, classroom, or co-op
            as defined by the plan you have selected.
          </p>
        </div>

        {/* 7 */}
        <div style={S.section}>
          <h2 style={S.h2}>7. Subscriptions and Billing</h2>
          <p style={S.p}>
            StoryClue offers free and paid subscription tiers. Paid subscriptions are billed monthly
            through Stripe, our payment processor. By subscribing, you authorize recurring monthly
            charges to your payment method until you cancel.
          </p>
          <ul style={S.ul}>
            <li style={S.li}><strong>Free Plan:</strong> 3 puzzles per month, watermarked.</li>
            <li style={S.li}><strong>Homeschool Plan ($7.99/month):</strong> Unlimited puzzles for one family.</li>
            <li style={S.li}><strong>Teacher Plan ($12.99/month):</strong> Unlimited puzzles, bulk print, answer key.</li>
            <li style={S.li}><strong>Co-op Plan ($34.99/month):</strong> Up to 50 family accounts.</li>
          </ul>
          <p style={S.p}>
            You may cancel your subscription at any time from your account settings. Cancellation
            takes effect at the end of the current billing period. We do not offer prorated refunds
            for partial months, except where required by applicable law.
          </p>
          <p style={S.p}>
            We reserve the right to change subscription prices with 30 days' notice to your
            registered email address. Continued use after the price change takes effect constitutes
            acceptance of the new pricing.
          </p>
        </div>

        {/* 8 */}
        <div style={S.section}>
          <h2 style={S.h2}>8. Voice Recording Feature</h2>
          <p style={S.p}>
            Premium subscribers may use the Parent Voice feature, which uses ElevenLabs voice
            cloning technology to create a personalized voice for puzzle narration. By recording
            your voice through this feature, you acknowledge and agree that:
          </p>
          <ul style={S.ul}>
            <li style={S.li}>
              Your voice sample is transmitted securely to ElevenLabs, Inc. for processing.
              StoryClue does not retain the raw voice recording on its own servers.
            </li>
            <li style={S.li}>
              A voice profile ("voice ID") is created and stored in your account. This voice ID
              can only be used to generate audio through StoryClue's servers using our private
              API key — it cannot be extracted or used independently.
            </li>
            <li style={S.li}>
              You may delete your voice profile at any time from your account settings, which
              will permanently delete it from both StoryClue and ElevenLabs.
            </li>
            <li style={S.li}>
              You represent that you are recording your own voice and have the right to use it
              in this manner. Do not record another person's voice without their explicit consent.
            </li>
            <li style={S.li}>
              ElevenLabs' use of your voice data is subject to ElevenLabs' own Terms of Service
              and Privacy Policy at elevenlabs.io.
            </li>
          </ul>
        </div>

        {/* 9 */}
        <div style={S.section}>
          <h2 style={S.h2}>9. Intellectual Property</h2>
          <p style={S.p}>
            The StoryClue platform, interface, branding, and original content are owned by
            Bob Buckmaster and protected by applicable intellectual property laws.
          </p>
          <p style={S.p}>
            Puzzles you generate using StoryClue are yours to use for personal, homeschool, or
            classroom educational purposes. You may print, share, and distribute puzzles you
            generate at no additional charge, provided they are used for non-commercial educational
            purposes and the StoryClue watermark is not removed from free-tier puzzles.
          </p>
          <p style={S.p}>
            You may not resell, sublicense, or use StoryClue-generated content for commercial
            curriculum products without a written license agreement from StoryClue.
          </p>
          <p style={S.p}>
            When you submit content (book titles, pasted text, URLs) to generate a puzzle, you
            represent that you have the right to submit that content and that doing so does not
            violate any third party's intellectual property rights. StoryClue does not reproduce
            or store extended copyrighted text — only vocabulary words and short clues derived
            from your input.
          </p>
        </div>

        {/* 10 */}
        <div style={S.section}>
          <h2 style={S.h2}>10. Prohibited Uses</h2>
          <p style={S.p}>You agree not to use StoryClue to:</p>
          <ul style={S.ul}>
            <li style={S.li}>Attempt to generate content that violates our content safety standards</li>
            <li style={S.li}>Probe, test, or reverse-engineer the content safety filter</li>
            <li style={S.li}>Use automated tools or bots to generate puzzles in bulk</li>
            <li style={S.li}>Share your account credentials with others outside your plan type</li>
            <li style={S.li}>Use the Service for any unlawful purpose</li>
            <li style={S.li}>Attempt to access another user's account or data</li>
            <li style={S.li}>Circumvent any rate limits or access controls</li>
          </ul>
        </div>

        {/* 11 */}
        <div style={S.section}>
          <h2 style={S.h2}>11. Disclaimer of Warranties</h2>
          <p style={S.p}>
            StoryClue is provided "as is" and "as available" without warranties of any kind,
            express or implied. We do not warrant that the Service will be uninterrupted,
            error-free, or that generated content will be accurate, complete, or suitable for
            any particular educational purpose.
          </p>
          <p style={S.p}>
            We reserve the right to modify, suspend, or discontinue any feature of StoryClue
            at any time with or without notice.
          </p>
        </div>

        {/* 12 */}
        <div style={S.section}>
          <h2 style={S.h2}>12. Limitation of Liability</h2>
          <p style={S.p}>
            To the fullest extent permitted by applicable law, StoryClue and its owner shall not
            be liable for any indirect, incidental, special, consequential, or punitive damages
            arising from your use of or inability to use the Service, even if advised of the
            possibility of such damages.
          </p>
          <p style={S.p}>
            Our total liability to you for any claim arising from your use of StoryClue shall not
            exceed the amount you paid to StoryClue in the twelve months preceding the claim.
          </p>
        </div>

        {/* 13 */}
        <div style={S.section}>
          <h2 style={S.h2}>13. Changes to These Terms</h2>
          <p style={S.p}>
            We may update these Terms of Service from time to time. If we make material changes,
            we will notify you by email to your registered address and/or by a prominent notice
            on the StoryClue website at least 14 days before the changes take effect.
          </p>
          <p style={S.p}>
            Your continued use of StoryClue after the effective date of revised terms constitutes
            your acceptance of the changes. If you do not agree to the updated terms, you must
            stop using the Service.
          </p>
        </div>

        {/* 14 */}
        <div style={S.section}>
          <h2 style={S.h2}>14. Governing Law and Contact</h2>
          <p style={S.p}>
            These Terms are governed by the laws of the State of Florida, without regard to
            conflict of law principles. Any dispute arising from these Terms shall be resolved
            in the state or federal courts located in St. Johns County, Florida.
          </p>
          <p style={S.p}>For questions, concerns, or account deletion requests, contact us:</p>
          <div style={S.contact}>
            <strong>StoryClue.ai</strong><br />
            Operated by Bob Buckmaster<br />
            St. Augustine, Florida<br />
            Email: <a href="mailto:support@storyclue.ai" style={{ color: "#1a3a2a" }}>support@storyclue.ai</a><br />
            Website: <a href="https://storyclue.ai" style={{ color: "#1a3a2a" }}>storyclue.ai</a>
          </div>
        </div>

        <Link to="/" style={S.backLink}>← Back to StoryClue</Link>
      </div>
    </div>
  );
}
