import * as vscode from 'vscode';

export interface OCRTriggerConditions {
    textDetectedPrompt: boolean;
    uiDetectionFailed: boolean;
    timeSinceLastOCR: number;
    cursorWindowActive: boolean;
    recentFailurePattern: boolean;
    userInteractionRecent: boolean;
}

export interface OCRManagerState {
    lastOCRAttempt: number;
    lastSuccessfulOCR: number;
    consecutiveFailures: number;
    recentUIFailures: string[];
    ocrInProgress: boolean;
    suppressUntil: number;
}

export class SmartOCRManager {
    private state: OCRManagerState = {
        lastOCRAttempt: 0,
        lastSuccessfulOCR: 0,
        consecutiveFailures: 0,
        recentUIFailures: [],
        ocrInProgress: false,
        suppressUntil: 0
    };

    // Configuration constants
    private readonly MIN_OCR_INTERVAL = 5000; // 5 seconds minimum between OCR calls
    private readonly OCR_COOLDOWN_AFTER_SUCCESS = 15000; // 15 seconds after successful OCR
    private readonly MAX_CONSECUTIVE_FAILURES = 3; // Stop OCR after 3 failures
    private readonly FAILURE_SUPPRESSION_TIME = 30000; // 30 seconds suppression after max failures
    private readonly USER_INTERACTION_WINDOW = 10000; // 10 seconds after user interaction

    /**
     * Determines if OCR should be triggered based on current conditions
     */
    shouldTriggerOCR(conditions: OCRTriggerConditions): { 
        trigger: boolean; 
        reason: string;
        skipReason?: string;
    } {
        const now = Date.now();

        // 1. Check if OCR is already in progress
        if (this.state.ocrInProgress) {
            return {
                trigger: false,
                reason: 'skip',
                skipReason: 'OCR already in progress'
            };
        }

        // 2. Check suppression period (after max failures)
        if (now < this.state.suppressUntil) {
            const remainingTime = Math.ceil((this.state.suppressUntil - now) / 1000);
            return {
                trigger: false,
                reason: 'skip',
                skipReason: `Suppressed for ${remainingTime} more seconds after consecutive failures`
            };
        }

        // 3. Check minimum interval between OCR calls
        const timeSinceLastOCR = now - this.state.lastOCRAttempt;
        if (timeSinceLastOCR < this.MIN_OCR_INTERVAL) {
            const waitTime = Math.ceil((this.MIN_OCR_INTERVAL - timeSinceLastOCR) / 1000);
            return {
                trigger: false,
                reason: 'skip',
                skipReason: `Too soon - wait ${waitTime} more seconds`
            };
        }

        // 4. Check cooldown after successful OCR
        const timeSinceSuccess = now - this.state.lastSuccessfulOCR;
        if (this.state.lastSuccessfulOCR > 0 && timeSinceSuccess < this.OCR_COOLDOWN_AFTER_SUCCESS) {
            const waitTime = Math.ceil((this.OCR_COOLDOWN_AFTER_SUCCESS - timeSinceSuccess) / 1000);
            return {
                trigger: false,
                reason: 'skip',
                skipReason: `Recent success - cooldown for ${waitTime} more seconds`
            };
        }

        // 5. Skip if user interacted recently (might be manually handling)
        if (conditions.userInteractionRecent) {
            return {
                trigger: false,
                reason: 'skip',
                skipReason: 'Recent user interaction detected'
            };
        }

        // 6. Skip if we haven't detected a text prompt
        if (!conditions.textDetectedPrompt) {
            return {
                trigger: false,
                reason: 'skip',
                skipReason: 'No text prompt detected'
            };
        }

        // 7. Skip if UI detection hasn't failed (no need for OCR yet)
        if (!conditions.uiDetectionFailed) {
            return {
                trigger: false,
                reason: 'skip',
                skipReason: 'UI detection not attempted or succeeded'
            };
        }

        // 8. Skip if Cursor window is not active
        if (!conditions.cursorWindowActive) {
            return {
                trigger: false,
                reason: 'skip',
                skipReason: 'Cursor window not active'
            };
        }

        // 9. Check for recent failure patterns
        if (this.state.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
            this.state.suppressUntil = now + this.FAILURE_SUPPRESSION_TIME;
            return {
                trigger: false,
                reason: 'skip',
                skipReason: 'Too many consecutive failures - entering suppression period'
            };
        }

        // 10. TRIGGER CONDITIONS MET
        
        // High priority triggers
        if (conditions.recentFailurePattern) {
            return {
                trigger: true,
                reason: 'UI detection failing repeatedly - OCR needed'
            };
        }

        if (timeSinceLastOCR > 30000) { // Haven't tried OCR in 30+ seconds
            return {
                trigger: true,
                reason: 'Long time since last OCR attempt'
            };
        }

        // Standard trigger: text detected + UI failed + reasonable interval
        return {
            trigger: true,
            reason: 'Standard trigger: text prompt detected, UI detection failed'
        };
    }

