import { useState } from 'react';
import PropTypes from 'prop-types';
import './TweetCard.css';

const TweetCard = ({ tweet, onDelete, onRefresh, settings }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await onRefresh?.(tweet);
    } catch (error) {
      console.error('Error refreshing tweet:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = async (tweet) => {
    try {
      // Send message to content script to update button state
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.url?.includes('x.com')) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'TWEET_DELETED',
          url: tweet.url
        }).catch(() => {
          // Ignore errors for inactive tabs
        });
      }
      await onDelete(tweet);
    } catch (error) {
      console.error('Error deleting tweet:', error);
    }
  };

  const {
    username,
    handle,
    text,
    time,
    mediaItems,
    profileImageUrl,
    url,
    likes,
    retweets,
    replies,
    views,
    savedAt,
    storageType
  } = tweet;

  const formatNumber = (num) => {
    if (!num) return '0';
    // If it's already a number, convert it to string
    const numStr = typeof num === 'number' ? num.toString() : num;
    // Now safely parse the string
    const n = parseInt(numStr.replace(/,/g, ''));
    if (isNaN(n)) return '0';
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  const formatDate = (dateString) => {
    // Try to parse the date string
    const date = new Date(dateString);
    
    // If the date is invalid, return the original string (might be a relative time like "1m")
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    // If less than 24 hours ago, show relative time
    if (diffDays < 1) {
      if (diffMins < 60) return `${diffMins}m`;
      return `${diffHours}h`;
    }
    // If this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
    // If different year, include the year
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFullDate = (dateString) => {
    // Try to parse the date string
    const date = new Date(dateString);
    
    // If the date is invalid, return the original string
    if (isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const DeleteIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const RefreshIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4V9H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 20V15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L4 9M19.95 15L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const ExternalLinkIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 3H21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  // Add new icon components for storage types
  const LocalStorageIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="storage-icon">
      <path d="M4 4C4 3.44772 4.44772 3 5 3H19C19.5523 3 20 3.44772 20 4V20C20 20.5523 19.5523 21 19 21H5C4.44772 21 4 20.5523 4 20V4Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M8 7H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  const SyncStorageIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="storage-icon">
      <path d="M4 12C4 7.58172 7.58172 4 12 4C15.3 4 18.1 5.9 19.3 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 12C20 16.4183 16.4183 20 12 20C8.7 20 5.9 18.1 4.7 15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 3V9H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 15V21H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  // Add CSS for the storage indicator
  const storageIndicatorStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    marginLeft: 'auto',
    padding: '2px 6px',
    borderRadius: '12px',
    background: 'var(--background-secondary)',
  };

  return (
    <div className="tweet-card">
      <div className="tweet-card-header">
        <div className="tweet-user-info">
          {profileImageUrl && (
            <img 
              src={profileImageUrl} 
              alt={username} 
              className="tweet-profile-image"
            />
          )}
          <div className="tweet-user-text">
            <span className="tweet-username">{username}</span>
            <span className="tweet-handle">{handle}</span>
          </div>
        </div>
        <div className="tweet-actions">
          {/* Only render the storage indicator if showStorageIndicator is true */}
          {settings?.showStorageIndicator && (
            <div 
              style={storageIndicatorStyle}
              title={`Saved ${storageType === 'sync' ? 'across all browsers' : 'locally'}`}
            >
              {storageType === 'sync' ? <SyncStorageIcon /> : <LocalStorageIcon />}
              {storageType === 'sync' ? 'Synced' : 'Local'}
            </div>
          )}
          <button 
            className="tweet-action-button primary"
            onClick={() => window.open(url, '_blank')}
            title="View on Twitter"
          >
            <ExternalLinkIcon />
            View
          </button>
          {/* <button 
            className={`tweet-action-button refresh ${isRefreshing ? 'loading' : ''}`}
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh tweet data"
          >
            <RefreshIcon />
            {isRefreshing ? 'Updating' : 'Update'}
          </button> */}
          <button 
            onClick={() => handleDelete(tweet)} 
            className="delete-button"
            title="Delete tweet"
          >
            <DeleteIcon />
          </button>
        </div>
      </div>

      <div className="tweet-content">
        {text && <p className="tweet-text">{text}</p>}
        
        {mediaItems && mediaItems.length > 0 && (
          <div className={`tweet-media-grid media-count-${mediaItems.length}`}>
            {mediaItems.map((media, index) => (
              <div key={index} className="tweet-media-item">
                {media.type === 'image' ? (
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <img 
                      //onClick={() => window.open(media.originalUrl, '_blank')}
                      src={media.url} 
                      alt={media.alt || 'Tweet image'} 
                      loading="lazy"
                    />
                  </a>
                ) : (
                  <div className="tweet-video-container">
                    <img 
                      src={media.thumbnailUrl} 
                      alt={media.alt || 'Video thumbnail'} 
                      className="video-thumbnail"
                      onClick={() => window.open(url, '_blank')}
                    />
                    <div className="video-play-button">▶</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="tweet-footer">
        <div className="tweet-metrics">
          <span title="Replies">💬 {formatNumber(replies)}</span>
          <span title="Retweets">🔄 {formatNumber(retweets)}</span>
          <span title="Likes">❤️ {formatNumber(likes)}</span>
          {views && <span title="Views">👁️ {formatNumber(views)}</span>}
        </div>
        <div className="tweet-time">
          <span title={`Tweet time: ${formatFullDate(time)}\nSaved: ${formatFullDate(savedAt)}`}>
            {formatDate(time)} · Saved {formatDate(savedAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

TweetCard.propTypes = {
  tweet: PropTypes.shape({
    username: PropTypes.string.isRequired,
    handle: PropTypes.string.isRequired,
    text: PropTypes.string,
    time: PropTypes.string,
    mediaItems: PropTypes.arrayOf(PropTypes.shape({
      type: PropTypes.oneOf(['image', 'video']),
      url: PropTypes.string,
      thumbnailUrl: PropTypes.string,
      originalUrl: PropTypes.string,
      alt: PropTypes.string
    })),
    profileImageUrl: PropTypes.string,
    url: PropTypes.string.isRequired,
    likes: PropTypes.string,
    retweets: PropTypes.string,
    replies: PropTypes.string,
    views: PropTypes.string,
    savedAt: PropTypes.string,
    storageType: PropTypes.oneOf(['local', 'sync']).isRequired
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  onRefresh: PropTypes.func,
  settings: PropTypes.shape({
    showStorageIndicator: PropTypes.bool
  })
};

export default TweetCard; 