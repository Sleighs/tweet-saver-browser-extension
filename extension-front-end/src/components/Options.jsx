import React from 'react'
import { saveOptions } from '../../main';
import './style.css'

export default function Options(props) {
  const { optionsState, setOptionsState } = props;

  //const [saved, setSaved] = useState(false);

  const onChange = (e) => {
    setOptionsState({
      ...optionsState,
      [e.target.name]: e.target.checked
    });
    saveOptions({
      ...optionsState, 
      [e.target.name]: e.target.checked
    });
    updateStatus();
  }
  
  const rowClicked = (name, val) => {
    if (name === 'colorUsernames' && val === true){
      setOptionsState({
        ...optionsState,
        [name]: val,
        normalChatColors: false
      });
      saveOptions({
        ...optionsState, 
        [name]: val,
        normalChatColors: false
      });
    } else if (name === 'normalChatColors' && val === true){
      setOptionsState({
        ...optionsState,
        [name]: val,
        colorUsernames: false
      });
      saveOptions({
        ...optionsState, 
        [name]: val,
        colorUsernames: false
      });
    } else {
      setOptionsState({
        ...optionsState,
        [name]: val
      });
      saveOptions({
        ...optionsState, 
        [name]: val
      });
    }
    
    updateStatus();
  }

  const updateStatus = () => {
    // Show status message
    var status = document.getElementById('status');

    //status.style.fontSize = '.95rem';
    status.style.color = 'rgb(178, 255, 126)';//#a6ed77';
    status.innerHTML = 'Options saved.';

    setTimeout(function() {
      //status.style.fontSize = '.8rem';
      status.style.color = 'white';
      status.innerHTML = 'Refresh required for changes';
    }, 1750);
  }

  let hiddenRowStyle = {
    display: 'none'
  };
  
  return (
    <div className="options-container">
      <h1 className='options-title'>Options</h1>

      {optionsState &&
      <form id="optionsForm" className="content">
        <div className="option"
          onClick={() => rowClicked('enableUsernameMenu', !optionsState.enableUsernameMenu)}
        >      
          <input type="checkbox" 
            name="enableUsernameMenu" 
            id="enable-username-menu-input" 
            className="option-checkbox" 
            onChange={onChange}
            checked={optionsState.enableUsernameMenu}
          />
          <label className="option-label" for="enableUsernameMenu">
            Enable recent users list
          </label>        
        </div>
        <div className="option"
          onClick={() => rowClicked('showListUserCount', !optionsState.showListUserCount)} 
        >
          <input type="checkbox"
            name="showListUserCount"
            id="show-list-user-count-input"
            className="option-checkbox"
            onChange={onChange}
            checked={optionsState.showListUserCount}
          />
          <label className="option-label" for="showListUserCount">
            Show count in recent users list
          </label>
        </div>
        <div className="option" 
          onClick={() => rowClicked('showUsernameListOnStartup', !optionsState.showUsernameListOnStartup)}
        >      
          <input type="checkbox" 
            name="showUsernameListOnStartup" 
            id="show-usernames-input"
            className="option-checkbox" 
            onChange={onChange}
            checked={optionsState.showUsernameListOnStartup}
          />
          <label className="option-label" for="showUsernameListOnStartup">
          Display recent users list by default
          </label>        
        </div>
        <div className="option"
          onClick={() => rowClicked('playVideoOnPageLoad', !optionsState.playVideoOnPageLoad)}
        >
          <input type="checkbox"
            name="playVideoOnPageLoad"
            id="play-video-on-page-load-input"
            className="option-checkbox"
            onChange={onChange}
            checked={optionsState.playVideoOnPageLoad}
          />
          <label className="option-label" for="playVideoOnPageLoad">
            Autoplay video player
          </label>
        </div>
        <div className="option"
          onClick={() => rowClicked('popupBelow', !optionsState.popupBelow)}
        >      
          <input type="checkbox" 
            name="popupBelow" 
            id="popup-below-input"
            className="option-checkbox" 
            onChange={onChange}
            checked={optionsState.popupBelow}
          />
          <label className="option-label" for="popupBelow">
            Show @ popup below message box
          </label>        
        </div>
        
        <h2 className='options-title2'>Style Options</h2>

        <div className="username-colors">
          <h2 className='username-colors-title'>Username Colors</h2>
          <div className="option"
            onClick={() => rowClicked('colorUsernames', !optionsState.colorUsernames)}
          >      
            <input type="checkbox" 
              name="colorUsernames" 
              id="color-usernames-input" 
              className="option-checkbox" 
              onChange={() => {
                //rowClicked('colorUsernames', !optionsState.colorUsernames)
              }}
              checked={optionsState.colorUsernames}
            />
            <label className="option-label" for="colorUsernames">
              ChatPlus
            </label>        
          </div>
        
          <div className="option"
            onClick={() => rowClicked('normalChatColors', !optionsState.normalChatColors)}
          >
            <input type="checkbox"
              name="normalChatColors"
              id="normal-chat-colors-input"
              className="option-checkbox"
              onChange={() => {
                //rowClicked('normalChatColors', !optionsState.normalChatColors)
              }}
              checked={optionsState.normalChatColors}
            />
            <label className="option-label" for="normalChatColors">
              Default
            </label>
          </div>
        </div>

        <div className="option" 
          onClick={() => rowClicked('chatStyleNormal', !optionsState.chatStyleNormal)}
        >
          <input type="checkbox"
            name="chatStyleNormal"
            id="chat-style-normal-input"
            className="option-checkbox"
            onChange={onChange}
            checked={optionsState.chatStyleNormal}
          />
          <label className="option-label" for="chatStyleNormal">
            Normal chat styling (for theme addons)
          </label>
        </div>
        <div className="option"
          onClick={() => rowClicked('saveRants', !optionsState.saveRants)}
          style={hiddenRowStyle}
        >
          <input type="checkbox"
            name="saveRants"
            id="save-rants-input"
            className="option-checkbox"
            onChange={onChange}
            checked={optionsState.saveRants}
          />
          <label className="option-label" for="saveRants">
            Save rants
          </label>
        </div>
        <div className="option"
          onClick={() => rowClicked('chatAvatarEnabled', !optionsState.chatAvatarEnabled)}
        >
          <input type="checkbox"
            name="chatAvatarEnabled"
            id="chat-avatar-enabled-input"
            className="option-checkbox"
            onChange={onChange}
            checked={optionsState.chatAvatarEnabled}
          />
          <label className="option-label" for="chatAvatarEnabled">
            Show avatars in chat
          </label>
        </div>
        
          
        
        <button id="save-options" class="save-btn btn-text"
          style={hiddenRowStyle} 
          onClick={(e) => {            
            // Show status alert
            updateStatus();
            // Save options to chrome storage
            saveOptions(optionsState)
            //setSaved(true);
            e.preventDefault();
          }}>Save</button>
          
          <div id="status"></div>
        </form>}
    </div>
  )
}