    /**
     * Record that OCR is starting
     */
    onOCRStart(): void {
        this.state.ocrInProgress = true;
        this.state.lastOCRAttempt = Date.now();
    }

    /**
     * Record OCR completion and result
     */
    onOCRComplete(success: boolean, found: boolean): void {
        this.state.ocrInProgress = false;
        
        if (success && found) {
            this.state.lastSuccessfulOCR = Date.now();
            this.state.consecutiveFailures = 0; // Reset failure count
        } else {
            this.state.consecutiveFailures++;
        }
    }

    /**
     * Record UI detection failure to help determine OCR need
     */
    recordUIFailure(failureType: string): void {
        const now = Date.now();
        this.state.recentUIFailures.push(failureType);
        
        // Keep only last 5 failures
        if (this.state.recentUIFailures.length > 5) {
            this.state.recentUIFailures.shift();
        }
    }

    /**
     * Check if there's a pattern of recent UI failures
     */
    hasRecentFailurePattern(): boolean {
        return this.state.recentUIFailures.length >= 2;
    }

    /**
     * Check if Cursor window is currently active
     */
    isCursorWindowActive(): boolean {
        // Check if the active window is Cursor
        const activeEditor = vscode.window.activeTextEditor;
        const visibleEditors = vscode.window.visibleTextEditors;
        
        // Basic heuristic: if we have active editors, assume Cursor is active
        // In a real implementation, you might check window focus via native APIs
        return activeEditor !== undefined || visibleEditors.length > 0;
    }

    /**
     * Check for recent user interactions that might indicate manual handling
     */
    checkRecentUserInteraction(): boolean {
        // This is a simplified check - in practice you'd monitor:
        // - Recent key presses
        // - Recent mouse clicks
        // - Recent command executions
        // - Recent document changes by user (not automated)
        
        // For now, we'll use a simple heuristic based on recent document changes
        const now = Date.now();
        // If there were recent non-automated document changes, assume user interaction
        // This would need to be implemented with proper tracking
        return false; // Placeholder
    }

    /**
     * Get current OCR manager status for debugging
     */
    getStatus(): {
        lastOCRAttempt: string;
        lastSuccessfulOCR: string;
        consecutiveFailures: number;
        ocrInProgress: boolean;
        suppressedUntil: string;
        recentFailures: string[];
    } {
        const formatTime = (timestamp: number) => 
            timestamp > 0 ? new Date(timestamp).toLocaleTimeString() : 'Never';

        return {
            lastOCRAttempt: formatTime(this.state.lastOCRAttempt),
            lastSuccessfulOCR: formatTime(this.state.lastSuccessfulOCR),
            consecutiveFailures: this.state.consecutiveFailures,
            ocrInProgress: this.state.ocrInProgress,
            suppressedUntil: formatTime(this.state.suppressUntil),
            recentFailures: [...this.state.recentUIFailures]
        };
    }

    /**
     * Reset OCR manager state (for testing or manual reset)
     */
    reset(): void {
        this.state = {
            lastOCRAttempt: 0,
            lastSuccessfulOCR: 0,
            consecutiveFailures: 0,
            recentUIFailures: [],
            ocrInProgress: false,
            suppressUntil: 0
        };
    }

    /**
     * Force enable OCR (bypass all restrictions) - for manual testing
     */
    forceEnableOCR(): void {
        this.state.suppressUntil = 0;
        this.state.consecutiveFailures = 0;
        this.state.ocrInProgress = false;
    }
}

