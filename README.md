# Mochi - Making Web Content More Accessible

<img src="/api/placeholder/120/120" alt="Mochi Logo" />

Mochi is a Chrome extension that makes web content more accessible for readers with different reading needs. Like its namesake - the soft, adaptable Japanese treat - Mochi makes hard-to-read content more digestible while preserving the complete reading experience.

## 🌟 Key Features

- **Offline Text Simplification**: Powered by Chrome's built-in Gemini Nano for 100% offline processing and privacy
- **Customizable Simplification Levels**: Choose between Low, Mid, and High simplification based on your needs
- **Specialized Reading Support**: Optimize text processing for different reading requirements without compromising on content
- **Accessibility-First Design**: Comprehensive text customization options including OpenDyslexic font support
- **Real-Time Adjustments**: Instantly apply text formatting changes for the most comfortable reading experience

## 🎯 Why Mochi?

Unlike traditional text summarizers, Mochi is designed to preserve the complete reading experience. We believe everyone deserves to enjoy the full journey of reading while having content presented in a way that works best for them. Mochi adapts the text presentation without sacrificing content or context.

## ⚡ Prerequisites

Before installing Mochi, please ensure your system meets the following requirements:

1. **Google Chrome Version**
   - Install Chrome Dev channel (or Canary channel)
   - Version must be ≥ 128.0.6545.0

2. **System Requirements**
   - Minimum 22 GB of free storage space
   - Note: If available storage falls below 10 GB after download, the model will be automatically deleted
   - For macOS users: Use Disk Utility to check accurate free disk space

3. **Policy Acknowledgment**
   - Review and acknowledge Google's Generative AI Prohibited Uses Policy

## 🚀 Installation

### Step 1: Enable Gemini Nano and Prompt API

1. Open Chrome and navigate to `chrome://flags/#optimization-guide-on-device-model`
2. Select "Enabled BypassPerfRequirement"
   - This bypasses performance checks that might prevent Gemini Nano download
3. Go to `chrome://flags/#prompt-api-for-gemini-nano`
4. Select "Enabled"
5. Relaunch Chrome

### Step 2: Install Mochi Extension

1. Clone the repository:
   ```bash
   git clone https://github.com/tanhanwei/mochi.git
   ```
2. Open Chrome Dev/Canary
3. Navigate to `chrome://extensions/`
4. Enable "Developer mode" (toggle in top right)
5. Click "Load unpacked"
6. Select the cloned `mochi` directory
7. The extension should now appear in your Chrome toolbar

## ⚙️ Features in Detail

### Text Simplification
- Three simplification levels (Low, Mid, High)
- Optimization options:
  - General Reading Support
  - Focus/Attention Support
  - Reading Processing Support

### Display Customization
- OpenDyslexic font toggle
- Multiple color themes:
  - Default
  - Cream Paper
  - Dark Mode
  - Sepia
  - And more
- Adjustable spacing controls:
  - Line spacing
  - Letter spacing
  - Word spacing

## 💡 How It Works

Mochi uses Chrome's built-in Gemini Nano AI to process and simplify text content while maintaining meaning and context. The extension:
1. Analyzes the current webpage content
2. Applies the selected simplification level
3. Optimizes the text based on your chosen reading support option
4. Instantly updates the page with the processed content
5. Applies any custom display settings you've configured

## 🔒 Privacy & Security

- 100% offline processing using Chrome's built-in Gemini Nano
- No data sent to external servers
- No tracking or data collection
- Complete privacy protection for all users


## 📝 License

MIT License

## ⚠️ Troubleshooting

If you encounter any issues:
1. Verify you have sufficient disk space (>22 GB)
2. Confirm Chrome version is compatible
3. Check that all flags are properly enabled
4. Try relaunching Chrome after enabling flags

---

Made with ❤️ for accessible reading