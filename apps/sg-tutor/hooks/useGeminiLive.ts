// Purpose: Gemini Multimodal Live WebSocket State Machine — manages the
// lifecycle of a WebSocket connection to the Gemini Live API via the
// authenticated /api/live/token route. Integrates video frame capture, audio
// PCM encoding, setup payload injection, and tool call handling.

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  startFrameCapture,
  type FrameCaptureHandle,
} from "@/lib/media/videoEncoder";
import {
  startAudioCapture,
  type AudioCaptureHandle,
} from "@/lib/media/audioEncoder";
import { AudioStreamPlayer } from "@/lib/media/audioPlayer";
import { generateSetupMessage } from "@/lib/ai/liveSessionSetup";

// Purpose: Strict connection state union for the WebSocket lifecycle.
export type GeminiLiveStatus = "idle" | "connecting" | "connected" | "error";

// Purpose: Shape of an inbound message from the Gemini Live API.
export interface GeminiLiveMessage {
  /** Purpose: Unique ID for deduplication. */
  id: string;
  /** Purpose: Message type from Gemini (e.g., "text", "audio", "setup_complete"). */
  type: string;
  /** Purpose: Raw payload data from the server. */
  data: unknown;
  /** Purpose: Timestamp when the message was received. */
  receivedAt: number;
}

// Purpose: Optional session configuration passed to connect().
export interface GeminiSessionConfig {
  /** Purpose: The Gemini model to use (e.g., "gemini-2.5-flash-native-audio-preview-12-2025"). */
  model?: string;
  /** Purpose: System instruction for the AI tutor persona. */
  systemInstruction?: string;
  /** Purpose: Response modalities requested (e.g., ["TEXT", "AUDIO"]). */
  responseModalities?: string[];
  /** Purpose: The active math question the student is working on. */
  activeQuestion?: string;
  /** Purpose: Sprint 170 — AI persona name (e.g., "Captain Nova"). */
  persona?: string;
  /** Purpose: Sprint 170 — Student's favorite interest for scenario translation. */
  interest?: string;
  /** Purpose: Sprint 156 — Dynamic pre-flight context. */
  userName?: string;
  interests?: string;
}

// Purpose: Shape of a Gemini tool/function call received from the AI.
export interface GeminiToolCall {
  /** Purpose: The name of the function the AI wants to invoke. */
  name: string;
  /** Purpose: The arguments object parsed from the AI's response. */
  args: Record<string, unknown>;
  /** Purpose: The raw function call ID for sending a response back. */
  id?: string;
}

// Purpose: Sprint 142 — MediaSources removed. Pipelines are independent.
// Audio only needs MediaStream; video only needs HTMLVideoElement.

// Purpose: Sprint 143 — Activity stream entry for real-time dashboard.
export type ActivityLog = {
  id: string;
  type: "system" | "agent" | "user" | "vision";
  message: string;
  timestamp: Date;
};

// Purpose: Return type of the useGeminiLive hook.
export interface UseGeminiLiveReturn {
  /** Purpose: Current WebSocket connection status. */
  status: GeminiLiveStatus;
  /** Purpose: Human-readable error message if status is "error". */
  error: string | null;
  /** Purpose: Array of messages received from Gemini during this session. */
  messages: GeminiLiveMessage[];
  /** Purpose: Whether the setup handshake with Gemini is complete. */
  isSetupComplete: boolean;
  /** Purpose: Initiate the WebSocket connection via the proxy route. */
  connect: (config?: GeminiSessionConfig) => Promise<void>;
  /** Purpose: Cleanly close the WebSocket connection and media pipelines. */
  disconnect: () => void;
  /** Purpose: Send a JSON message over the open WebSocket. */
  sendMessage: (data: Record<string, unknown>) => void;
  /** Purpose: Register a callback for when the AI invokes a tool. */
  onToolCall: (handler: (call: GeminiToolCall) => void) => void;
  /** Purpose: Sprint 128 — Whether video frames are being sent to the AI. */
  isVideoOn: boolean;
  /** Purpose: Sprint 128 — Toggle video frame streaming on/off. */
  toggleVideo: () => void;
  /** Purpose: Sprint 140 — Whether the microphone is actively sending audio. */
  isMicOn: boolean;
  /** Purpose: Sprint 140 — Toggle microphone audio capture on/off. */
  toggleMic: () => void;
  /** Purpose: Sprint 140 — Start audio capture independently of video element. */
  startAudioPipeline: (mediaStream: MediaStream) => void;
  /** Purpose: Sprint 142 — Start video frame capture loop. */
  startVideoPipeline: (videoElement: HTMLVideoElement) => void;
  /** Purpose: Sprint 142 — Stop the video frame capture loop. */
  stopVideoPipeline: () => void;
  /** Purpose: Sprint 142 — Stop the audio capture. */
  stopAudioPipeline: () => void;
  /** Purpose: Sprint 143 — Real-time activity log stream. */
  activityStream: ActivityLog[];
  /** Purpose: Sprint 143 — Add entry to the activity stream. */
  addLog: (type: ActivityLog["type"], message: string) => void;
}

