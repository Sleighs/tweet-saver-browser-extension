import './About.css';

const About = () => (
  <div className="about-container">
    <h2>About X Post Saver</h2>
    <p>
      X Post Saver is a browser extension that helps you save posts from X (formerly Twitter).
      Save your favorite posts for later reading, reference, or sharing.
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
        href="https://ko-fi.com/yourusername" 
        target="_blank" 
        rel="noopener noreferrer"
        className="about-link donate-link"
      >
        <span>☕</span> Support the Project
      </a>
    </div>
  </div>
);

export default About; 