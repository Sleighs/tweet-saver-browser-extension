
# X Post Saver

X Post Saver is a browser extension that allows you to easily save X posts for later reference. It seamlessly integrates with X's interface to provide a smooth user experience for saving and managing posts.

## Features

- 🔄 Save X posts with one click
- 🌓 Supports both light and dark themes
- 💾 Local storage with browser sync
- 🔍 Quick access to saved posts
- 🎨 Seamless integration with X's UI
- 🔄 X Account switching support

## Installation

### Download Option 1
1. Download the zip at [v1.0.22 link](https://drive.google.com/file/d/1_z8m8JFQ8a7b2adg_Rd-ndmSf8I6e6qM/view?usp=drive_link)
2. Unzip
3. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the unzipped folder

### Download Option 2
1. Clone this repository:
```bash
git clone https://github.com/sleighs/tweet-saver-browser-extension/extension
```

2. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `extension` directory

## Usage

1. Navigate to X (X.com)
2. Click the "+" button next to any tweet to save it
3. Access your saved posts through the extension popup
4. Manage your saved posts in the dashboard

## Configuration

The extension can be configured through the options page:

- Enable/disable the extension
- Automatically save posts
- Choose storage type (local/sync)
- Toggle photo URL saving
- Coming soon - Switch between light/dark themes
- Enable/disable debug mode
- Delete all saved posts

## Development

### Project Structure
```
extension/
├── manifest.json        # Extension configuration
├── scripts/
│   ├── content.js      # Main content script
│   ├── background.js   # Background script
│   └── options.js      # Options page logic
├── styles/
│   └── content.css     # Styles for the save button
├── images/             # Extension icons and assets
└── pages/
    └── options.html    # Options page
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

- [ ] Cloud storage integration
- [ ] Advanced search functionality
- [ ] Export capabilities
- [ ] Tweet organization with tags
- [ ] Analytics dashboard
- [ ] Batch operations
- [ ] API access

## Support

For support, please contact us at swrightdev@gmail.com or open an issue in the GitHub repository.

## Acknowledgments

- X for their platform
- Contributors and users of X Post Saver
 
