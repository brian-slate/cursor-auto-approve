# Testing Cursor Auto Approve Extension

## Manual Testing Steps

### 1. Install and Activate Extension

1. **Package the extension:**
   ```bash
   npm run package
   ```

2. **Install in VS Code:**
   - Open Command Palette (`Cmd+Shift+P`)
   - Run "Extensions: Install from VSIX..."
   - Select the generated `.vsix` file

3. **Verify activation:**
   - Look for status bar item showing "✓ Auto-Approve: ON"
   - Check that extension commands are available in Command Palette

### 2. Test Pattern Detection

Create test files with continue prompt patterns:

**test-prompts.txt:**
```
we default stop the agent after 25 tool calls
please ask the agent to continue manually
would you like to continue
press continue to proceed
click continue to resume
do you want to continue
shall I continue
continue with the next step
```

**Steps:**
1. Open the test file
2. Make edits to trigger text change events
3. Check if extension detects patterns (check activity log)

### 3. Test Commands

1. **Toggle Extension:**
   - Command Palette → "Cursor Auto Approve: Toggle Auto Approve"
   - Status bar should update to show ON/OFF

2. **Manual Trigger:**
   - Command Palette → "Cursor Auto Approve: Trigger Auto Approve Now"
   - Should see notification if enabled

3. **View Status:**
   - Click status bar item OR
   - Command Palette → "Cursor Auto Approve: Show Status"

4. **View Activity Log:**
   - Command Palette → "Cursor Auto Approve: Show Activity Log"

### 4. Test Real Cursor Scenarios

**Note:** This requires actual Cursor with Agent Mode.

1. **Start an Agent conversation** that will trigger 25+ tool calls
2. **Monitor the extension** when hitting the tool call limit
3. **Check if it auto-continues** without manual intervention

## Expected Behaviors

### Status Bar
- **Enabled:** "✓ Auto-Approve: ON" (green checkmark)
- **Disabled:** "✗ Auto-Approve: OFF" (red X)
- **Tooltip:** Shows total triggers and last triggered time

### Notifications
- Shows when auto-approve is triggered (if notifications enabled in settings)
- Includes option to view activity log

### Activity Log
- Records all auto-approve attempts
- Shows timestamps, actions, and details
- Maintains last 20 entries

## Configuration Testing

1. **Open Settings:** `Cmd+,`
2. **Search:** "cursor auto approve"
3. **Test settings:**
   - Toggle `cursorAutoApprove.enabled`
   - Toggle `cursorAutoApprove.showNotifications`

## Debugging

### Extension Host Output
1. **View → Output**
2. **Select:** "Extension Host" from dropdown
3. **Look for:** Console logs from the extension

### Developer Tools
1. **Help → Toggle Developer Tools**
2. **Console tab** for any JavaScript errors
3. **Network tab** to see if extension interferes with requests

## Known Limitations

1. **Text-based detection only** - relies on document text changes
2. **No direct DOM access** - can't actually click buttons in Cursor's UI
3. **Fallback methods** may not work in all scenarios
4. **2-second polling interval** - slight delay in detection

## Troubleshooting

### Extension Not Working
1. Check if extension is activated (status bar visible)
2. Verify settings are enabled
3. Check Extension Host output for errors
4. Try manual trigger to test functionality

### Pattern Not Detected
1. Verify text contains exact patterns from code
2. Check if extension is enabled in settings
3. Review activity log for any entries
4. Test with known working patterns

### No Auto-Click Action
1. Extension detects patterns but may not find clickable elements
2. Current implementation uses VS Code commands as fallback
3. May need Cursor-specific integration for actual button clicking

## Simulating Cursor Prompts

Since testing with real Cursor is complex, you can simulate by:

1. **Creating test documents** with continue prompt text
2. **Editing the documents** to trigger text change events
3. **Monitoring the activity log** to see if patterns are detected
4. **Testing the notification system** and status updates

This validates the pattern detection and state management without needing actual Cursor prompts.

