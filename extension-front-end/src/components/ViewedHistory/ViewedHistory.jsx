import { useState, useEffect } from 'react';
import './ViewedHistory.css';

const ViewedHistory = () => {
  const [viewedPosts, setViewedPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadViewedPosts = async () => {
      try {
        setIsLoading(true);
        // Get viewed posts from cookie
        const cookieValue = document.cookie
          .split('; ')
          .find(row => row.startsWith('xpostsaver--local-posts='));
        
        if (cookieValue) {
          const posts = JSON.parse(decodeURIComponent(cookieValue.split('=')[1]));
          // Sort by timestamp in descending order (most recent first)
          const sortedPosts = posts.sort((a, b) => b.timestamp - a.timestamp);
          setViewedPosts(sortedPosts);
        }
      } catch (err) {
        console.error('Error loading viewed posts:', err);
        setError('Failed to load viewed posts history');
      } finally {
        setIsLoading(false);
      }
    };

    loadViewedPosts();
  }, []);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (isLoading) {
    return <div className="viewed-history-loading">Loading viewed posts...</div>;
  }

  if (error) {
    return <div className="viewed-history-error">{error}</div>;
  }

  if (viewedPosts.length === 0) {
    return (
      <div className="viewed-history-empty">
        <p>No viewed posts yet</p>
        <p className="viewed-history-empty-subtitle">
          Posts you view will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="viewed-history">
      <div className="viewed-history-header">
        <h2>Recently Viewed Posts</h2>
        <span className="viewed-history-count">{viewedPosts.length} posts</span>
      </div>
      <div className="viewed-history-list">
        {viewedPosts.map((post, index) => (
          <div key={index} className="viewed-history-item">
            <div className="viewed-history-item-content">
              {post.text && (
                <p className="viewed-history-item-text">{post.text}</p>
              )}
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="viewed-history-item-link"
              >
                View Post
              </a>
              <span className="viewed-history-item-time">
                {formatTimestamp(post.timestamp)}
              </span>
            </div>
            {post.media && post.media.length > 0 && (
              <div className="viewed-history-item-media">
                {post.media.map((media, mediaIndex) => (
                  <img
                    key={mediaIndex}
                    src={media.url}
                    alt=""
                    className="viewed-history-item-image"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViewedHistory; 