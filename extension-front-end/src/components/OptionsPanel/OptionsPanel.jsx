/* global chrome */
import { useState } from 'react';
import './OptionsPanel.css';
import GeneralSettings from './GeneralSettings';
import AdvancedSettings from './AdvancedSettings';
import AppearanceSettings from './AppearanceSettings';
import StorageSettings from './StorageSettings';

const OptionsPanel = () => {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="options-panel">
      <nav className="options-tabs">
        <button
          className={`options-tab-button ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <span className="tab-icon">⚙️</span>
          General
        </button>
        <button
          className={`options-tab-button ${activeTab === 'storage' ? 'active' : ''}`}
          onClick={() => setActiveTab('storage')}
        >
          <span className="tab-icon">💾</span>
          Storage
        </button>
        <button
          className={`options-tab-button ${activeTab === 'appearance' ? 'active' : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          <span className="tab-icon">🎨</span>
          Appearance
        </button>
        <button
          className={`options-tab-button ${activeTab === 'advanced' ? 'active' : ''}`}
          onClick={() => setActiveTab('advanced')}
        >
          <span className="tab-icon">🔧</span>
          Advanced
        </button>
      </nav>

      <main className="options-content">
        {activeTab === 'general' && <GeneralSettings />}
        {activeTab === 'storage' && <StorageSettings />}
        {activeTab === 'appearance' && <AppearanceSettings />}
        {activeTab === 'advanced' && <AdvancedSettings />}
      </main>
    </div>
  );
};

export default OptionsPanel;