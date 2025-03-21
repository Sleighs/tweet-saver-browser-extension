import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import TweetCard from '../TweetCard/TweetCard';
import './TweetList.css';

const TweetList = ({ tweets, onDeleteTweet, onRefresh }) => {
  const [sortBy, setSortBy] = useState('savedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get unique users from tweets
  const users = useMemo(() => {
    const uniqueUsers = new Set(tweets.map(tweet => tweet.username));
    return Array.from(uniqueUsers).sort();
  }, [tweets]);

  // Helper function to safely get numeric values
  const getNumericValue = (value) => {
    // Handle null, undefined, or empty string
    if (!value && value !== 0) return 0;
    
    // If it's already a number, return it
    if (typeof value === 'number') return value;
    
    // Convert to string and clean it
    const str = String(value).toLowerCase().trim();
    
    try {
      // Handle K/M/B suffixes
      if (str.endsWith('k')) {
        return parseFloat(str.replace('k', '')) * 1000;
      }
      if (str.endsWith('m')) {
        return parseFloat(str.replace('m', '')) * 1000000;
      }
      if (str.endsWith('b')) {
        return parseFloat(str.replace('b', '')) * 1000000000;
      }
      
      // Remove commas and parse
      return parseInt(str.replace(/,/g, '')) || 0;
    } catch {
      return 0;
    }
  };

  // Helper function to safely compare numeric values
  const compareNumeric = (a, b) => {
    const numA = getNumericValue(a);
    const numB = getNumericValue(b);
    return numB - numA; // Default to descending order
  };

  // Helper function to safely compare dates
  const compareDates = (a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    
    // If either date is invalid, treat it as the oldest possible date
    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;
    
    return dateB - dateA;
  };

  // Filter and sort tweets
  const filteredAndSortedTweets = useMemo(() => {
    return [...tweets] // Create a new array to avoid mutating the original
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
            comparison = compareDates(a.savedAt, b.savedAt);
            break;
          case 'tweetDate':
            comparison = compareDates(a.time, b.time);
            break;
          case 'likes':
            comparison = compareNumeric(a.likes, b.likes);
            break;
          case 'retweets':
            comparison = compareNumeric(a.retweets, b.retweets);
            break;
          case 'views':
            comparison = compareNumeric(a.views, b.views);
            break;
          case 'username':
            comparison = a.username.localeCompare(b.username);
            break;
          default:
            comparison = compareDates(a.savedAt, b.savedAt); // Default to savedAt
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

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await onRefresh();
    } catch (err) {
      console.error('Error refreshing tweets:', err);
    } finally {
      setIsRefreshing(false);
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
          <button 
            className={`refresh-button ${isRefreshing ? 'refreshing' : ''}`}
            onClick={handleRefresh}
            title="Refresh tweets"
          >
            {isRefreshing ? '⟳' : '↻'}
          </button>
        </div>
        <div className="sort-controls">
          <button
            className={`sort-button ${sortBy === 'savedAt' ? 'active' : ''}`}
            onClick={() => handleSortChange('savedAt')}
          >
            Date Saved {sortBy === 'savedAt' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
          <button
            className={`sort-button ${sortBy === 'tweetDate' ? 'active' : ''}`}
            onClick={() => handleSortChange('tweetDate')}
          >
            Tweet Date {sortBy === 'tweetDate' && (sortOrder === 'desc' ? '↓' : '↑')}
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
            className={`sort-button ${sortBy === 'views' ? 'active' : ''}`}
            onClick={() => handleSortChange('views')}
          >
            Views {sortBy === 'views' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
          <button
            className={`sort-button ${sortBy === 'username' ? 'active' : ''}`}
            onClick={() => handleSortChange('username')}
          >
            User {sortBy === 'username' && (sortOrder === 'desc' ? 'A-Z ↓' : 'Z-A ↑')}
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
  onDeleteTweet: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired
};

export default TweetList; 