import './About.css';
import { useState } from 'react';

const About = () => {
  const [copied, setCopied] = useState(false);
  const [clicked, setClicked] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('swrightdev@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailClick = () => {
    setClicked(true);
    // Reset after 2 seconds
    setTimeout(() => setClicked(false), 10000);  
  };

  return (
    <div className="about-container">
      <h2>About X Post Saver</h2>
      <p>
        X Post Saver exists to help you save posts from X (formerly Twitter) for later reading, reference, or sharing. It was created as a simple, lightweight way of bookmarking for X users who want to return to prior feeds and those browsing between multiple accounts.
      </p>
      {/* <p>
        I hope this extension makes it easier for you to save tweets and access them later.
      </p> */}
      <p>
        For any questions, feedback, or issues, please reach out to{' '}
        <a 
          href="mailto:swrightdev@gmail.com"
          className={`email-link ${clicked ? 'clicked' : ''}`}
          onClick={handleEmailClick}
        >
          swrightdev@gmail.com
        </a>
        <button 
          className={`copy-email-button ${copied ? 'copied' : ''}`} 
          onClick={handleCopyEmail}
          title="Copy email address"
        >
          {copied ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          )}
        </button>
      </p>
      <div className="about-links">
        <a 
          href="https://github.com/sleighs/tweet-saver-browser-extension" 
          target="_blank" 
          rel="noopener noreferrer"
          className="about-link"
        >
          <span>🔗</span> GitHub Repository
        </a>
        <a 
          href="https://buymeacoffee.com/sleighs" 
          target="_blank" 
          rel="noopener noreferrer"
          className="about-link donate-link"
        >
          <span>☕</span> Support the Project
        </a>
      </div>
    </div>
  );
};

export default About;