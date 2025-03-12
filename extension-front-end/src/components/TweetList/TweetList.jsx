import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import TweetCard from '../TweetCard/TweetCard';
import './TweetList.css';

const TweetList = ({ tweets, onDeleteTweet }) => {
  const [sortBy, setSortBy] = useState('savedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState('');

  // Get unique users from tweets
  const users = useMemo(() => {
    const uniqueUsers = new Set(tweets.map(tweet => tweet.username));
    return Array.from(uniqueUsers).sort();
  }, [tweets]);

  // Helper function to safely get numeric values
  const getNumericValue = (value) => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    return parseInt(String(value).replace(/,/g, '')) || 0;
  };

  // Filter and sort tweets
  const filteredAndSortedTweets = useMemo(() => {
    return tweets
      .filter(tweet => {
        // Filter by type
        if (filterType === 'media' && (!tweet.mediaItems || tweet.mediaItems.length === 0)) {
          return false;
        }
        if (filterType === 'text' && (!tweet.text || tweet.text.length === 0)) {
          return false;
        }

        // Filter by user
        if (selectedUser && tweet.username !== selectedUser) {
          return false;
        }

        // Filter by search query
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          return (
            tweet.text?.toLowerCase().includes(searchLower) ||
            tweet.username.toLowerCase().includes(searchLower) ||
            tweet.handle.toLowerCase().includes(searchLower)
          );
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'savedAt':
            comparison = new Date(b.savedAt) - new Date(a.savedAt);
            break;
          case 'likes':
            comparison = getNumericValue(b.likes) - getNumericValue(a.likes);
            break;
          case 'retweets':
            comparison = getNumericValue(b.retweets) - getNumericValue(a.retweets);
            break;
          case 'username':
            comparison = a.username.localeCompare(b.username);
            break;
          default:
            comparison = 0;
        }
        return sortOrder === 'desc' ? comparison : -comparison;
      });
  }, [tweets, sortBy, sortOrder, filterType, searchQuery, selectedUser]);

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  return (
    <div className="tweet-list-container">
      <div className="tweet-list-controls">
        <div className="search-and-filter">
          <input
            type="text"
            placeholder="Search tweets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Tweets</option>
            <option value="media">Media Only</option>
            <option value="text">Text Only</option>
          </select>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="user-select"
          >
            <option value="">All Users</option>
            {users.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
        </div>
        <div className="sort-controls">
          <button
            className={`sort-button ${sortBy === 'savedAt' ? 'active' : ''}`}
            onClick={() => handleSortChange('savedAt')}
          >
            Date {sortBy === 'savedAt' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
          <button
            className={`sort-button ${sortBy === 'likes' ? 'active' : ''}`}
            onClick={() => handleSortChange('likes')}
          >
            Likes {sortBy === 'likes' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
          <button
            className={`sort-button ${sortBy === 'retweets' ? 'active' : ''}`}
            onClick={() => handleSortChange('retweets')}
          >
            Retweets {sortBy === 'retweets' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
          <button
            className={`sort-button ${sortBy === 'username' ? 'active' : ''}`}
            onClick={() => handleSortChange('username')}
          >
            User {sortBy === 'username' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
        </div>
      </div>

      <div className="tweets-stats">
        Showing {filteredAndSortedTweets.length} of {tweets.length} tweets
      </div>

      <div className="tweet-list">
        {filteredAndSortedTweets.length > 0 ? (
          filteredAndSortedTweets.map((tweet) => (
            <TweetCard
              key={tweet.url}
              tweet={tweet}
              onDelete={onDeleteTweet}
            />
          ))
        ) : (
          <div className="no-tweets-message">
            {tweets.length === 0 ? (
              "No tweets saved yet. Save some tweets to see them here!"
            ) : (
              "No tweets match your current filters."
            )}
          </div>
        )}
      </div>
    </div>
  );
};

TweetList.propTypes = {
  tweets: PropTypes.arrayOf(PropTypes.shape({
    url: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    handle: PropTypes.string.isRequired,
    text: PropTypes.string,
    mediaItems: PropTypes.array,
    savedAt: PropTypes.string.isRequired,
    likes: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    retweets: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  })).isRequired,
  onDeleteTweet: PropTypes.func.isRequired
};

export default TweetList; 