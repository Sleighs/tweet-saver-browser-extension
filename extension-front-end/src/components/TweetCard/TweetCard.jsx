import PropTypes from 'prop-types';
import './TweetCard.css';

const TweetCard = ({ tweet, onDelete }) => {
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
    savedAt
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <span className="tweet-handle">@{handle}</span>
          </div>
        </div>
        <div className="tweet-actions">
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="view-on-twitter"
          >
            View on Twitter
          </a>
          <button 
            onClick={() => onDelete(tweet)} 
            className="delete-tweet"
            title="Delete tweet"
          >
            ×
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
                    href={media.originalUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <img 
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
          <span title={`Tweet time: ${time}\nSaved: ${formatDate(savedAt)}`}>
            {time}
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
    savedAt: PropTypes.string
  }).isRequired,
  onDelete: PropTypes.func.isRequired
};

export default TweetCard; 