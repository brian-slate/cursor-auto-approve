import { createWorker } from 'tesseract.js';
const screenshot = require('screenshot-desktop');

export interface ButtonLocation {
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
}

export interface OCRResult {
    foundPrompt: boolean;
    promptText: string;
    buttonLocation?: ButtonLocation;
    confidence: number;
}

export class OCRDetection {
    private worker: any;
    private isInitialized = false;
    private readonly continueButtonPatterns = [
        /continue/i,
        /resume/i,
        /proceed/i,
        /yes.*continue/i,
        /skip.*continue/i
    ];

    private readonly promptPatterns = [
        /we default stop the agent after \d+ tool calls/i,
        /reached.*tool call limit/i,
        /25 tool calls/i,
        /tool call limit/i,
        /please ask.*continue manually/i
    ];

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            this.worker = await createWorker('eng');
            this.isInitialized = true;
            console.log('OCR worker initialized successfully');
        } catch (error) {
            console.error('Failed to initialize OCR worker:', error);
            throw error;
        }
    }

    async detectContinuePrompt(): Promise<OCRResult> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            // Take screenshot
            const screenshotBuffer = await this.takeScreenshot();
            
            // Process with OCR
            const ocrText = await this.extractText(screenshotBuffer);
            
            // Check for prompt patterns
            const foundPrompt = this.hasPromptPattern(ocrText);
            
            if (foundPrompt) {
                // Try to find continue button location
                const buttonLocation = await this.findButtonLocation(screenshotBuffer, ocrText);
                
                return {
                    foundPrompt: true,
                    promptText: ocrText,
                    buttonLocation,
                    confidence: buttonLocation ? buttonLocation.confidence : 0.5
                };
            }

            return {
                foundPrompt: false,
                promptText: ocrText,
                confidence: 0
            };

        } catch (error) {
            console.error('OCR detection failed:', error);
            return {
                foundPrompt: false,
                promptText: '',
                confidence: 0
            };
        }
    }

    private async takeScreenshot(): Promise<Buffer> {
        try {
            // Get primary display screenshot
            const img = await screenshot({ format: 'png' });
            
            // Convert to buffer if needed
            if (Buffer.isBuffer(img)) {
                return img;
            }
            
            // Handle case where img might be a path or other format
            return Buffer.from(img as any);
        } catch (error) {
            console.error('Screenshot failed:', error);
            throw new Error('Failed to capture screenshot');
        }
    }

    private async extractText(imageBuffer: Buffer): Promise<string> {
        try {
            const { data: { text } } = await this.worker.recognize(imageBuffer);
            return text;
        } catch (error) {
            console.error('OCR text extraction failed:', error);
            return '';
        }
    }

    private hasPromptPattern(text: string): boolean {
        return this.promptPatterns.some(pattern => pattern.test(text));
    }

    private async findButtonLocation(imageBuffer: Buffer, ocrText: string): Promise<ButtonLocation | undefined> {
        try {
            // Get detailed OCR results with bounding boxes
            const { data } = await this.worker.recognize(imageBuffer, {
                rectangle: undefined // Analyze entire image
            });

            const words = data.words || [];
            
            // Look for continue button text with bounding boxes
            for (const word of words) {
                const wordText = word.text?.toLowerCase() || '';
                const hasButtonPattern = this.continueButtonPatterns.some(pattern => 
                    pattern.test(wordText)
                );

                if (hasButtonPattern && word.bbox) {
                    // Calculate center point of the button
                    const centerX = word.bbox.x0 + (word.bbox.x1 - word.bbox.x0) / 2;
                    const centerY = word.bbox.y0 + (word.bbox.y1 - word.bbox.y0) / 2;

                    return {
                        x: Math.round(centerX),
                        y: Math.round(centerY),
                        width: word.bbox.x1 - word.bbox.x0,
                        height: word.bbox.y1 - word.bbox.y0,
                        confidence: word.confidence || 0.5
                    };
                }
            }

            // Fallback: look for button-like patterns near prompt text
            return this.findButtonNearPrompt(words, ocrText);

        } catch (error) {
            console.error('Button location detection failed:', error);
            return undefined;
        }
    }

    private findButtonNearPrompt(words: any[], _ocrText: string): ButtonLocation | undefined {
        // Simple heuristic: look for common button words near the bottom-right of detected prompt area
        const buttonWords = words.filter(word => {
            const text = word.text?.toLowerCase() || '';
            return this.continueButtonPatterns.some(pattern => pattern.test(text));
        });

        if (buttonWords.length > 0) {
            // Take the first matching button word
            const button = buttonWords[0];
            if (button.bbox) {
                return {
                    x: Math.round(button.bbox.x0 + (button.bbox.x1 - button.bbox.x0) / 2),
                    y: Math.round(button.bbox.y0 + (button.bbox.y1 - button.bbox.y0) / 2),
                    width: button.bbox.x1 - button.bbox.x0,
                    height: button.bbox.y1 - button.bbox.y0,
                    confidence: button.confidence || 0.3
                };
            }
        }

        return undefined;
    }

    async dispose(): Promise<void> {
        if (this.worker && this.isInitialized) {
            await this.worker.terminate();
            this.isInitialized = false;
        }
    }

    // Test method for development
    async testOCR(): Promise<{ text: string; hasPrompt: boolean }> {
        try {
            const result = await this.detectContinuePrompt();
            return {
                text: result.promptText,
                hasPrompt: result.foundPrompt
            };
        } catch (error) {
            return {
                text: `Error: ${String(error)}`,
                hasPrompt: false
            };
        }
    }
}

