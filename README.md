# Tweet Saver

Tweet Saver is a browser extension that allows you to easily save and organize tweets for later reference. It seamlessly integrates with Twitter's interface to provide a smooth user experience for saving and managing tweets.

## Features

- 🔄 Save tweets with one click
- 🌓 Supports both light and dark themes
- 💾 Local storage with browser sync
- 🔍 Quick access to saved tweets
- 🎨 Seamless integration with Twitter's UI
- 🔄 Account switching support
- 🖼️ Optional photo URL saving

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/tweet-saver.git
```

2. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `extension` directory

## Usage

1. Navigate to Twitter (twitter.com)
2. Click the "+" button next to any tweet to save it
3. Access your saved tweets through the extension popup
4. Manage your saved tweets in the dashboard

## Configuration

The extension can be configured through the options page:

- Enable/disable the extension
- Choose storage type (local/sync)
- Toggle photo URL saving
- Switch between light/dark themes
- Enable/disable debug mode

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

### Building

1. Install dependencies:
```bash
npm install
```

2. Build the extension:
```bash
npm run build
```

### Testing

Run the test suite:
```bash
npm test
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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact us at [your-email].

## Acknowledgments

- Twitter for their platform
- Contributors and users of Tweet Saver