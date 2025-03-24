import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './FeedArchive.css';

const FeedArchive = ({ settings }) => {
  const [archivedTweets, setArchivedTweets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadArchivedTweets = async () => {
      try {
        const result = await chrome.storage.local.get('archivedTweets');
        setArchivedTweets(JSON.parse(result.archivedTweets || '[]'));
      } catch (err) {
        console.error('Error loading archived tweets:', err);
        setError('Failed to load archived tweets');
      } finally {
        setIsLoading(false);
      }
    };

    loadArchivedTweets();
  }, []);

  if (isLoading) {
    return <div className="loading">Loading archived tweets...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="feed-archive">
      <div className="feed-archive-header">
        <h2>Feed Archive</h2>
        <div className="feed-archive-stats">
          <span>{archivedTweets.length} tweets archived</span>
        </div>
      </div>
      <div className="feed-archive-content">
        {archivedTweets.length === 0 ? (
          <div className="empty-state">
            <p>No archived tweets yet</p>
            <p className="help-text">Tweets will be archived as you scroll through your feed</p>
          </div>
        ) : (
          <div className="archived-tweets-list">
            {/* Tweet list implementation will go here */}
          </div>
        )}
      </div>
    </div>
  );
};

FeedArchive.propTypes = {
  settings: PropTypes.shape({
    enableFeedArchive: PropTypes.bool,
    archiveReplies: PropTypes.bool,
    archiveInterval: PropTypes.number
  })
};

export default FeedArchive;