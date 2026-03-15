// Purpose: Sprint 114 — Live Tutor canvas integrated with the audited
// Gemini Live WebSocket pipeline. Consumes useMediaDevices (camera/mic) and
// useGeminiLive (WS state machine + media encoding) without mutating them.
"use client";

import { useEffect, useState, useCallback, useRef as useReactRef } from "react";
import { Video, Mic, VideoOff, MicOff, Sparkles, Loader2 } from "lucide-react";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { useGeminiLive, type GeminiToolCall, type ActivityLog } from "@/hooks/useGeminiLive";
import confetti from "canvas-confetti";

const VideoIcon = Video as any;
const MicIcon = Mic as any;
const VideoOffIcon = VideoOff as any;
const MicOffIcon = MicOff as any;
const SparklesIcon = Sparkles as any;
const Loader2Icon = Loader2 as any;

// Purpose: Sprint 143 — Icon color map for activity log types.
const LOG_COLORS: Record<ActivityLog["type"], string> = {
    system: "text-emerald-400",
    agent: "text-violet-400",
    user: "text-blue-400",
    vision: "text-cyan-400",
};
const LOG_LABELS: Record<ActivityLog["type"], string> = {
    system: "SYS",
    agent: "AI",
    user: "YOU",
    vision: "CAM",
};

