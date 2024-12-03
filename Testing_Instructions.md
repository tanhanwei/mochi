# Testing Instructions for Mochi

## Prerequisites
1. Chrome Dev/Canary channel (Version ≥ 128.0.6545.0)
2. Minimum 22 GB free storage space
3. Non-metered internet connection
4. Integrated/discrete GPU with 4GB+ VRAM

## Setup Steps

1. **Enable Gemini Nano**
   - Navigate to `chrome://flags/#optimization-guide-on-device-model`
   - Select "Enabled BypassPerfRequirement"
   - Relaunch Chrome

2. **Enable Prompt API**
   - Navigate to `chrome://flags/#prompt-api-for-gemini-nano`
   - Select "Enabled"
   - Relaunch Chrome

3. **Install Extension**
   - Clone repository: `git clone https://github.com/tanhanwei/mochi.git`
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the cloned directory

## Testing Features

1. **Basic Functionality**
   - Open any article webpage (Works well with Medium, CNA, New York Times websites)
   - Click Mochi extension icon
   - Select simplification level (Low/Mid/High)
   - Choose optimization mode
   - Click "Simplify Text"
   - Verify text transformation

2. **Accessibility Features**
   - Open Settings
   - Toggle OpenDyslexic font
   - Try different color themes
   - Adjust spacing controls
   - Test "Reset to Defaults"

3. **Edge Cases**
   - Test on various websites
   - Try with different content lengths
   - Check offline functionality
   - Verify preservation of images/links

## Known Limitations
- Only works on Chrome Dev/Canary
- Requires initial model download (~few minutes)
- May need Chrome restart if model download fails