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
        
        // Send message to content script to get recent posts
        const response = await chrome.tabs.query({ active: true, currentWindow: true });
        const tab = response[0];
        
        if (tab) {
          const posts = await chrome.tabs.sendMessage(tab.id, { 
            method: 'getRecentViewedPosts',
            limit: 50
          });
          
          if (posts) {
            setViewedPosts(posts);
          }
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
              <div className="viewed-history-item-header">
                <span className="viewed-history-item-username">{post.username}</span>
                <span className="viewed-history-item-time">
                  {formatTimestamp(post.timestamp)}
                </span>
              </div>
              {post.textPreview && (
                <p className="viewed-history-item-text">{post.textPreview}</p>
              )}
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="viewed-history-item-link"
              >
                View Post
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViewedHistory; 