// Purpose: Main hook — manages the WebSocket lifecycle for Gemini Live API.
// The connection flows through /api/gemini-live to keep the API key server-side.
// Media encoding pipelines are started/stopped alongside the connection.
export function useGeminiLive(): UseGeminiLiveReturn {
  const [status, setStatus] = useState<GeminiLiveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<GeminiLiveMessage[]>([]);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  // Purpose: Sprint 128 — Video frames off by default to save bandwidth during Vibe Check.
  const [isVideoOn, setIsVideoOn] = useState(false);
  // Purpose: Sprint 140 — Mic on by default so audio flows immediately.
  const [isMicOn, setIsMicOn] = useState(true);

  // Purpose: Sprint 143/154 — Activity stream state with transcript accumulation.
  // Agent transcript fragments arriving within 1500ms of each other are coalesced
  // into a single log entry to prevent cascading re-renders from streaming chunks.
  const [activityStream, setActivityStream] = useState<ActivityLog[]>([]);
  const lastAgentLogTimeRef = useRef<number>(0);
  const AGENT_COALESCE_WINDOW_MS = 1500;

  const addLog = useCallback((type: ActivityLog["type"], message: string) => {
    const now = Date.now();
    setActivityStream((prev) => {
      // Purpose: Sprint 154 — Coalesce rapid-fire agent transcript chunks.
      if (
        type === "agent" &&
        prev.length > 0 &&
        prev[prev.length - 1].type === "agent" &&
        now - lastAgentLogTimeRef.current < AGENT_COALESCE_WINDOW_MS
      ) {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          message: updated[updated.length - 1].message + " " + message,
        };
        lastAgentLogTimeRef.current = now;
        return updated;
      }
      lastAgentLogTimeRef.current = now;
      return [
        ...prev,
        { id: Math.random().toString(36).substring(7), type, message, timestamp: new Date() },
      ];
    });
  }, []);

  const wsRef = useRef<WebSocket | null>(null);
  const messageCounterRef = useRef(0);
  const frameCaptureRef = useRef<FrameCaptureHandle | null>(null);
  const audioCaptureRef = useRef<AudioCaptureHandle | null>(null);
  const toolCallHandlerRef = useRef<((call: GeminiToolCall) => void) | null>(null);
  // Purpose: Sprint 125 — Inbound audio playback ref.
  const audioPlayerRef = useRef<AudioStreamPlayer | null>(null);
  const activeQuestionRef = useRef<string>("General Math Practice");
  const personaRef = useRef<string>("Captain Nova");
  const interestRef = useRef<string>("Minecraft");
  // Purpose: Sprint 129 — Uploaded homework context for dynamic system instruction.

  // Purpose: Sprint 125 — Initialize and teardown the audio player.
  useEffect(() => {
    audioPlayerRef.current = new AudioStreamPlayer();
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.stop();
        audioPlayerRef.current = null;
      }
    };
  }, []);

  // Purpose: Sprint 142 — Independent cleanup helpers.
  const cleanupAudio = useCallback(() => {
    if (audioCaptureRef.current) {
      audioCaptureRef.current.stop();
      audioCaptureRef.current = null;
      console.log("[useGeminiLive] Audio capture stopped");
    }
  }, []);

  const cleanupVideo = useCallback(() => {
    if (frameCaptureRef.current) {
      frameCaptureRef.current.stop();
      frameCaptureRef.current = null;
      console.log("[useGeminiLive] Video capture stopped");
    }
  }, []);

  // Purpose: Cleanup WebSocket and media pipelines on unmount.
  useEffect(() => {
    return () => {
      cleanupAudio();
      cleanupVideo();
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounted");
        wsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Purpose: Send a realtime_input payload over the WebSocket.
  // Conforms to the Gemini Multimodal Live API spec:
  // { "realtime_input": { "media_chunks": [{ "mime_type": "...", "data": "..." }] } }
  const sendRealtimeChunk = useCallback(
    (mimeType: string, data: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

      const payload = {
        realtime_input: {
          media_chunks: [
            {
              mime_type: mimeType,
              data: data,
            },
          ],
        },
      };

      wsRef.current.send(JSON.stringify(payload));
    },
    []
  );

  // Purpose: Sprint 142 — Independent video pipeline. Starts the rAF
  // frame capture loop. Only call when isVideoOn and videoElement exist.
  const startVideoPipeline = useCallback(
    (videoElement: HTMLVideoElement) => {
      // Purpose: Prevent double-starting.
      if (frameCaptureRef.current) return;

      frameCaptureRef.current = startFrameCapture(
        videoElement,
        (base64Frame) => {
          sendRealtimeChunk("image/jpeg", base64Frame);
        },
        { quality: 0.4, targetWidth: 512, frameIntervalMs: 2000 }
      );
      console.log("[useGeminiLive] Video pipeline started (0.5 FPS, 512px JPEG)");
      addLog("vision", "Camera activated. Streaming visual context.");
    },
    [sendRealtimeChunk]
  );

  // Purpose: Sprint 142 — Exposed stop for video pipeline.
  const stopVideoPipeline = useCallback(() => {
    cleanupVideo();
  }, [cleanupVideo]);

  // Purpose: Sprint 140/142 — Start audio capture independently of the video element.
  // This allows audio to flow immediately on connection even when video is off.
  const startAudioPipeline = useCallback(
    (mediaStream: MediaStream) => {
      // Purpose: Only start if not already running.
      if (audioCaptureRef.current) return;

      audioCaptureRef.current = startAudioCapture(
        mediaStream,
        (base64Pcm) => {
          // Purpose: Gate on mic toggle.
          if (!isMicOnRef.current) return;
          sendRealtimeChunk("audio/pcm", base64Pcm);
        },
        { sampleRate: 16000, bufferSize: 4096 }
      );
      console.log("[useGeminiLive] Audio pipeline started (16kHz PCM16, mic-gated)");
      addLog("system", "Microphone active. Streaming audio to AI.");
    },
    [sendRealtimeChunk]
  );

  // Purpose: Sprint 142 — Exposed stop for audio pipeline.
  const stopAudioPipeline = useCallback(() => {
    cleanupAudio();
  }, [cleanupAudio]);

  // Purpose: Initiate the Gemini Live session. Fetches an ephemeral token from
  // the authenticated /api/live/token route (protected by Edge middleware),
  // then opens the WebSocket to Gemini using the server-constructed wss:// URL.
  const connect = useCallback(async (config?: GeminiSessionConfig) => {
    try {
      // Purpose: Prevent duplicate connections.
      if (wsRef.current) {
        wsRef.current.close(1000, "Reconnecting");
        wsRef.current = null;
      }

      setStatus("connecting");
      setError(null);
      setMessages([]);
      setIsSetupComplete(false);

      // Purpose: Store the active question, persona, and interest for the setup message.
      activeQuestionRef.current = config?.activeQuestion ?? "General Math Practice";
      personaRef.current = config?.persona ?? "Captain Nova";
      interestRef.current = config?.interest ?? "Minecraft";
      
      const setupUserName = config?.userName;
      const setupInterests = config?.interests;

      // Purpose: Fetch the ephemeral WebSocket URL from the authenticated
      // token route. Auth is handled via the __session cookie (synced by
      // AuthProvider) — no manual Authorization header needed.
      const response = await fetch("/api/live/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: config?.model ?? "gemini-2.5-flash-native-audio-preview-12-2025",
          systemInstruction: config?.systemInstruction,
          responseModalities: config?.responseModalities ?? ["TEXT", "AUDIO"],
        }),
      });

      // Purpose: Handle 401 specifically — surface a login prompt to the user.
      if (response.status === 401) {
        throw new Error("Please log in to start a tutoring session.");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as { error?: string }).error ??
            `Server returned ${response.status}`
        );
      }

      const { websocketUrl } = (await response.json()) as {
        websocketUrl: string;
        expiresAt: number;
      };

      if (!websocketUrl) {
        throw new Error("No WebSocket URL returned from server.");
      }

      // Purpose: Open the WebSocket connection to Gemini Live API.
      const ws = new WebSocket(websocketUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Purpose: Sprint 155 — Send the setup message FIRST before anything else.
        // Media pipelines must NOT start until after setup is dispatched.
        // Sprint 170: Pass persona and interest into the setup payload.
        // Sprint 156: Pass dynamic userName and interests from pre-flight form.
        const setupMsg = generateSetupMessage(setupUserName, setupInterests);
        const setupJson = JSON.stringify(setupMsg);
        ws.send(setupJson);
        console.log("[useGeminiLive] Setup message sent", setupMsg.setup.model);
        console.log("[useGeminiLive] SETUP PAYLOAD DUMP:", setupJson.slice(0, 2000));

        setStatus("connected");
        console.log("[useGeminiLive] WebSocket connected");
        addLog("system", "Connected to Tutor Gwen.");
      };

      // Purpose: Sprint 124 — Async handler with Blob decoding for Gemini Live binary frames.
      ws.onmessage = async (event) => {
        // Purpose: Sprint 123 — Raw WebSocket tap to diagnose incoming frame type.
        console.log("[useGeminiLive] RAW WS MSG:", typeof event.data, event.data instanceof Blob ? `[Blob ${event.data.size}B]` : (typeof event.data === "string" ? (event.data as string).slice(0, 500) : "[Unknown Type]"));

        try {
          // Purpose: Sprint 124 — Safely decode binary Blob frames into text.
          let messageText = "";
          if (event.data instanceof Blob) {
            messageText = await event.data.text();
          } else if (typeof event.data === "string") {
            messageText = event.data;
          } else {
            console.warn("[useGeminiLive] Unhandled message type:", typeof event.data);
            return;
          }

          const parsed = JSON.parse(messageText) as Record<
            string,
            unknown
          >;

          // Purpose: Detect the setupComplete acknowledgment from Gemini.
          // This confirms the server accepted our setup config.
          if (parsed.setupComplete !== undefined) {
            setIsSetupComplete(true);
            console.log("[useGeminiLive] Setup complete — ready for media");
            addLog("system", "Setup complete — audio & video pipelines ready.");

            // Purpose: Sprint 131 — Send an invisible icebreaker so Gwen speaks first.
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              const icebreaker = {
                clientContent: {
                  turns: [{ role: "user", parts: [{ text: "Hi Gwen, I just connected. Can you greet me?" }] }],
                  turnComplete: true,
                },
              };
              wsRef.current.send(JSON.stringify(icebreaker));
              console.log("[useGeminiLive] Icebreaker sent — Gwen will greet first");
              addLog("system", "Icebreaker sent — Gwen will speak first.");
            }
            return;
          }

          // Purpose: Detect tool/function calls AND audio payloads from the AI.
          // Gemini sends these as serverContent.modelTurn.parts[].functionCall
          // or serverContent.modelTurn.parts[].inlineData
          const serverContent = parsed.serverContent as
            | { modelTurn?: { parts?: Array<{ text?: string; functionCall?: { name: string; args: Record<string, unknown>; id?: string }; inlineData?: { mimeType: string; data: string } }> } }
            | undefined;

          if (serverContent?.modelTurn?.parts) {
            for (const part of serverContent.modelTurn.parts) {
              // Purpose: Sprint 125 — Route inbound audio to the speaker.
              if (part.inlineData && part.inlineData.mimeType.startsWith("audio/")) {
                audioPlayerRef.current?.play(part.inlineData.data);
              }
              // Purpose: Sprint 145 — Parse AI text transcript into Activity Stream.
              if (part.text && part.text.trim().length > 0) {
                addLog("agent", part.text.trim());
              }
              if (part.functionCall) {
                const { name, args, id } = part.functionCall;
                console.log(`[useGeminiLive] Tool call received: ${name}`, args);

                // Purpose: Sprint 156 — Route to the registered handler or
                // fall back to a switch statement with console.log placeholders.
                if (toolCallHandlerRef.current) {
                  toolCallHandlerRef.current({ name, args: args ?? {}, id });
                } else {
                  // Purpose: Fallback switch for development/debugging.
                  switch (name) {
                    case "submit_answer_and_attack":
                      console.log("[useGeminiLive] 🎯 CORRECT ANSWER — trigger gamification attack!");
                      // TODO (Day 3): Wire to UI gamification state
                      break;
                    case "log_student_progress":
                      console.log("[useGeminiLive] 📊 Progress logged:", args);
                      // TODO (Day 3): Wire to CRM/Firestore logging
                      break;
                    default:
                      console.warn(`[useGeminiLive] Unknown tool call: ${name}`);
                  }
                }
              }
            }
          }

          // Purpose: Store all messages (including non-tool-call ones) for the UI.
          const msg: GeminiLiveMessage = {
            id: `msg-${++messageCounterRef.current}`,
            type: serverContent?.modelTurn ? "modelTurn" : (parsed.type as string) ?? "unknown",
            data: parsed,
            receivedAt: Date.now(),
          };
          setMessages((prev) => [...prev, msg]);
        } catch {
          console.warn(
            "[useGeminiLive] Failed to parse WebSocket message:",
            event.data
          );
        }
      };

      ws.onerror = (event) => {
        console.error("[useGeminiLive] WebSocket error:", event);
        setError("WebSocket connection error. Please try again.");
        setStatus("error");
      };

      ws.onclose = (event) => {
        console.log(
          `[useGeminiLive] WebSocket closed: code=${event.code} reason=${event.reason}`
        );
        // Purpose: Sprint 117 — Verbose 1008 Policy Violation diagnostic.
        if (event.code === 1008) {
          console.error(
            "[1008 VIOLATION DETECTED] The Gemini API rejected the setup payload. " +
            "Check the schema for tool definitions, system instructions, or " +
            "response_modalities. The setup payload was logged on ws.onopen above."
          );
        }
        // Purpose: Only set error state if the close was unexpected.
        if (event.code !== 1000) {
          setError(`Connection closed unexpectedly (code: ${event.code})`);
          setStatus("error");
        } else {
          setStatus("idle");
        }
        wsRef.current = null;
      };
    } catch (err) {
      console.error("[useGeminiLive] Connection failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to connect to Gemini Live"
      );
      setStatus("error");
    }
  }, []);

  // Purpose: Cleanly close the WebSocket connection and all media pipelines.
  const disconnect = useCallback(() => {
    // Purpose: Stop encoding pipelines before closing the socket.
    cleanupAudio();
    cleanupVideo();

    if (wsRef.current) {
      wsRef.current.close(1000, "User disconnected");
      wsRef.current = null;
    }
    setStatus("idle");
    setError(null);
  }, [cleanupAudio, cleanupVideo]);

  // Purpose: Send a JSON message over the open WebSocket.
  const sendMessage = useCallback((data: Record<string, unknown>) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn("[useGeminiLive] Cannot send — WebSocket not open");
      return;
    }
    wsRef.current.send(JSON.stringify(data));
  }, []);

  // Purpose: Register a callback handler for AI tool calls.
  // The component can use this to wire tool calls to UI state.
  const onToolCall = useCallback(
    (handler: (call: GeminiToolCall) => void) => {
      toolCallHandlerRef.current = handler;
    },
    []
  );

  // Purpose: Sprint 128 — Toggle video frame streaming.
  const toggleVideo = useCallback(() => {
    setIsVideoOn((prev) => !prev);
  }, []);

  // Purpose: Sprint 128 — Keep a ref in sync so the frame capture closure
  // can read the latest value without re-creating the capture loop.
  const isVideoOnRef = useRef(false);
  useEffect(() => {
    isVideoOnRef.current = isVideoOn;
  }, [isVideoOn]);

  // Purpose: Sprint 140 — Toggle microphone audio sending.
  const toggleMic = useCallback(() => {
    setIsMicOn((prev) => !prev);
  }, []);

  // Purpose: Sprint 140 — Keep a ref in sync for the audio capture closure.
  const isMicOnRef = useRef(true);
  useEffect(() => {
    isMicOnRef.current = isMicOn;
  }, [isMicOn]);

  return {
    status,
    error,
    messages,
    isSetupComplete,
    connect,
    disconnect,
    sendMessage,
    onToolCall,
    isVideoOn,
    toggleVideo,
    isMicOn,
    toggleMic,
    startAudioPipeline,
    startVideoPipeline,
    stopVideoPipeline,
    stopAudioPipeline,
    activityStream,
    addLog,
  };
}
