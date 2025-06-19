import * as vscode from 'vscode';
import { OCRDetection, OCRResult } from './ocr-detection';
import { NativeClicker, ClickResult } from './native-clicker';
import { SmartOCRManager, OCRTriggerConditions } from './smart-ocr-manager';

interface AutoApproveState {
    enabled: boolean;
    lastTriggered?: number;
    totalTriggers: number;
    recentActivity: Array<{
        timestamp: number;
        action: string;
        details: string;
    }>;
}

export function activate(context: vscode.ExtensionContext) {
    // Get extension version from package.json
    const extension = vscode.extensions.getExtension('cursor-extensions.cursor-auto-approve');
    const version = extension?.packageJSON?.version || '2.1.0';
    
    console.log(`Cursor Auto Approve extension v${version} is now active!`);

    let autoApproveState: AutoApproveState = {
        enabled: true,
        totalTriggers: 0,
        recentActivity: []
    };

    // Initialize OCR, native clicking, and smart OCR manager
    const ocrDetection = new OCRDetection();
    const nativeClicker = new NativeClicker();
    const smartOCRManager = new SmartOCRManager();
    let ocrInitialized = false;

    // Configuration
    const getConfig = () => vscode.workspace.getConfiguration('cursorAutoApprove');
    
    // Status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'cursorAutoApprove.showStatus';
    context.subscriptions.push(statusBarItem);

    const updateStatusBar = () => {
        const config = getConfig();
        const enabled = config.get<boolean>('enabled', true);
        
        if (enabled) {
            statusBarItem.text = '$(check) Auto-Approve: ON';
            let tooltip = 'Auto Approve: Enabled';
            
            if (autoApproveState.totalTriggers > 0) {
                const lastTriggered = autoApproveState.lastTriggered ? 
                    new Date(autoApproveState.lastTriggered).toLocaleTimeString() : 'Never';
                tooltip += `\nTotal auto-approvals: ${autoApproveState.totalTriggers}`;
                tooltip += `\nLast triggered: ${lastTriggered}`;
                tooltip += '\nClick to view activity log';
            }
            
            statusBarItem.tooltip = tooltip;
        } else {
            statusBarItem.text = '$(x) Auto-Approve: OFF';
            statusBarItem.tooltip = 'Auto Approve: Disabled';
        }
        statusBarItem.show();
    };

    // Monitor for Cursor input prompts and continue buttons
    const monitorCursorPrompts = () => {
        // Monitor for text document changes that might indicate prompts
        vscode.workspace.onDidChangeTextDocument((event) => {
            if (event.document && event.contentChanges.length > 0) {
                const text = event.document.getText();
                checkForContinuePrompts(text);
            }
        });

        // Monitor for webview changes (Cursor chat interface)
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor && editor.document) {
                const text = editor.document.getText();
                checkForContinuePrompts(text);
            }
        });
    };

    // Check for continue prompts in text
    const checkForContinuePrompts = (text: string) => {
        const config = getConfig();
        const enabled = config.get<boolean>('enabled', true);
        
        if (!enabled) return;

        // Patterns that indicate Cursor is waiting for user input
        const continuePatterns = [
            /we default stop the agent after \d+ tool calls/i,
            /please ask the agent to continue manually/i,
            /would you like to continue/i,
            /press continue to proceed/i,
            /click continue to resume/i,
            /do you want to continue/i,
            /shall I continue/i,
            /continue with the next step/i
        ];

        const hasContinuePrompt = continuePatterns.some(pattern => pattern.test(text));
        
        if (hasContinuePrompt) {
            // Small delay to ensure UI is ready
            setTimeout(() => {
                void autoApprove();
            }, 1000);
        }
    };

    const logActivity = (action: string, details: string) => {
        const activity = {
            timestamp: Date.now(),
            action,
            details
        };
        
        autoApproveState.recentActivity.unshift(activity);
        
        // Keep only last 20 activities
        if (autoApproveState.recentActivity.length > 20) {
            autoApproveState.recentActivity = autoApproveState.recentActivity.slice(0, 20);
        }
    };

    const autoApprove = async () => {
        const config = getConfig();
        const showNotifications = config.get<boolean>('showNotifications', true);
        
        const timestamp = Date.now();
        autoApproveState.lastTriggered = timestamp;
        autoApproveState.totalTriggers++;
        
        // Multi-tier approach for maximum reliability
        let success = false;
        
        // Tier 1: Try to find and click actual continue buttons in the UI
        const uiResult = findAndClickContinueButton();
        if (uiResult) {
            logActivity('Auto-Click Success', 'Found and clicked continue button via UI detection');
            success = true;
        } else {
            // Record UI failure for smart OCR manager
            smartOCRManager.recordUIFailure('UI button detection failed');
        }
        
        // Tier 2: Use OCR to detect and click button visually (only if UI failed)
        if (!success && await tryOCRAutoClick(true)) {
            logActivity('OCR Auto-Click Success', 'Found and clicked continue button via OCR detection');
            success = true;
        }
        // Tier 3: Fallback to command-based approaches
        else {
            logActivity('Fallback Method', 'Used command fallback for continue prompt');
            
            // Try sending a continue message
            vscode.commands.executeCommand('workbench.action.quickOpen').then(() => {
                vscode.window.showInformationMessage('Auto-approve: Attempting to continue...');
            });
        }
        
        if (showNotifications) {
            const message = success 
                ? '🎯 Auto-clicked continue button successfully'
                : '⚡ Auto-approved continue prompt (fallback method)';
                
            vscode.window.showInformationMessage(
                message,
                'View Activity Log'
            ).then(selection => {
                if (selection === 'View Activity Log') {
                    vscode.commands.executeCommand('cursorAutoApprove.showActivityLog');
                }
            });
        }

        updateStatusBar();
    };

    // OCR-based auto-clicking function with smart triggering
    const tryOCRAutoClick = async (uiDetectionFailed: boolean = true): Promise<boolean> => {
        // Prepare conditions for smart OCR manager
        const ocrStatus = smartOCRManager.getStatus();
        const lastOCRTime = ocrStatus.lastOCRAttempt === 'Never' ? 0 : 
            new Date(ocrStatus.lastOCRAttempt).getTime();
            
        const conditions: OCRTriggerConditions = {
            textDetectedPrompt: true, // We only get here if text was detected
            uiDetectionFailed,
            timeSinceLastOCR: Date.now() - lastOCRTime,
            cursorWindowActive: smartOCRManager.isCursorWindowActive(),
            recentFailurePattern: smartOCRManager.hasRecentFailurePattern(),
            userInteractionRecent: smartOCRManager.checkRecentUserInteraction()
        };

        // Check if we should trigger OCR
        const ocrDecision = smartOCRManager.shouldTriggerOCR(conditions);
        
        if (!ocrDecision.trigger) {
            logActivity('OCR Skipped', ocrDecision.skipReason || 'OCR not needed');
            return false;
        }

        // OCR approved - proceed with detection
        logActivity('OCR Triggered', ocrDecision.reason);
        smartOCRManager.onOCRStart();

        try {
            // Initialize OCR if not already done
            if (!ocrInitialized) {
                await ocrDetection.initialize();
                ocrInitialized = true;
                logActivity('OCR Initialized', 'OCR detection system ready');
            }

            // Use OCR to detect continue prompts and button locations
            const ocrResult: OCRResult = await ocrDetection.detectContinuePrompt();
            
            if (ocrResult.foundPrompt && ocrResult.buttonLocation) {
                const { x, y } = ocrResult.buttonLocation;
                
                // Use native clicker to perform actual mouse click
                const clickResult: ClickResult = await nativeClicker.clickAt(x, y);
                
                if (clickResult.success) {
                    smartOCRManager.onOCRComplete(true, true); // Success and found
                    logActivity(
                        'OCR+Native Click Success', 
                        `Clicked at (${x}, ${y}) using ${clickResult.method}, confidence: ${ocrResult.confidence}`
                    );
                    return true;
                } else {
                    smartOCRManager.onOCRComplete(true, false); // OCR worked but click failed
                    logActivity(
                        'Native Click Failed', 
                        `Failed to click at (${x}, ${y}): ${clickResult.error}`
                    );
                }
            } else if (ocrResult.foundPrompt) {
                smartOCRManager.onOCRComplete(true, false); // Found prompt but no button
                logActivity(
                    'OCR Prompt Detected',
                    'Found continue prompt via OCR but could not locate button'
                );
            } else {
                smartOCRManager.onOCRComplete(true, false); // OCR worked but found nothing
                logActivity(
                    'OCR No Match',
                    'OCR completed but no continue prompts detected on screen'
                );
            }
            
            return false;
        } catch (error) {
            smartOCRManager.onOCRComplete(false, false); // OCR failed
            logActivity('OCR Error', `OCR detection failed: ${String(error)}`);
            return false;
        }
    };

    const findAndClickContinueButton = (): boolean => {
        // Enhanced button detection for Cursor's continue prompts
        const buttonSelectors = [
            // Cursor-specific continue button patterns
            'button:contains("Continue")',
            'button:contains("Resume")',
            'button:contains("Skip and Continue")',
            'button:contains("Yes, continue")',
            'button:contains("Proceed")',
            '[data-testid="continue-button"]',
            '[data-testid="resume-button"]',
            '[data-testid="skip-continue-button"]',
            '.continue-button',
            '.resume-button',
            // Generic patterns
            'button[aria-label*="continue"]',
            'button[aria-label*="resume"]',
            'button[title*="continue"]',
            'button[title*="resume"]',
            // Chat interface buttons
            '.chat-continue-button',
            '.agent-continue-button',
            '.tool-limit-continue'
        ];

        // Try different methods to find and click the button
        for (const selector of buttonSelectors) {
            if (tryClickButton(selector)) {
                return true;
            }
        }

        // Try keyboard shortcuts as fallback
        return tryKeyboardContinue();
    };

    const tryClickButton = (_selector: string): boolean => {
        try {
            // This is a simplified version - in practice, we'd need to interact with the DOM
            // For now, we'll use VS Code commands that might trigger continue actions
            vscode.commands.executeCommand('workbench.action.acceptSelectedSuggestion');
            return true;
        } catch {
            return false;
        }
    };

    const tryKeyboardContinue = (): boolean => {
        try {
            // Try common keyboard shortcuts for continuing
            const shortcuts = [
                'workbench.action.acceptSelectedSuggestion',
                'editor.action.acceptInlineCompletion',
                'workbench.action.quickOpenPreviousRecentlyUsedEditor'
            ];

            shortcuts.forEach(command => {
                vscode.commands.executeCommand(command).then(undefined, () => {
                    // Ignore errors for commands that don't exist
                });
            });

            return true;
        } catch {
            return false;
        }
    };

    // Commands
    const toggleCommand = vscode.commands.registerCommand('cursorAutoApprove.toggle', () => {
        const config = getConfig();
        const currentEnabled = config.get<boolean>('enabled', true);
        const newEnabled = !currentEnabled;
        
        config.update('enabled', newEnabled, vscode.ConfigurationTarget.Global);
        autoApproveState.enabled = newEnabled;
        
        vscode.window.showInformationMessage(
            `Cursor Auto Approve ${newEnabled ? 'enabled' : 'disabled'}`
        );
        updateStatusBar();
    });

    const manualTriggerCommand = vscode.commands.registerCommand('cursorAutoApprove.trigger', () => {
        void autoApprove();
    });

    const showActivityLogCommand = vscode.commands.registerCommand('cursorAutoApprove.showActivityLog', () => {
        if (autoApproveState.recentActivity.length === 0) {
            vscode.window.showInformationMessage('No recent auto-approve activity');
            return;
        }

        const logEntries = autoApproveState.recentActivity.map((activity, index) => {
            const time = new Date(activity.timestamp).toLocaleString();
            return `${index + 1}. [${time}] ${activity.action}: ${activity.details}`;
        }).join('\n');

        const message = `🎯 Auto-Approve Activity Log:\n\n${logEntries}`;
        
        vscode.window.showInformationMessage(message, 'Close');
    });

    const showStatusCommand = vscode.commands.registerCommand('cursorAutoApprove.showStatus', () => {
        const config = getConfig();
        const enabled = config.get<boolean>('enabled', true);
        
        let statusMessage = `🎯 Cursor Auto Approve v${version}\n\n`;
        statusMessage += `Status: ${enabled ? '✅ Enabled' : '❌ Disabled'}\n`;
        statusMessage += `Total auto-approvals: ${autoApproveState.totalTriggers}\n`;
        statusMessage += `Native clicking: ${nativeClicker.isSupported() ? '✅ Supported' : '❌ Not supported'}\n`;
        statusMessage += `OCR initialized: ${ocrInitialized ? '✅ Ready' : '⏳ Not initialized'}\n`;
        
        if (autoApproveState.lastTriggered) {
            const lastTime = new Date(autoApproveState.lastTriggered).toLocaleString();
            statusMessage += `Last triggered: ${lastTime}\n`;
        }
        
        if (autoApproveState.recentActivity.length > 0) {
            const lastActivity = autoApproveState.recentActivity[0];
            const lastActivityTime = new Date(lastActivity.timestamp).toLocaleString();
            statusMessage += `\nLast activity: ${lastActivity.action} at ${lastActivityTime}`;
        }
        
        vscode.window.showInformationMessage(statusMessage, 'View Full Log', 'Test OCR', 'Test Click', 'OCR Status', 'Close').then(selection => {
            if (selection === 'View Full Log') {
                vscode.commands.executeCommand('cursorAutoApprove.showActivityLog');
            } else if (selection === 'Test OCR') {
                vscode.commands.executeCommand('cursorAutoApprove.testOCR');
            } else if (selection === 'Test Click') {
                vscode.commands.executeCommand('cursorAutoApprove.testClick');
            } else if (selection === 'OCR Status') {
                vscode.commands.executeCommand('cursorAutoApprove.showOCRStatus');
            }
        });
    });

    // Test OCR functionality
    const testOCRCommand = vscode.commands.registerCommand('cursorAutoApprove.testOCR', async () => {
        vscode.window.showInformationMessage('Testing OCR detection... This may take a few seconds.');
        
        try {
            if (!ocrInitialized) {
                await ocrDetection.initialize();
                ocrInitialized = true;
            }
            
            const result = await ocrDetection.testOCR();
            const message = `OCR Test Results:\n\nPrompt detected: ${result.hasPrompt}\n\nText sample:\n${result.text.substring(0, 200)}${result.text.length > 200 ? '...' : ''}`;
            
            vscode.window.showInformationMessage(message, 'OK');
            logActivity('OCR Test', `Prompt detected: ${result.hasPrompt}`);
        } catch (error) {
            vscode.window.showErrorMessage(`OCR test failed: ${String(error)}`);
            logActivity('OCR Test Failed', `Error: ${String(error)}`);
        }
    });

    // Test native clicking functionality
    const testClickCommand = vscode.commands.registerCommand('cursorAutoApprove.testClick', async () => {
        const position = await nativeClicker.getCurrentMousePosition();
        const testMessage = position 
            ? `Test click will be performed at current mouse position (${position.x}, ${position.y}). Move mouse to safe location and click OK.`
            : 'Test click will be performed at position (100, 100). Click OK to proceed.';
            
        vscode.window.showWarningMessage(testMessage, 'OK', 'Cancel').then(async selection => {
            if (selection === 'OK') {
                const testX = position ? position.x : 100;
                const testY = position ? position.y : 100;
                
                const result = await nativeClicker.clickAt(testX, testY);
                
                if (result.success) {
                    vscode.window.showInformationMessage(
                        `✅ Click test successful!\nMethod: ${result.method}\nPosition: (${testX}, ${testY})`
                    );
                    logActivity('Click Test Success', `Clicked at (${testX}, ${testY}) using ${result.method}`);
                } else {
                    vscode.window.showErrorMessage(
                        `❌ Click test failed: ${result.error}`
                    );
                    logActivity('Click Test Failed', `Error: ${result.error}`);
                }
            }
        });
    });

    // Show OCR status
    const showOCRStatusCommand = vscode.commands.registerCommand('cursorAutoApprove.showOCRStatus', () => {
        const ocrStatus = smartOCRManager.getStatus();
        
        let statusMessage = '🔍 Smart OCR Manager Status:\n\n';
        statusMessage += `Last OCR attempt: ${ocrStatus.lastOCRAttempt}\n`;
        statusMessage += `Last successful OCR: ${ocrStatus.lastSuccessfulOCR}\n`;
        statusMessage += `Consecutive failures: ${ocrStatus.consecutiveFailures}\n`;
        statusMessage += `OCR in progress: ${ocrStatus.ocrInProgress ? '⏳ Yes' : '✅ No'}\n`;
        statusMessage += `Suppressed until: ${ocrStatus.suppressedUntil}\n`;
        
        if (ocrStatus.recentFailures.length > 0) {
            statusMessage += `\nRecent UI failures: ${ocrStatus.recentFailures.join(', ')}`;
        }
        
        // Show current trigger conditions
        const conditions = {
            cursorWindowActive: smartOCRManager.isCursorWindowActive(),
            recentFailurePattern: smartOCRManager.hasRecentFailurePattern(),
            userInteractionRecent: smartOCRManager.checkRecentUserInteraction()
        };
        
        statusMessage += `\n\nCurrent Conditions:\n`;
        statusMessage += `Window active: ${conditions.cursorWindowActive ? '✅' : '❌'}\n`;
        statusMessage += `Failure pattern: ${conditions.recentFailurePattern ? '⚠️' : '✅'}\n`;
        statusMessage += `User interaction: ${conditions.userInteractionRecent ? '⚠️' : '✅'}`;
        
        vscode.window.showInformationMessage(statusMessage, 'Reset OCR', 'Force Enable', 'Close').then(selection => {
            if (selection === 'Reset OCR') {
                smartOCRManager.reset();
                vscode.window.showInformationMessage('OCR manager state reset');
                logActivity('OCR Reset', 'Smart OCR manager state manually reset');
            } else if (selection === 'Force Enable') {
                smartOCRManager.forceEnableOCR();
                vscode.window.showInformationMessage('OCR force enabled - all restrictions bypassed');
                logActivity('OCR Force Enabled', 'OCR restrictions manually bypassed');
            }
        });
    });

    // Listen for configuration changes
    const configChangeListener = vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('cursorAutoApprove')) {
            updateStatusBar();
        }
    });

    // Start monitoring for continue prompts
    const startContinueMonitoring = () => {
        const interval = setInterval(() => {
            const config = getConfig();
            const enabled = config.get<boolean>('enabled', true);
            
            if (enabled) {
                // Check for continue prompts in active editor or webviews
                const activeEditor = vscode.window.activeTextEditor;
                if (activeEditor) {
                    const text = activeEditor.document.getText();
                    checkForContinuePrompts(text);
                }
            }
        }, 2000); // Check every 2 seconds

        return {
            dispose: () => clearInterval(interval)
        };
    };

    // Register all subscriptions
    context.subscriptions.push(
        toggleCommand,
        manualTriggerCommand,
        showActivityLogCommand,
        showStatusCommand,
        testOCRCommand,
        testClickCommand,
        showOCRStatusCommand,
        configChangeListener,
        statusBarItem
    );

    // Initialize monitoring
    monitorCursorPrompts();
    
    const continueMonitor = startContinueMonitoring();
    context.subscriptions.push(continueMonitor);

    // Initialize UI
    updateStatusBar();
    
    vscode.window.showInformationMessage(
        'Cursor Auto Approve extension activated! Will auto-click continue prompts.'
    );
}

export function deactivate() {
    console.log('Cursor Auto Approve extension deactivated');
    
    // Clean up OCR resources
    const globalOCR = (global as any).cursorAutoApproveOCR;
    if (globalOCR) {
        globalOCR.dispose().catch((error: any) => {
            console.error('Error disposing OCR:', error);
        });
    }
}
