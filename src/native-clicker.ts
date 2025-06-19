import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ClickResult {
    success: boolean;
    method: string;
    error?: string;
    coordinates?: { x: number; y: number };
}

export class NativeClicker {
    private readonly platform = process.platform;

    /**
     * Performs a native mouse click at the specified coordinates
     */
    async clickAt(x: number, y: number): Promise<ClickResult> {
        try {
            switch (this.platform) {
                case 'darwin':
                    return await this.clickMacOS(x, y);
                case 'win32':
                    return await this.clickWindows(x, y);
                case 'linux':
                    return await this.clickLinux(x, y);
                default:
                    return {
                        success: false,
                        method: 'unsupported',
                        error: `Platform ${String(this.platform)} not supported`
                    };
            }
        } catch (error) {
            return {
                success: false,
                method: 'error',
                error: `Click failed: ${String(error)}`,
                coordinates: { x, y }
            };
        }
    }

    /**
     * macOS implementation using AppleScript
     */
    private async clickMacOS(x: number, y: number): Promise<ClickResult> {
        try {
            // Use AppleScript to perform click
            const script = `tell application "System Events" to click at {${x}, ${y}}`;
            const command = `osascript -e "${script}"`;
            
            await execAsync(command);
            
            return {
                success: true,
                method: 'applescript',
                coordinates: { x, y }
            };
        } catch {
            // Fallback to alternative macOS method
            return await this.clickMacOSAlternative(x, y);
        }
    }

    /**
     * Alternative macOS implementation using CGEvent
     */
    private async clickMacOSAlternative(x: number, y: number): Promise<ClickResult> {
        try {
            // Create a temporary Python script for clicking (more reliable)
            const pythonScript = `
import Quartz
import time

def click_at(x, y):
    # Create mouse down event
    mouse_down = Quartz.CGEventCreateMouseEvent(
        None, Quartz.kCGEventLeftMouseDown, (x, y), Quartz.kCGMouseButtonLeft
    )
    
    # Create mouse up event
    mouse_up = Quartz.CGEventCreateMouseEvent(
        None, Quartz.kCGEventLeftMouseUp, (x, y), Quartz.kCGMouseButtonLeft
    )
    
    # Post events
    Quartz.CGEventPost(Quartz.kCGHIDEventTap, mouse_down)
    time.sleep(0.01)  # Small delay
    Quartz.CGEventPost(Quartz.kCGHIDEventTap, mouse_up)

click_at(${x}, ${y})
`;

            const command = `python3 -c "${pythonScript.replace(/\n/g, '; ')}"`;
            await execAsync(command);

            return {
                success: true,
                method: 'quartz',
                coordinates: { x, y }
            };
        } catch (error) {
            return {
                success: false,
                method: 'quartz-failed',
                error: `Alternative macOS click failed: ${String(error)}`,
                coordinates: { x, y }
            };
        }
    }

    /**
     * Windows implementation using PowerShell
     */
    private async clickWindows(x: number, y: number): Promise<ClickResult> {
        try {
            const powershellScript = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Set cursor position
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x}, ${y})

# Simulate click
[System.Runtime.InteropServices.DllImport("user32.dll")]
param([int]$X, [int]$Y)

# Mouse down
[System.Windows.Forms.Application]::DoEvents()
[System.Threading.Thread]::Sleep(10)

# Use mouse_event to click
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Mouse {
    [DllImport("user32.dll")]
    public static extern void mouse_event(int dwFlags, int dx, int dy, int cButtons, int dwExtraInfo);
    public const int MOUSEEVENTF_LEFTDOWN = 0x02;
    public const int MOUSEEVENTF_LEFTUP = 0x04;
}
"@

[Mouse]::mouse_event([Mouse]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
[System.Threading.Thread]::Sleep(10)
[Mouse]::mouse_event([Mouse]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
`;

            const command = `powershell -Command "${powershellScript.replace(/\n/g, '; ')}"`;
            await execAsync(command);

            return {
                success: true,
                method: 'powershell',
                coordinates: { x, y }
            };
        } catch (error) {
            return {
                success: false,
                method: 'powershell-failed',
                error: `Windows click failed: ${String(error)}`,
                coordinates: { x, y }
            };
        }
    }

    /**
     * Linux implementation using xdotool
     */
    private async clickLinux(x: number, y: number): Promise<ClickResult> {
        try {
            // Try xdotool first
            const command = `xdotool mousemove ${x} ${y} click 1`;
            await execAsync(command);

            return {
                success: true,
                method: 'xdotool',
                coordinates: { x, y }
            };
        } catch (error) {
            // Fallback to xte
            return await this.clickLinuxXte(x, y);
        }
    }

    /**
     * Linux fallback using xte
     */
    private async clickLinuxXte(x: number, y: number): Promise<ClickResult> {
        try {
            const moveCommand = `xte "mousemove ${x} ${y}"`;
            const clickCommand = `xte "mouseclick 1"`;
            
            await execAsync(moveCommand);
            await execAsync(clickCommand);

            return {
                success: true,
                method: 'xte',
                coordinates: { x, y }
            };
        } catch (error) {
            return {
                success: false,
                method: 'linux-failed',
                error: `Linux click failed: ${String(error)}`,
                coordinates: { x, y }
            };
        }
    }

    /**
     * Test click at current mouse position
     */
    async testClick(): Promise<ClickResult> {
        // Use a safe test position (center of screen)
        const testX = 100;
        const testY = 100;
        
        return await this.clickAt(testX, testY);
    }

    /**
     * Get current mouse position (if possible)
     */
    async getCurrentMousePosition(): Promise<{ x: number; y: number } | null> {
        try {
            switch (this.platform) {
                case 'darwin':
                    const { stdout } = await execAsync('python3 -c "import Quartz; print(Quartz.NSEvent.mouseLocation())"');
                    // Parse the output: NSPoint: {x, y}
                    const match = stdout.match(/\{(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)\}/);
                    if (match) {
                        return {
                            x: Math.round(parseFloat(match[1])),
                            y: Math.round(parseFloat(match[2]))
                        };
                    }
                    break;
                case 'linux':
                    const { stdout: linuxOut } = await execAsync('xdotool getmouselocation');
                    const linuxMatch = linuxOut.match(/x:(\d+) y:(\d+)/);
                    if (linuxMatch) {
                        return {
                            x: parseInt(linuxMatch[1]),
                            y: parseInt(linuxMatch[2])
                        };
                    }
                    break;
            }
            return null;
        } catch {
            return null;
        }
    }

    /**
     * Check if native clicking is available on this platform
     */
    isSupported(): boolean {
        return ['darwin', 'win32', 'linux'].includes(this.platform);
    }

    /**
     * Get platform-specific requirements
     */
    getRequirements(): string[] {
        switch (this.platform) {
            case 'darwin':
                return ['AppleScript', 'Python3 with Quartz (optional)'];
            case 'win32':
                return ['PowerShell'];
            case 'linux':
                return ['xdotool or xte'];
            default:
                return ['Not supported'];
        }
    }
}

