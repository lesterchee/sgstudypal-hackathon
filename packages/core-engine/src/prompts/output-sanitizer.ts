export class OutputSanitizer {
    private buffer: string = '';
    private readonly redactionMessage = '[Redacted for Legal Compliance: I am an AI and cannot provide specific legal directives. Please consult a qualified practitioner for this step.]';

    // Regex looking for prescriptive legal verbs: "must file", "should petition", "advise that you" etc.
    private readonly uplRegex1 = /(must|should)\s+(file|sue|petition)/i;
    private readonly uplRegex2 = /(advise|recommend)\s+that\s+you/i;

    private readonly windowSize = 50; // Buffer window to catch regex matches that span across chunks

    constructor() { }

    /**
     * Sanitizes a chunk of text. Retains a small buffer to ensure we don't miss 
     * regex matches that get split across stream chunks.
     */
    public processChunk(chunk: string): string {
        this.buffer += chunk;

        let shouldRedact = false;
        if (this.uplRegex1.test(this.buffer) || this.uplRegex2.test(this.buffer)) {
            shouldRedact = true;
        }

        if (shouldRedact) {
            // Apply redaction. We clear the buffer and just return the redaction message.
            this.buffer = ''; // Reset buffer after a redaction to avoid multi-triggering
            return `\n\n${this.redactionMessage}\n\n`;
        }

        // If no redaction, emit the safe part of the buffer and keep the tail for the next chunk
        if (this.buffer.length > this.windowSize) {
            const emitLength = this.buffer.length - this.windowSize;
            const safeOutput = this.buffer.slice(0, emitLength);
            this.buffer = this.buffer.slice(emitLength);
            return safeOutput;
        }

        return ''; // Wait for more chunks to fill the window
    }

    /**
     * Called when the stream ends to flush the remaining valid buffer.
     */
    public flush(): string {
        let shouldRedact = false;
        if (this.uplRegex1.test(this.buffer) || this.uplRegex2.test(this.buffer)) {
            shouldRedact = true;
        }

        if (shouldRedact) {
            this.buffer = '';
            return `\n\n${this.redactionMessage}\n\n`;
        }

        const safeOutput = this.buffer;
        this.buffer = '';
        return safeOutput;
    }

    /**
     * Returns a native TransformStream for web stream piping.
     */
    public getTransformStream(): TransformStream<string, string> {
        return new TransformStream({
            start: () => { },
            transform: (chunk, controller) => {
                const safePart = this.processChunk(chunk);
                if (safePart) {
                    controller.enqueue(safePart);
                }
            },
            flush: (controller) => {
                const finalPart = this.flush();
                if (finalPart) {
                    controller.enqueue(finalPart);
                }
            }
        });
    }
}
