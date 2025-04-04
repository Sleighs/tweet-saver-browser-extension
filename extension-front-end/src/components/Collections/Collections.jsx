import React, { useState, useEffect } from 'react';
import './Collections.css';

const Collections = ({ tweets, onUpdateTweet }) => {
  const [collections, setCollections] = useState([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const result = await chrome.storage.local.get('collections');
      setCollections(result.collections ? JSON.parse(result.collections) : []);
    } catch (err) {
      console.error('Error loading collections:', err);
      setError('Failed to load collections');
    }
  };

  const createCollection = async () => {
    if (!newCollectionName.trim()) return;

    try {
      const newCollection = {
        id: Date.now().toString(),
        name: newCollectionName.trim(),
        tweets: []
      };

      const updatedCollections = [...collections, newCollection];
      setCollections(updatedCollections);
      setNewCollectionName('');
      
      await chrome.storage.local.set({
        collections: JSON.stringify(updatedCollections)
      });
    } catch (err) {
      console.error('Error creating collection:', err);
      setError('Failed to create collection');
    }
  };

  const deleteCollection = async (collectionId) => {
    try {
      const updatedCollections = collections.filter(c => c.id !== collectionId);
      setCollections(updatedCollections);
      
      await chrome.storage.local.set({
        collections: JSON.stringify(updatedCollections)
      });
    } catch (err) {
      console.error('Error deleting collection:', err);
      setError('Failed to delete collection');
    }
  };

  const addTweetToCollection = async (collectionId, tweet) => {
    try {
      const updatedCollections = collections.map(collection => {
        if (collection.id === collectionId) {
          return {
            ...collection,
            tweets: [...collection.tweets, tweet]
          };
        }
        return collection;
      });

      setCollections(updatedCollections);
      
      await chrome.storage.local.set({
        collections: JSON.stringify(updatedCollections)
      });
    } catch (err) {
      console.error('Error adding tweet to collection:', err);
      setError('Failed to add tweet to collection');
    }
  };

  const removeTweetFromCollection = async (collectionId, tweetUrl) => {
    try {
      const updatedCollections = collections.map(collection => {
        if (collection.id === collectionId) {
          return {
            ...collection,
            tweets: collection.tweets.filter(t => t.url !== tweetUrl)
          };
        }
        return collection;
      });

      setCollections(updatedCollections);
      
      await chrome.storage.local.set({
        collections: JSON.stringify(updatedCollections)
      });
    } catch (err) {
      console.error('Error removing tweet from collection:', err);
      setError('Failed to remove tweet from collection');
    }
  };

  return (
    <div className="collections-container">
      {error && <div className="collections-error">{error}</div>}
      
      <div className="collections-create">
        <input
          type="text"
          value={newCollectionName}
          onChange={(e) => setNewCollectionName(e.target.value)}
          placeholder="New collection name"
          className="collections-input"
        />
        <button onClick={createCollection} className="collections-create-button">
          Create Collection
        </button>
      </div>

      <div className="collections-list">
        {collections.map(collection => (
          <div key={collection.id} className="collections-card">
            <div className="collections-header">
              <h3>{collection.name}</h3>
              <button
                onClick={() => deleteCollection(collection.id)}
                className="collections-delete-button"
              >
                Delete
              </button>
            </div>
            
            <div className="collections-tweets">
              {collection.tweets.map(tweet => (
                <div key={tweet.url} className="collections-tweet">
                  <span>{tweet.text}</span>
                  <button
                    onClick={() => removeTweetFromCollection(collection.id, tweet.url)}
                    className="collections-remove-button"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="collections-add-section">
              <select
                onChange={(e) => {
                  const selectedTweet = tweets.find(t => t.url === e.target.value);
                  if (selectedTweet) {
                    addTweetToCollection(collection.id, selectedTweet);
                  }
                }}
                className="collections-select"
              >
                <option value="">Add a post...</option>
                {tweets.map(tweet => (
                  <option key={tweet.url} value={tweet.url}>
                    {tweet.text.substring(0, 50)}...
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Collections; 