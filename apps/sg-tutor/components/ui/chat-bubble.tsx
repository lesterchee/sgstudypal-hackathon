// Purpose: Chat Bubble Component — renders individual chat messages in the
// AI Tutor conversation. Handles three message types: user messages, AI
// responses, and system alerts (including image rejection with inline re-upload).
// If a message has `status: "image_rejected"`, renders an inline HTML5 dropzone
// directly inside the bubble for immediate re-upload, bypassing the dashboard queue.

"use client";

import { useState, useCallback } from "react";
import { Upload, Bot, User, AlertTriangle } from "lucide-react";

const UploadIcon = Upload as any;
const BotIcon = Bot as any;
const UserIcon = User as any;
const AlertTriangleIcon = AlertTriangle as any;

// Purpose: Message role type — determines bubble alignment and styling.
type MessageRole = 'user' | 'assistant' | 'system';

// Purpose: Props for an individual chat message.
interface ChatBubbleProps {
    role: MessageRole;
    content: string;
    /** Purpose: Optional status field — when "image_rejected", renders
     *  an inline dropzone for immediate re-upload inside the bubble. */
    status?: 'image_rejected' | string;
    /** Purpose: Optional reason code from the Vision Bouncer (e.g., "blurry_diagram"). */
    reasonCode?: string;
    /** Purpose: Callback fired when a re-upload file is selected from the inline dropzone. */
    onReUpload?: (file: File) => void;
}

// Purpose: Main component — renders a styled chat bubble with role-based
// alignment (user right, assistant left) and optional inline re-upload dropzone.
export default function ChatBubble({
    role,
    content,
    status,
    reasonCode,
    onReUpload,
}: ChatBubbleProps) {
    // Purpose: Track whether a file has been re-uploaded via the inline dropzone.
    const [reUploaded, setReUploaded] = useState(false);

    // Purpose: Handle file selection from the inline dropzone.
    const handleReUpload = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file && onReUpload) {
                onReUpload(file);
                setReUploaded(true);
            }
        },
        [onReUpload]
    );

    // Purpose: Handle drag-and-drop onto the inline dropzone.
    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/') && onReUpload) {
                onReUpload(file);
                setReUploaded(true);
            }
        },
        [onReUpload]
    );

    const isUser = role === 'user';
    const isRejection = status === 'image_rejected';

    return (
        <div
            className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
        >
            {/* Purpose: Avatar indicator — user or AI bot icon. */}
            <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser
                        ? 'bg-violet-100 text-violet-600'
                        : 'bg-slate-100 text-slate-600'
                    }`}
            >
                {isUser ? <UserIcon size={16} /> : <BotIcon size={16} />}
            </div>

            {/* Purpose: Message bubble container — styled by role and rejection status. */}
            <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${isUser
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                        : isRejection
                            ? 'bg-amber-50 border-2 border-amber-300 text-amber-900'
                            : 'bg-white border border-slate-200 text-slate-900'
                    }`}
            >
                {/* Purpose: Rejection header badge — shown only for image_rejected status. */}
                {isRejection && (
                    <div className="flex items-center gap-1.5 mb-2">
                        <AlertTriangleIcon size={14} className="text-amber-600" />
                        <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                            Image Rejected
                        </span>
                        {reasonCode && (
                            <span className="text-[10px] text-amber-500 font-mono bg-amber-100 px-1.5 py-0.5 rounded">
                                {reasonCode}
                            </span>
                        )}
                    </div>
                )}

                {/* Purpose: Message text content. */}
                <p className={`text-sm leading-relaxed ${isUser ? 'text-white' : ''}`}>
                    {content}
                </p>

                {/* Purpose: Inline re-upload dropzone — rendered ONLY when the message
                    has status "image_rejected". Allows immediate re-upload without
                    navigating back to the dashboard queue. */}
                {isRejection && !reUploaded && (
                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        className="mt-3 flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-amber-300 bg-amber-100/40 hover:bg-amber-100/70 transition-all cursor-pointer"
                    >
                        <label className="flex flex-col items-center cursor-pointer w-full">
                            <UploadIcon size={20} className="text-amber-500 mb-1" />
                            <p className="text-xs font-semibold text-amber-700">
                                Drop a clearer photo here to re-upload
                            </p>
                            <p className="text-[10px] text-amber-500 mt-0.5">
                                PNG, JPEG, WebP supported
                            </p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleReUpload}
                                className="hidden"
                            />
                        </label>
                    </div>
                )}

                {/* Purpose: Success confirmation after a re-upload via the inline dropzone. */}
                {isRejection && reUploaded && (
                    <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                        <span className="text-xs font-semibold text-emerald-700">
                            ✅ New photo uploaded! Processing...
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
