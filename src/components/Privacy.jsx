export default function Privacy() {
  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px", fontFamily: "Lora, Georgia, serif", lineHeight: 1.7, color: "#2c1a08" }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.5rem", color: "#2D5A1A", marginBottom: "10px" }}>Privacy Policy</h1>
      <p style={{ color: "#8a7a50", marginBottom: "30px", fontSize: "0.95rem" }}>Last updated: July 2026</p>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "1.5rem", color: "#2D5A1A", marginBottom: "15px", borderBottom: "2px solid #e0c860", paddingBottom: "10px" }}>1. Overview</h2>
        <p>StoryClue.ai ("we," "us," "our") is committed to protecting your privacy and complying with all applicable laws, including the Children's Online Privacy Protection Act (COPPA) for users under 13.</p>
        <p>This Privacy Policy explains how we collect, use, and protect information when you use our website and services.</p>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "1.5rem", color: "#2D5A1A", marginBottom: "15px", borderBottom: "2px solid #e0c860", paddingBottom: "10px" }}>2. Information We Collect</h2>
        <h3 style={{ fontSize: "1.1rem", color: "#4a3a18", marginTop: "15px", marginBottom: "10px" }}>Account Information (Optional)</h3>
        <p>When you create an account, we collect:</p>
        <ul style={{ marginLeft: "20px", marginBottom: "15px" }}>
          <li>Email address</li>
          <li>Name (if provided)</li>
          <li>Password (hashed securely)</li>
        </ul>

        <h3 style={{ fontSize: "1.1rem", color: "#4a3a18", marginTop: "15px", marginBottom: "10px" }}>Puzzle Usage Data</h3>
        <ul style={{ marginLeft: "20px", marginBottom: "15px" }}>
          <li>Puzzles you generate (title, content, grade level, settings)</li>
          <li>Puzzle completion status and timing</li>
          <li>Feedback and ratings you submit</li>
          <li>Links you create and share</li>
        </ul>

        <h3 style={{ fontSize: "1.1rem", color: "#4a3a18", marginTop: "15px", marginBottom: "10px" }}>Automatically Collected Information</h3>
        <ul style={{ marginLeft: "20px", marginBottom: "15px" }}>
          <li><strong>Device & Browser:</strong> Device type, browser type, operating system</li>
          <li><strong>Usage Analytics:</strong> Pages visited, time on site, features used (via Google Analytics 4)</li>
          <li><strong>IP Address:</strong> For security and abuse prevention only</li>
          <li><strong>Cookies:</strong> Session cookies and audience preference cookies (90-day expiry)</li>
        </ul>

        <h3 style={{ fontSize: "1.1rem", color: "#4a3a18", marginTop: "15px", marginBottom: "10px" }}>Information NOT Collected</h3>
        <ul style={{ marginLeft: "20px", marginBottom: "15px" }}>
          <li>Location data</li>
          <li>Payment information (handled securely by Stripe when applicable)</li>
          <li>Biometric data</li>
          <li>Names or personal details of student users (unless parent/teacher provides them)</li>
        </ul>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "1.5rem", color: "#2D5A1A", marginBottom: "15px", borderBottom: "2px solid #e0c860", paddingBottom: "10px" }}>3. COPPA Compliance (Children Under 13)</h2>
        <p><strong>StoryClue.ai is designed for educational use in schools and homeschools.</strong></p>
        <p style={{ marginTop: "15px" }}>For users under 13:</p>
        <ul style={{ marginLeft: "20px", marginBottom: "15px" }}>
          <li><strong>No Direct Collection:</strong> We do not knowingly collect personal information directly from children under 13</li>
          <li><strong>School/Parent Authority:</strong> When used in schools or with parental involvement, account creation and data collection is managed by educators or parents</li>
          <li><strong>No Third-Party Sharing:</strong> We do not sell, rent, or share personal information with third parties</li>
          <li><strong>No Advertising:</strong> StoryClue contains no targeted ads, behavioral tracking, or marketing</li>
          <li><strong>Parental Access:</strong> Parents and guardians can request to review, update, or delete their child's data</li>
        </ul>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "1.5rem", color: "#2D5A1A", marginBottom: "15px", borderBottom: "2px solid #e0c860", paddingBottom: "10px" }}>4. How We Use Your Information</h2>
        <ul style={{ marginLeft: "20px" }}>
          <li><strong>Provide Services:</strong> Generate puzzles, save your work, share links</li>
          <li><strong>Improve StoryClue:</strong> Usage analytics to improve features and performance</li>
          <li><strong>Safety & Security:</strong> Prevent abuse, fraud, and unauthorized access</li>
          <li><strong>Communication:</strong> Service updates, support responses (if you contact us)</li>
          <li><strong>Legal Compliance:</strong> Comply with laws and court orders</li>
        </ul>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "1.5rem", color: "#2D5A1A", marginBottom: "15px", borderBottom: "2px solid #e0c860", paddingBottom: "10px" }}>5. Data Storage & Security</h2>
        <ul style={{ marginLeft: "20px", marginBottom: "15px" }}>
          <li><strong>Hosting:</strong> Data stored securely on Supabase (PostgreSQL) and Vercel</li>
          <li><strong>Encryption:</strong> Passwords hashed with industry-standard algorithms; data encrypted in transit (HTTPS)</li>
          <li><strong>Access Control:</strong> Limited access to data on a need-to-know basis</li>
          <li><strong>Backups:</strong> Regular automated backups for disaster recovery</li>
        </ul>
        <p style={{ marginTop: "15px", padding: "12px", background: "#fff8e8", border: "1px solid #e0c860", borderRadius: "6px" }}>While we implement strong security measures, no online system is 100% secure. We cannot guarantee absolute security of your information.</p>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "1.5rem", color: "#2D5A1A", marginBottom: "15px", borderBottom: "2px solid #e0c860", paddingBottom: "10px" }}>6. Third-Party Services</h2>
        <p>StoryClue uses the following third-party services:</p>

        <h3 style={{ fontSize: "1.1rem", color: "#4a3a18", marginTop: "15px", marginBottom: "10px" }}>Google Analytics 4</h3>
        <p style={{ marginLeft: "20px", marginBottom: "15px" }}>Collects anonymous usage data (pages visited, time on site). <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#3a6a1a", textDecoration: "none", fontWeight: "600" }}>Google Privacy Policy →</a></p>

        <h3 style={{ fontSize: "1.1rem", color: "#4a3a18", marginTop: "15px", marginBottom: "10px" }}>Anthropic Claude API</h3>
        <p style={{ marginLeft: "20px", marginBottom: "15px" }}>Processes puzzle content to generate clues. Text is not used for training. <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#3a6a1a", textDecoration: "none", fontWeight: "600" }}>Anthropic Privacy Policy →</a></p>

        <h3 style={{ fontSize: "1.1rem", color: "#4a3a18", marginTop: "15px", marginBottom: "10px" }}>Supabase (PostgreSQL Database)</h3>
        <p style={{ marginLeft: "20px", marginBottom: "15px" }}>Stores your puzzle data securely. <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#3a6a1a", textDecoration: "none", fontWeight: "600" }}>Supabase Privacy Policy →</a></p>

        <h3 style={{ fontSize: "1.1rem", color: "#4a3a18", marginTop: "15px", marginBottom: "10px" }}>Stripe (Payment Processing)</h3>
        <p style={{ marginLeft: "20px", marginBottom: "15px" }}>Handles subscription payments securely. We never see your payment details. <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#3a6a1a", textDecoration: "none", fontWeight: "600" }}>Stripe Privacy Policy →</a></p>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "1.5rem", color: "#2D5A1A", marginBottom: "15px", borderBottom: "2px solid #e0c860", paddingBottom: "10px" }}>7. Your Rights</h2>
        <p>You have the right to:</p>
        <ul style={{ marginLeft: "20px", marginBottom: "15px" }}>
          <li><strong>Access:</strong> Request a copy of your data</li>
          <li><strong>Correct:</strong> Update or correct inaccurate information</li>
          <li><strong>Delete:</strong> Request deletion of your account and data</li>
          <li><strong>Opt-Out:</strong> Opt out of analytics tracking (browser settings)</li>
        </ul>
        <p>To exercise these rights, contact us at <a href="mailto:privacy@storyclue.ai" style={{ color: "#3a6a1a", textDecoration: "none", fontWeight: "600" }}>privacy@storyclue.ai</a></p>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "1.5rem", color: "#2D5A1A", marginBottom: "15px", borderBottom: "2px solid #e0c860", paddingBottom: "10px" }}>8. Data Retention</h2>
        <ul style={{ marginLeft: "20px" }}>
          <li><strong>Active Accounts:</strong> Data retained while your account is active</li>
          <li><strong>Deleted Accounts:</strong> Data deleted within 30 days of account deletion request</li>
          <li><strong>Puzzles:</strong> Persist indefinitely (via shareable links) unless you delete them</li>
          <li><strong>Analytics:</strong> Aggregate usage data retained for up to 12 months</li>
        </ul>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "1.5rem", color: "#2D5A1A", marginBottom: "15px", borderBottom: "2px solid #e0c860", paddingBottom: "10px" }}>9. International Users</h2>
        <p>StoryClue is hosted in the United States. If you access StoryClue from outside the US, you understand that your information will be transferred to and processed in the US.</p>
        <p style={{ marginTop: "15px" }}><strong>GDPR Compliance (EU Users):</strong> We comply with GDPR requirements for EU users. You have the right to data portability and erasure.</p>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "1.5rem", color: "#2D5A1A", marginBottom: "15px", borderBottom: "2px solid #e0c860", paddingBottom: "10px" }}>10. Policy Changes</h2>
        <p>We may update this Privacy Policy from time to time. We'll notify users of material changes via email or through a prominent notice on our site. Your continued use of StoryClue after changes constitutes acceptance of the updated policy.</p>
      </section>

      <section style={{ marginBottom: "40px", padding: "20px", background: "#f4efe4", borderRadius: "8px", border: "1.5px solid #c8b888" }}>
        <h2 style={{ fontSize: "1.5rem", color: "#2D5A1A", marginBottom: "15px" }}>Questions or Concerns?</h2>
        <p>If you have questions about this Privacy Policy or our practices, please contact us:</p>
        <div style={{ marginTop: "15px", fontSize: "1rem" }}>
          <p><strong>Email:</strong> <a href="mailto:privacy@storyclue.ai" style={{ color: "#3a6a1a", textDecoration: "none", fontWeight: "600" }}>privacy@storyclue.ai</a></p>
          <p><strong>Website:</strong> <a href="https://storyclue.ai" style={{ color: "#3a6a1a", textDecoration: "none", fontWeight: "600" }}>storyclue.ai</a></p>
        </div>
        <p style={{ marginTop: "15px", fontSize: "0.9rem", color: "#8a7a50" }}>For COPPA-related inquiries, contact us within 30 days of becoming aware of any unauthorized collection of data from children under 13.</p>
      </section>

      <footer style={{ textAlign: "center", color: "#8a7a50", fontSize: "0.9rem", marginTop: "60px", paddingTop: "20px", borderTop: "1px solid #e0c860" }}>
        <p>© 2026 StoryClue.ai. All rights reserved. | <a href="/" style={{ color: "#3a6a1a", textDecoration: "none" }}>Home</a></p>
      </footer>
    </div>
  );
}
