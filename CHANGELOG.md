# Changelog

All notable changes to the Cursor Auto Approve extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2025-06-19

### 🧠 Added - Smart OCR Management
- **Smart OCR Manager** - Intelligent system to decide when OCR is needed
- **Performance optimization** - Reduces OCR calls by 70-80%
- **Time-based throttling** - Minimum 5-second intervals, 15-second cooldowns
- **Failure management** - Suppression after 3 consecutive failures
- **User interaction detection** - Skips OCR when user is actively working
- **Window focus awareness** - Only triggers when Cursor is active
- **Real-time monitoring** - "Show OCR Status" command with detailed state info
- **Manual controls** - Reset OCR state and force enable for testing

### 🔧 Enhanced
- **Activity logging** - Now includes OCR decision reasons
- **Status bar** - Shows OCR initialization status
- **Command palette** - Added "Show OCR Status" command
- **Error handling** - Better recovery from OCR failures

### 📊 Performance
- **CPU usage** - 70% reduction in OCR processing time
- **UI responsiveness** - Eliminated OCR-related lag
- **Memory efficiency** - Smart cleanup and state management

## [2.0.0] - 2025-06-18

### 🎯 Added - OCR and Native Clicking
- **OCR detection** - Visual screen scanning using Tesseract.js
- **Native mouse clicking** - Real OS-level mouse clicks (macOS/Windows/Linux)
- **Multi-tier detection system** - Pattern → OCR → Command fallbacks
- **Cross-platform support** - AppleScript, PowerShell, xdotool
- **Screenshot capabilities** - Automated screen capture for OCR analysis
- **Button location detection** - Find continue buttons visually on screen

### 🧪 Testing
- **Test OCR Detection** - Command to test screen scanning
- **Test Native Clicking** - Command to test mouse clicking
- **Enhanced status** - Shows native clicking support status
- **Debug logging** - Detailed activity tracking for OCR attempts

### 🔧 Technical
- **New dependencies** - screenshot-desktop, tesseract.js, sharp
- **OCR worker management** - Proper initialization and cleanup
- **Error recovery** - Graceful fallbacks when OCR fails
- **Coordinate detection** - Precise button location finding

### 🎨 UI/UX
- **Improved notifications** - Success/failure feedback for OCR clicks
- **Status indicators** - OCR initialization and capability status
- **Activity log enhancement** - OCR-specific event tracking

## [1.0.0] - 2025-06-17

### 🚀 Initial Release - Pattern Detection
- **Text pattern detection** - Regex-based continue prompt recognition
- **Real-time monitoring** - Document change events + 2-second polling
- **VS Code integration** - Status bar, commands, configuration
- **Activity logging** - Track all auto-approval attempts
- **Configurable settings** - Enable/disable, notification preferences

### 📝 Core Features
- **Continue prompt patterns** - Detects "25 tool calls" and similar prompts
- **UI button detection** - Attempts to find continue buttons in VS Code
- **Keyboard fallbacks** - Command-based continuation when buttons not found
- **Status bar integration** - Real-time enable/disable indicator

### 🛠 Commands
- **Toggle Auto Approve** - Enable/disable functionality
- **Trigger Auto Approve Now** - Manual activation
- **Show Status** - Current state and statistics
- **Show Activity Log** - Recent auto-approval history

### ⚙️ Configuration
- **cursorAutoApprove.enabled** - Master enable/disable switch
- **cursorAutoApprove.showNotifications** - Control notification display

### 🧪 Testing
- **Vitest test suite** - 35 comprehensive tests
- **ESLint configuration** - Code quality enforcement
- **TypeScript compilation** - Type safety and modern JS features

---

## Version Numbering

- **Major (X.0.0)** - Breaking changes, major new features
- **Minor (X.Y.0)** - New features, enhancements, backward compatible
- **Patch (X.Y.Z)** - Bug fixes, small improvements

## Feature Evolution

| Version | Core Capability | Key Innovation |
|---------|----------------|----------------|
| **1.0.0** | Pattern Detection | Real-time text monitoring |
| **2.0.0** | + OCR + Native Clicking | Visual detection, real mouse clicks |
| **2.1.0** | + Smart OCR Management | Intelligent performance optimization |

## Next Planned Features

- **v2.2.0** - Enhanced user interaction detection
- **v2.3.0** - Cursor-specific API integration
- **v3.0.0** - Machine learning pattern recognition