export default function LiveTutorPage() {
    // Purpose: Consume the audited hardware hook — provides stream, videoRef,
    // toggle controls, permission state, and cleanup.
    const {
        stream,
        videoRef,
        isMicOn,
        isCameraOn,
        permissionState,
        error: mediaError,
        startMedia,
        toggleMic,
        toggleCamera,
        stopMedia,
    } = useMediaDevices();

    // Purpose: Consume the audited WebSocket state machine — manages the full
    // Gemini Live lifecycle: token fetch → WS open → setup → media pipelines.
    const {
        status,
        error: wsError,
        connect,
        disconnect,
        isSetupComplete,
        onToolCall,
        sendMessage,
        isVideoOn,
        toggleVideo,
        isMicOn: geminiMicOn,
        toggleMic: geminiToggleMic,
        startAudioPipeline,
        startVideoPipeline,
        stopVideoPipeline,
        stopAudioPipeline,
        activityStream,
        addLog,
    } = useGeminiLive();

    // Purpose: Sprint 130 — Confetti trigger for correct answers (gamification lite).
    const [showConfetti, setShowConfetti] = useState(false);

    // Purpose: SSR-safe read of persona and interest from Settings (localStorage).
    const [persona, setPersona] = useState("Captain Nova");
    const [interest, setInterest] = useState("Minecraft");

    // Purpose: Sprint 156 — Pre-flight Form State
    const [userName, setUserName] = useState("");
    const [interests, setInterests] = useState("");
    const [isSessionActive, setIsSessionActive] = useState(false);

    useEffect(() => {
        setPersona(localStorage.getItem("tutorPersona") || "Captain Nova");
        setInterest(localStorage.getItem("studentInterests") || "Minecraft");
    }, []);

    // Purpose: Sprint 143 — Auto-scroll activity stream.
    const activityEndRef = useReactRef<HTMLDivElement>(null);

    // Purpose: Sprint 117 — NO auto-start. Camera only activates on Connect.

    // Purpose: Sprint 142 — NO MONOLITH. Video and audio pipelines are independent.

    // Purpose: Sprint 142 — Video pipeline: only runs when camera is ON.
    // Starts the rAF frame capture loop; stops it completely when video is toggled off.
    useEffect(() => {
        if (isSetupComplete && isVideoOn && stream && videoRef.current) {
            startVideoPipeline(videoRef.current);
        } else {
            stopVideoPipeline();
        }
        return () => stopVideoPipeline();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSetupComplete, isVideoOn, stream]);

    // Purpose: Sprint 142 — Audio pipeline: starts on setup, independent of video.
    useEffect(() => {
        if (isSetupComplete && stream) {
            startAudioPipeline(stream);
            console.log("[UI] Audio pipeline started (independent of video)");
        }
        return () => stopAudioPipeline();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSetupComplete, stream]);

    // Purpose: Sprint 117 — Cleanup on unmount/navigate-away. Ensures the
    // webcam green light dies and WebSocket is torn down.
    useEffect(() => {
        return () => {
            stopMedia();
            stopAudioPipeline();
            stopVideoPipeline();
            disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Purpose: Sprint 137 — Re-bind the hardware stream to the <video> element
    // whenever isVideoOn flips to true. This is necessary because the <video>
    // element conditionally renders based on isVideoOn, so the stream must be
    // re-attached each time the element mounts.
    useEffect(() => {
        if (isVideoOn && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
            console.log("[UI] Video stream successfully bound to video element.");
        }
    }, [isVideoOn, stream]);

    // Purpose: Sprint 117 — Explicit session lifecycle. Hardware is only
    // requested when clicking Connect; explicitly killed on End Session.
    const handleSessionToggle = async () => {
        if (status === "connected" || status === "connecting") {
            // Purpose: End session — stop encoding, disconnect WS, kill hardware.
            stopAudioPipeline();
            stopVideoPipeline();
            disconnect();
            stopMedia();
            return;
        }
        // Purpose: Start session — request hardware first, then initiate WS.
        setShowConfetti(false);
        await startMedia();

        connect({
            activeQuestion: "General Curiosity",
            persona,
            interest,
            userName,
            interests,
        });
    };

    // Purpose: Sprint 130 — Handle inbound tool calls from Gemini AI (simplified).
    const handleToolCall = useCallback(
        (call: GeminiToolCall) => {
            switch (call.name) {
                case "submit_answer_and_attack": {
                    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
                    setShowConfetti(true);
                    setTimeout(() => setShowConfetti(false), 2000);

                    if (call.id) {
                        sendMessage({
                            tool_response: {
                                function_responses: [{
                                    id: call.id,
                                    name: call.name,
                                    response: { result: { success: true, message: "Correct answer celebrated!" } },
                                }],
                            },
                        });
                    }
                    break;
                }
                case "log_student_progress": {
                    console.log("[TutorGwen] 📊 Progress logged:", call.args);
                    if (call.id) {
                        sendMessage({
                            tool_response: {
                                function_responses: [{
                                    id: call.id,
                                    name: call.name,
                                    response: { result: { logged: true } },
                                }],
                            },
                        });
                    }
                    break;
                }
                default:
                    console.warn(`[TutorGwen] Unknown tool call: ${call.name}`);
            }
        },
        [sendMessage]
    );

    // Purpose: Register the tool call handler with the Gemini Live hook.
    useEffect(() => {
        onToolCall(handleToolCall);
    }, [onToolCall, handleToolCall]);

    // Purpose: Sprint 154 — Debounced auto-scroll to prevent layout thrashing
    // during rapid-fire AI transcript streaming.
    useEffect(() => {
        const timer = setTimeout(() => {
            activityEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 150);
        return () => clearTimeout(timer);
    }, [activityStream]);

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-slate-950 p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    ✨ Curiosity Companion <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 font-medium">Alpha</span>
                </h1>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                    Interactive conversational learning for curious minds through AI.
                </p>
            </div>

            {/* Purpose: Sprint 156 — Pre-flight Form vs Live Tutor UI */}
            {!isSessionActive ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto w-full min-h-[500px] mb-8 mt-4 animate-in fade-in duration-500">
                    <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/40 rounded-full flex items-center justify-center mb-6">
                        <SparklesIcon size={32} className="text-violet-600 dark:text-violet-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">Ready for Discovery?</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400 text-center mb-8">
                        Tell Gwen a bit about yourself so she can personalize your session.
                    </p>
                    
                    <div className="w-full space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Student's Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Leo"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">3 Topics of Interest</label>
                            <input
                                type="text"
                                placeholder="e.g. Dinosaurs, Space, Robots"
                                value={interests}
                                onChange={(e) => setInterests(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-600"
                            />
                        </div>
                        <button
                            onClick={() => setIsSessionActive(true)}
                            disabled={!userName.trim() || !interests.trim()}
                            className="w-full mt-4 py-3.5 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-300 disabled:dark:bg-slate-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            Start Discovery Session
                        </button>
                    </div>
                </div>
            ) : (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 min-h-0">

                {/* LEFT COLUMN: Arena Canvas */}
                <div className="bg-gray-900 rounded-2xl border border-gray-200 dark:border-slate-800 relative overflow-hidden shadow-sm min-h-[500px]">

                    {/* Central Arena: AI Avatar */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                        {status === "connected" ? (
                            <div className="flex flex-col items-center justify-center animate-in zoom-in-95 duration-700">
                                <div className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500 ${
                                    isSetupComplete
                                        ? "shadow-[0_0_60px_rgba(124,58,237,0.6)] scale-105"
                                        : "shadow-[0_0_20px_rgba(124,58,237,0.2)] scale-100"
                                }`}>
                                    <div className="absolute inset-0 bg-violet-600/20 rounded-full animate-pulse" />
                                    <div className="w-32 h-32 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center shadow-inner relative z-10">
                                        <SparklesIcon size={64} className="text-white" />
                                    </div>
                                </div>

                                <div className="mt-8 flex items-center gap-2.5">
                                    <h2 className="text-2xl font-bold text-white tracking-wide">Tutor Gwen</h2>
                                    <div
                                        className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                                            isSetupComplete
                                                ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"
                                                : status === "connected"
                                                    ? "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)] animate-pulse"
                                                    : "bg-red-500"
                                        }`}
                                        title={isSetupComplete ? "Connected & Ready" : status === "connected" ? "Connecting to AI..." : "Disconnected"}
                                    />
                                </div>
                                <p className="text-violet-300 text-sm mt-2 font-medium">
                                    {isSetupComplete ? "Listening & Speaking..." : "Tutor Gwen is joining soon..."}
                                </p>

                                {isSetupComplete && (
                                    <div className="flex gap-1.5 mt-4">
                                        <span className="w-1.5 h-3 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-1.5 h-4 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "100ms" }} />
                                        <span className="w-1.5 h-5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "200ms" }} />
                                        <span className="w-1.5 h-4 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                        <span className="w-1.5 h-3 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "400ms" }} />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-gray-500">
                                {permissionState === "denied" ? (
                                    <>
                                        <div className="mb-4 text-6xl">🔒</div>
                                        <h2 className="text-xl font-medium text-gray-300">Camera Access Denied</h2>
                                        <p className="text-sm mt-2 text-gray-500">Please allow camera access in your browser settings</p>
                                    </>
                                ) : permissionState === "error" ? (
                                    <>
                                        <div className="mb-4 text-6xl">⚠️</div>
                                        <h2 className="text-xl font-medium text-gray-300">Camera Error</h2>
                                        <p className="text-sm mt-2 max-w-xs text-gray-500">{mediaError}</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="mb-4 text-6xl opacity-30">🎯</div>
                                        <h2 className="text-xl font-medium text-gray-400">Arena Offline</h2>
                                        <p className="text-sm mt-2 max-w-sm text-center opacity-70">
                                            Click Connect to enter the Live AI Tutor session.
                                        </p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Purpose: Sprint 149 — PiP Camera Container (1.5x enlarged) */}
                    <div className={`absolute bottom-24 right-6 w-72 h-54 bg-gray-900 rounded-xl border-2 border-gray-700 shadow-2xl overflow-hidden transition-all duration-500 z-20 ${
                        status === "connected"
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-4 pointer-events-none"
                    }`}>
                        {isVideoOn && stream ? (
                            <>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover scale-x-[-1]"
                                />
                                <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur text-white text-[10px] rounded font-medium">
                                    You
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                                <VideoOffIcon size={28} className="mb-2 opacity-60" />
                                <span className="text-[10px] font-medium">Camera Off</span>
                            </div>
                        )}
                    </div>

                    {/* Top-bar overlay */}
                    <div className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-4 pt-4">
                        <div className="flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-md">
                            <span className="relative flex h-3 w-3">
                                {(status === "connected" || status === "connecting") && (
                                    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${status === "connected" ? "bg-green-500" : "bg-yellow-500"}`} />
                                )}
                                <span className={`relative inline-flex h-3 w-3 rounded-full ${
                                    status === "connected" ? "bg-green-500" : status === "connecting" ? "bg-yellow-500" : status === "error" ? "bg-red-500" : "bg-gray-400"
                                }`} />
                            </span>
                            <span className="text-xs font-medium text-white">
                                {status === "connected" ? "Connected" : status === "connecting" ? "Connecting…" : status === "error" ? "Error" : "Idle"}
                            </span>
                        </div>
                        <div className="rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-md">
                            <span className="text-xs font-bold text-violet-400">SgStudyPal</span>
                        </div>
                    </div>

                    {/* Error banner */}
                    {(wsError || (mediaError && permissionState !== "error")) && (
                        <div className="absolute left-4 right-4 top-14 z-30 rounded-xl bg-red-900/80 px-4 py-3 backdrop-blur-md">
                            <p className="text-xs font-medium text-red-200">{wsError ?? mediaError}</p>
                        </div>
                    )}

                    {/* Control Bar */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-800/80 backdrop-blur-md px-6 py-3 rounded-full border border-gray-700 z-30">
                        <button
                            onClick={geminiToggleMic}
                            disabled={!stream}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed ${
                                geminiMicOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-500 hover:bg-red-600"
                            }`}
                        >
                            {geminiMicOn ? <MicIcon size={18} /> : <MicOffIcon size={18} />}
                        </button>
                        <button
                            onClick={toggleVideo}
                            disabled={!stream}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed ${
                                isVideoOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-500 hover:bg-red-600"
                            }`}
                        >
                            {isVideoOn ? <VideoIcon size={18} /> : <VideoOffIcon size={18} />}
                        </button>
                        <button
                            onClick={handleSessionToggle}
                            disabled={status === "connecting"}
                            className={`px-4 h-10 rounded-full font-semibold text-sm text-white transition-all flex items-center gap-2 w-[140px] justify-center cursor-pointer disabled:cursor-not-allowed ${
                                status === "connected"
                                    ? "bg-red-500 hover:bg-red-600"
                                    : "bg-violet-600 hover:bg-violet-500"
                            }`}
                        >
                            {status === "connecting" && <Loader2Icon size={16} className="animate-spin" />}
                            {status === "connected" ? "End Session" : status === "connecting" ? "Connecting..." : "Connect AI"}
                        </button>
                    </div>
                </div>

                {/* RIGHT COLUMN: Workspace Panel */}
                <div className="flex flex-col gap-4 min-h-0">


                    {/* Activity Stream */}
                    <div className="flex-1 bg-gray-900 rounded-2xl border border-slate-800 p-4 flex flex-col min-h-0">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">⚡ Agent Activity</h3>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ scrollbarWidth: "thin" }}>
                            {activityStream.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-600">
                                    <SparklesIcon size={24} className="mb-2 opacity-40" />
                                    <p className="text-xs">Activity will appear here once connected.</p>
                                </div>
                            ) : (
                                activityStream.map((log) => (
                                    <div key={log.id} className="text-xs p-2.5 rounded-lg bg-gray-800/60 border border-gray-800">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className={`text-[10px] font-bold ${LOG_COLORS[log.type]}`}>
                                                {LOG_LABELS[log.type]}
                                            </span>
                                            <span className="text-[10px] text-gray-600">
                                                {log.timestamp.toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <p className="text-gray-300 leading-relaxed">{log.message}</p>
                                    </div>
                                ))
                            )}
                            <div ref={activityEndRef} />
                        </div>
                    </div>
                </div>
            </div>
            )}
        </div>
    );
}
