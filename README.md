# Cursor Auto Approve

Automatically clicks the "Continue" button when AI agents hit Cursor's 25 tool usage limit, eliminating manual intervention during long AI sessions.

## 🚀 Installation

```bash
cursor --install-extension cursor-auto-approve-1.0.0.vsix
```

Or install via Cursor UI:
1. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Type "Extensions: Install from VSIX"
3. Select the `cursor-auto-approve-1.0.0.vsix` file

## ✨ Features

- **Auto-clicks Continue**: Automatically presses continue after 25 tool runs
- **Configurable Threshold**: Set custom limits (1-100 tool runs)
- **Status Bar Indicator**: Shows current count "Auto: X/25"
- **Activity Logging**: Tracks all auto-approve actions
- **Smart Detection**: Multiple fallback methods to find continue buttons

## 🎯 How It Works

1. **Monitors AI Tool Usage**: Counts when AI agents use tools (file operations, searches, etc.)
2. **Tracks Progress**: Status bar shows "Auto: 15/25" as you approach the limit
3. **Auto-Clicks Continue**: When threshold is reached, automatically clicks the continue button
4. **Resets Counter**: Starts counting again for the next cycle

## ⚙️ Configuration

Access settings via `Cmd+,` / `Ctrl+,` and search "Cursor Auto Approve":

- **Enabled**: Enable/disable auto-approval (default: `true`)
- **Threshold**: Tool runs before auto-approval (default: `25`)
- **Show Notifications**: Display success notifications (default: `true`)

## 🔧 Commands

| Command | Description |
|---------|-------------|
| `Toggle Auto Approve` | Enable/disable the extension |
| `Set Auto Approve Threshold` | Change the tool run threshold |
| `Reset Auto Approve Counter` | Reset current count to 0 |
| `Show Auto Approve Status` | View detailed status info |
| `Show Auto Approve Activity Log` | View recent activity history |
| `Manually Trigger Auto Approve` | Test the auto-click functionality |

## 🧪 Testing

To test the extension:

1. **Start a complex AI task** that requires many tool operations:
   ```
   "Please analyze my entire codebase, create documentation, 
   refactor components, and generate comprehensive tests."
   ```

2. **Watch the status bar** - it will show "Auto: X/25" counting up

3. **At 25 tool runs**, the extension automatically clicks "Continue"

4. **Check for notification**: "🎯 Auto-clicked continue button after 25 tool runs"

## 🔍 Troubleshooting

**Extension not working?**
- Check if status bar shows "Auto: 0/25"
- Verify extension is enabled in settings
- Try Command Palette → "Show Auto Approve Status"

**Counter not incrementing?**
- Ensure AI is actually using tools (file operations, searches)
- Try asking more complex questions requiring multiple tool calls

**Auto-click failed?**
- Check activity log for error details
- Try manual trigger to test button detection
- Ensure you've actually reached the threshold

## 📊 Status Indicators

- **"Auto: 0/25"** - Current tool count / threshold
- **Green notification** - Auto-click succeeded
- **Activity log entries** - Detailed action history
- **Tooltip on hover** - Shows total triggers and last triggered time

## 🏗️ Development

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# UI mode
npm run test:ui

# Build extension
npm run package
```

### 🔍 Code Quality

This project uses ESLint to maintain code quality and consistency.

```bash
# Run linting
npm run lint

# Lint is automatically run before tests
npm run pretest
```

**ESLint Configuration:**
- Uses modern flat config format (`eslint.config.js`)
- TypeScript support with `@typescript-eslint`
- Strict type safety rules enabled
- Custom rules for semicolons and quotes
- Special configuration for test files
- Ignores: `out/`, `node_modules/`, `coverage/`, `html/`

**To fix linting issues:**
1. Run `npm run lint` to see all issues
2. Many issues can be auto-fixed with `npx eslint --fix "src/**/*.{ts,tsx}" "src/test/**/*.ts"`
3. Manual fixes may be needed for type safety and logic issues

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Version**: 1.0.0  
**Compatible with**: Cursor IDE  
**Package Size**: 482KB 