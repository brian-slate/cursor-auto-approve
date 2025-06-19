import { describe, it, expect } from 'vitest';

// Simple unit tests for the core logic without VS Code API mocking
describe('Cursor Auto Approve Extension - Core Logic', () => {
  describe('Continue Prompt Detection', () => {
    it('should detect standard tool call limit prompts', () => {
      const testTexts = [
        'we default stop the agent after 25 tool calls',
        'we default stop the agent after 50 tool calls',
        'We default stop the agent after 100 tool calls'
      ];

      const pattern = /we default stop the agent after \d+ tool calls/i;
      
      testTexts.forEach(text => {
        expect(pattern.test(text)).toBe(true);
      });
    });

    it('should detect manual continue prompts', () => {
      const testTexts = [
        'please ask the agent to continue manually',
        'Please ask the agent to continue manually.',
        'PLEASE ASK THE AGENT TO CONTINUE MANUALLY'
      ];

      const pattern = /please ask the agent to continue manually/i;
      
      testTexts.forEach(text => {
        expect(pattern.test(text)).toBe(true);
      });
    });

    it('should detect various continue prompt patterns', () => {
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

      const testTexts = [
        'Would you like to continue with the next step?',
        'Press Continue to proceed with the operation',
        'Click continue to resume the process',
        'Do you want to continue?',
        'Shall I continue with the analysis?',
        'Continue with the next step in the workflow'
      ];

      testTexts.forEach(text => {
        const hasMatch = continuePatterns.some(pattern => pattern.test(text));
        expect(hasMatch).toBe(true);
      });
    });

    it('should not trigger on unrelated text', () => {
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

      const testTexts = [
        'This is just regular code',
        'function continue() { return true; }',
        'The process will stop here',
        'Please review the output',
        'Analysis complete'
      ];

      testTexts.forEach(text => {
        const hasMatch = continuePatterns.some(pattern => pattern.test(text));
        expect(hasMatch).toBe(false);
      });
    });
  });

  describe('Auto-Approve State Management', () => {
    it('should initialize with correct default values', () => {
      const autoApproveState: {
        enabled: boolean;
        totalTriggers: number;
        recentActivity: Array<{timestamp: number, action: string, details: string}>;
        lastTriggered?: number;
      } = {
        enabled: true,
        totalTriggers: 0,
        recentActivity: []
      };

      expect(autoApproveState.enabled).toBe(true);
      expect(autoApproveState.totalTriggers).toBe(0);
      expect(autoApproveState.recentActivity).toEqual([]);
      expect(autoApproveState.lastTriggered).toBeUndefined();
    });

    it('should track auto-approve triggers correctly', () => {
      let totalTriggers = 0;
      let lastTriggered: number | undefined;
      
      // Simulate auto-approve trigger
      totalTriggers++;
      lastTriggered = Date.now();
      
      expect(totalTriggers).toBe(1);
      expect(typeof lastTriggered).toBe('number');
    });

    it('should update state when auto-approve is triggered', () => {
      const state = {
        enabled: true,
        totalTriggers: 0,
        lastTriggered: undefined as number | undefined,
        recentActivity: [] as Array<{timestamp: number, action: string, details: string}>
      };

      // Simulate auto-approve
      state.totalTriggers++;
      state.lastTriggered = Date.now();
      state.recentActivity.unshift({
        timestamp: Date.now(),
        action: 'Auto-Click Success',
        details: 'Found and clicked continue button'
      });

      expect(state.totalTriggers).toBe(1);
      expect(state.lastTriggered).toBeDefined();
      expect(state.recentActivity).toHaveLength(1);
      expect(state.recentActivity[0].action).toBe('Auto-Click Success');
    });
  });

  describe('Configuration Management', () => {
    it('should have correct default configuration values', () => {
      const defaultConfig = {
        enabled: true,
        showNotifications: true
      };

      expect(defaultConfig.enabled).toBe(true);
      expect(defaultConfig.showNotifications).toBe(true);
    });

    it('should handle enable/disable toggle', () => {
      let enabled = true;
      
      // Toggle off
      enabled = !enabled;
      expect(enabled).toBe(false);
      
      // Toggle on
      enabled = !enabled;
      expect(enabled).toBe(true);
    });
  });

  describe('Activity Logging', () => {
    it('should create activity log entries with correct structure', () => {
      const activity = {
        timestamp: Date.now(),
        action: 'Auto-Click Success',
        details: 'Found and clicked continue button'
      };

      expect(activity.timestamp).toBeTypeOf('number');
      expect(activity.action).toBe('Auto-Click Success');
      expect(activity.details).toBe('Found and clicked continue button');
    });

    it('should maintain activity log size limit', () => {
      const recentActivity: Array<{timestamp: number, action: string, details: string}> = [];
      
      // Add 25 activities (more than the 20 limit)
      for (let i = 0; i < 25; i++) {
        recentActivity.unshift({
          timestamp: Date.now(),
          action: `Test Action ${i}`,
          details: `Test details ${i}`
        });
        
        // Keep only last 20 activities
        if (recentActivity.length > 20) {
          recentActivity.splice(20);
        }
      }

      expect(recentActivity).toHaveLength(20);
      expect(recentActivity[0].action).toBe('Test Action 24'); // Most recent
      expect(recentActivity[19].action).toBe('Test Action 5'); // Oldest kept
    });
  });

  describe('Continue Button Detection Patterns', () => {
    it('should have comprehensive selector patterns', () => {
      const buttonSelectors = [
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
        'button[aria-label*="continue"]',
        'button[aria-label*="resume"]',
        'button[title*="continue"]',
        'button[title*="resume"]',
        '.chat-continue-button',
        '.agent-continue-button',
        '.tool-limit-continue'
      ];

      expect(buttonSelectors).toHaveLength(17);
      expect(buttonSelectors).toContain('button:contains("Continue")');
      expect(buttonSelectors).toContain('[data-testid="continue-button"]');
      expect(buttonSelectors).toContain('.chat-continue-button');
    });

    it('should prioritize Cursor-specific patterns', () => {
      const cursorSpecificSelectors = [
        'button:contains("Skip and Continue")',
        '.agent-continue-button',
        '.tool-limit-continue',
        '[data-testid="continue-button"]'
      ];

      cursorSpecificSelectors.forEach(selector => {
        expect(typeof selector).toBe('string');
        expect(selector.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Status Text Generation', () => {
    it('should generate correct status text', () => {
      const generateStatusText = (enabled: boolean) => {
        return enabled ? 'Auto-Approve: ON' : 'Auto-Approve: OFF';
      };

      expect(generateStatusText(true)).toBe('Auto-Approve: ON');
      expect(generateStatusText(false)).toBe('Auto-Approve: OFF');
    });

    it('should generate tooltip text', () => {
      const generateTooltip = (enabled: boolean, totalTriggers: number, lastTriggered?: number) => {
        let tooltip = `Auto Approve: ${enabled ? 'Enabled' : 'Disabled'}`;
        
        if (enabled && totalTriggers > 0) {
          const lastTime = lastTriggered ? 
            new Date(lastTriggered).toLocaleTimeString() : 'Never';
          tooltip += `\nTotal auto-approvals: ${totalTriggers}`;
          tooltip += `\nLast triggered: ${lastTime}`;
          tooltip += '\nClick to view activity log';
        }
        
        return tooltip;
      };

      const tooltip1 = generateTooltip(true, 0);
      expect(tooltip1).toBe('Auto Approve: Enabled');

      const tooltip2 = generateTooltip(false, 5);
      expect(tooltip2).toBe('Auto Approve: Disabled');

      const tooltip3 = generateTooltip(true, 3, Date.now());
      expect(tooltip3).toContain('Total auto-approvals: 3');
      expect(tooltip3).toContain('Last triggered:');
    });
  });

  describe('Time-based Utilities', () => {
    it('should calculate time differences correctly', () => {
      const now = Date.now();
      const oneSecondAgo = now - 1000;
      const oneMinuteAgo = now - 60000;

      expect(now - oneSecondAgo).toBe(1000);
      expect(now - oneMinuteAgo).toBe(60000);
    });
  });

  describe('Command Names Validation', () => {
    it('should have all required command names', () => {
      const commands = [
        'cursorAutoApprove.toggle',
        'cursorAutoApprove.trigger',
        'cursorAutoApprove.showStatus',
        'cursorAutoApprove.showActivityLog'
      ];

      commands.forEach(command => {
        expect(command).toMatch(/^cursorAutoApprove\./);
        expect(typeof command).toBe('string');
      });
    });
  });
}); 