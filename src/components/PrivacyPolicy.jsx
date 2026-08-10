export default function PrivacyPolicy() {
  return (
    <div style={container}>
      <div style={content}>
        <h1 style={heading}>Privacy Policy</h1>
        <p style={lastUpdated}>Last updated: July 25, 2026</p>

        <section style={section}>
          <h2 style={subheading}>1. Overview</h2>
          <p>StoryClue.ai ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.</p>
        </section>

        <section style={section}>
          <h2 style={subheading}>2. Information We Collect</h2>
          <p><strong>Student Users (K-12):</strong></p>
          <ul style={list}>
            <li>No personal information is required to create puzzles</li>
            <li>No student names, ages, or identifying details are stored</li>
            <li>Puzzles are stored by title, grade level, and content only</li>
            <li>Cookies: Anonymous 90-day audience preference cookie (grade/audience selection)</li>
          </ul>
          <p><strong>Teachers and Account Holders:</strong></p>
          <ul style={list}>
            <li>Email address (when you create an account — future feature)</li>
            <li>Grade level and subject areas of interest</li>
            <li>Puzzle history and usage statistics</li>
          </ul>
          <p><strong>Usage Analytics:</strong></p>
          <ul style={list}>
            <li>Google Analytics 4 (measurement ID: G-7K5D2X9XW6)</li>
            <li>Page views, puzzle generation counts, feature usage</li>
            <li>Anonymous — no student names or personal details are sent</li>
          </ul>
        </section>

        <section style={section}>
          <h2 style={subheading}>3. How We Use Your Information</h2>
          <ul style={list}>
            <li>Generate crossword puzzles based on content you provide</li>
            <li>Improve the service through analytics and user feedback</li>
            <li>Respond to support requests</li>
            <li>Comply with legal obligations</li>
            <li>We do NOT share student data with third parties</li>
          </ul>
        </section>

        <section style={section}>
          <h2 style={subheading}>4. Third-Party Services</h2>
          <ul style={list}>
            <li><strong>Vercel:</strong> Cloud hosting platform</li>
            <li><strong>Anthropic API:</strong> Claude AI for puzzle generation</li>
            <li><strong>Google Analytics 4:</strong> Anonymous usage analytics</li>
            <li><strong>Wikimedia Commons:</strong> Images for crossword puzzles</li>
            <li><strong>Web Speech API:</strong> Browser-based text-to-speech (no data sent to our servers)</li>
          </ul>
          <p>These services have their own privacy policies. We recommend reviewing them.</p>
        </section>

        <section style={section}>
          <h2 style={subheading}>5. COPPA Compliance (Children's Online Privacy)</h2>
          <p>StoryClue.ai is designed for use by teachers and parents with children ages 5-18. We comply with the Children's Online Privacy Protection Act (COPPA):</p>
          <ul style={list}>
            <li>We do not collect personal information from children under 13 without verifiable parental consent</li>
            <li>No email, phone, or name fields are required for puzzle generation</li>
            <li>No marketing or targeted advertising to children</li>
            <li>Parents/teachers can request deletion of puzzle history at any time</li>
          </ul>
        </section>

        <section style={section}>
          <h2 style={subheading}>6. Content Safety</h2>
          <p>Every input (book title, pasted text, YouTube URL) is screened for inappropriate content before puzzle generation. Content that is flagged for:</p>
          <ul style={list}>
            <li>Self-harm, suicide, bullying</li>
            <li>Sexual content or adult material</li>
            <li>Drug references or substance abuse</li>
            <li>Political extremism or hate speech</li>
            <li>Grade-inappropriate material</li>
          </ul>
          <p>Biblical and religious content is never blocked based on keywords — we evaluate educational and redemptive intent. All standard Biblical narratives are approved for classroom use when faith tradition is selected.</p>
        </section>

        <section style={section}>
          <h2 style={subheading}>7. Data Retention</h2>
          <ul style={list}>
            <li>Puzzles are stored indefinitely unless you request deletion</li>
            <li>Audience preference cookie expires after 90 days</li>
            <li>Analytics data is retained for 14 months (Google Analytics default)</li>
            <li>You may request deletion of your puzzle history at any time</li>
          </ul>
        </section>

        <section style={section}>
          <h2 style={subheading}>8. Security</h2>
          <p>We use industry-standard security measures including:</p>
          <ul style={list}>
            <li>HTTPS encryption for all communications</li>
            <li>CSRF token protection on forms</li>
            <li>Rate limiting to prevent abuse</li>
            <li>Teacher URLs use random tokens (not guessable parameters)</li>
          </ul>
        </section>

        <section style={section}>
          <h2 style={subheading}>9. Your Rights</h2>
          <p>You may:</p>
          <ul style={list}>
            <li>Request a copy of your puzzle history</li>
            <li>Request deletion of any stored puzzle</li>
            <li>Opt out of analytics by disabling cookies</li>
            <li>Change your audience preference at any time</li>
          </ul>
          <p>To make a request, contact: <a href="mailto:support@storyclue.ai" style={link}>support@storyclue.ai</a></p>
        </section>

        <section style={section}>
          <h2 style={subheading}>10. Contact Us</h2>
          <p>If you have questions about this Privacy Policy or our privacy practices, please contact:</p>
          <p style={{ fontWeight: 500 }}>
            StoryClue.ai<br />
            Email: <a href="mailto:support@storyclue.ai" style={link}>support@storyclue.ai</a><br />
          </p>
        </section>

        <section style={section}>
          <h2 style={subheading}>11. Policy Changes</h2>
          <p>We may update this Privacy Policy from time to time. We will notify users of significant changes by updating the "Last updated" date at the top of this page. Your continued use of StoryClue.ai constitutes acceptance of the updated policy.</p>
        </section>
      </div>
    </div>
  );
}

const container = {
  background: "#FDFAF4",
  minHeight: "100vh",
  padding: "2rem 1rem",
  fontFamily: "Lora, Georgia, serif",
};

const content = {
  maxWidth: "800px",
  margin: "0 auto",
  color: "#333",
  lineHeight: 1.8,
};

const heading = {
  fontSize: "2.5rem",
  color: "#2D5A1A",
  marginBottom: "0.5rem",
  textAlign: "center",
};

const lastUpdated = {
  textAlign: "center",
  color: "#888",
  fontSize: "0.95rem",
  marginBottom: "2rem",
};

const section = {
  marginBottom: "2rem",
};

const subheading = {
  fontSize: "1.3rem",
  color: "#2D5A1A",
  marginBottom: "1rem",
  marginTop: "1.5rem",
};

const list = {
  marginLeft: "1.5rem",
  marginBottom: "1rem",
};

const link = {
  color: "#c0900a",
  textDecoration: "none",
  fontWeight: 500,
};
