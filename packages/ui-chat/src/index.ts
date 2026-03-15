/**
 * @repo/ui-chat
 *
 * Shared conversational UI package for the sgdivorceai B2B SME suite.
 * Built on the Vercel AI SDK — provides a premium streaming chat interface.
 *
 * Consumers: sg-grant, sg-visa, sg-import
 */

// ── Component Exports ──
export { ChatInterface } from "./components/chat-interface";
export type { ChatInterfaceProps } from "./components/chat-interface";
export { TypingIndicator } from "./components/typing-indicator";

// ── Type Exports ──
// Purpose: Defines the standard shape of a chat message within the UI Chat package.
export type ChatMessage = {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
};

// Purpose: Configures the underlying LLM settings for the chat instance.
export type ChatConfig = {
    /** The LLM model identifier to use (e.g. "gemini-2.5-pro") */
    model: string;
    /** Optional system prompt context */
    systemPrompt?: string;
};

export const UI_CHAT_VERSION = "1.0.0";
