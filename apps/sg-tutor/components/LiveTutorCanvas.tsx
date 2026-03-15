// Purpose: LiveTutorCanvas — full-screen "use client" component for the
// real-time AI tutoring interface. Composes the useMediaDevices and
// useGeminiLive hooks into a mobile-first, iPad-optimized UI with
// camera preview, floating action buttons, connection status indicator,
// and Boss Fight gamification (Sprint 173-174).

"use client";

import { useEffect, useState, useCallback } from "react";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { useGeminiLive, type GeminiLiveStatus, type GeminiToolCall } from "@/hooks/useGeminiLive";
import confetti from "canvas-confetti";

// Purpose: Map connection status to visual indicator props.
function getStatusIndicator(status: GeminiLiveStatus): {
  color: string;
  pulse: boolean;
  label: string;
} {
  switch (status) {
    case "connected":
      return { color: "bg-green-500", pulse: true, label: "Connected" };
    case "connecting":
      return { color: "bg-yellow-500", pulse: true, label: "Connecting…" };
    case "error":
      return { color: "bg-red-500", pulse: false, label: "Error" };
    case "idle":
    default:
      return { color: "bg-gray-400", pulse: false, label: "Idle" };
  }
}

// Purpose: Props for the LiveTutorCanvas component.
interface LiveTutorCanvasProps {
  /** Purpose: Selected AI persona name (e.g., "Captain Nova"). */
  persona: string;
  /** Purpose: Student's favorite interest for math scenario translation. */
  interest: string;
}

// Purpose: Main LiveTutorCanvas component — renders the full-screen camera
// feed with floating controls and WebSocket status overlay.
export function LiveTutorCanvas({ persona, interest }: LiveTutorCanvasProps) {
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

  const {
    status,
    error: wsError,
    connect,
    disconnect,
    isSetupComplete,
    startAudioPipeline,
    startVideoPipeline,
    stopAudioPipeline,
    stopVideoPipeline,
    onToolCall,
    sendMessage,
  } = useGeminiLive();

  // Purpose: Sprint 173 — Boss Fight gamification state.
  const [monsterHealth, setMonsterHealth] = useState(100);
  const [isAttacking, setIsAttacking] = useState(false);
  const [attackFlash, setAttackFlash] = useState(false);

  const statusIndicator = getStatusIndicator(status);

  // Purpose: Auto-request media on mount (browser-only via useEffect).
  useEffect(() => {
    startMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Purpose: Sprint 142 — Independent pipelines.
  useEffect(() => {
    if (isSetupComplete && stream) {
      startAudioPipeline(stream);
    }
    return () => stopAudioPipeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSetupComplete, stream]);

  useEffect(() => {
    if (isSetupComplete && stream && videoRef.current) {
      startVideoPipeline(videoRef.current);
    }
    return () => stopVideoPipeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSetupComplete, stream]);

  // Purpose: Handle the "End Session" action — stop encoding, disconnect WS, stop media.
  const handleEndSession = () => {
    stopAudioPipeline();
    stopVideoPipeline();
    disconnect();
    stopMedia();
  };

  // Purpose: Handle the "Start Session" action — connect to Gemini Live.
  // Sprint 170: Pass persona and interest through to the setup payload.
  const handleStartSession = () => {
    setMonsterHealth(100);
    setIsAttacking(false);
    connect({
      activeQuestion: "General Math Practice",
      persona,
      interest,
    });
  };

  // Purpose: Sprint 174 — Handle inbound tool calls from Gemini AI.
  const handleToolCall = useCallback(
    (call: GeminiToolCall) => {
      switch (call.name) {
        case "submit_answer_and_attack": {
          // Purpose: Fire confetti burst.
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
          });

          // Purpose: Trigger attack animation (shake + red flash).
          setIsAttacking(true);
          setAttackFlash(true);

          // Purpose: Deduct 25 HP from the monster.
          setMonsterHealth((prev) => Math.max(0, prev - 25));

          // Purpose: Reset attack animation after 1 second.
          setTimeout(() => {
            setIsAttacking(false);
            setAttackFlash(false);
          }, 1000);

          // Purpose: Send tool response back to Gemini so the AI knows
          // the attack landed and can verbally congratulate the student.
          if (call.id) {
            sendMessage({
              tool_response: {
                function_responses: [
                  {
                    id: call.id,
                    name: call.name,
                    response: {
                      result: {
                        success: true,
                        damage_dealt: 25,
                        remaining_health: Math.max(0, monsterHealth - 25),
                        message:
                          "Attack landed! The Math Monster took 25 damage!",
                      },
                    },
                  },
                ],
              },
            });
          }
          break;
        }
        case "log_student_progress": {
          console.log("[BossFight] 📊 Progress logged:", call.args);
          // Purpose: Send acknowledgement back to Gemini.
          if (call.id) {
            sendMessage({
              tool_response: {
                function_responses: [
                  {
                    id: call.id,
                    name: call.name,
                    response: { result: { logged: true } },
                  },
                ],
              },
            });
          }
          break;
        }
        default:
          console.warn(`[BossFight] Unknown tool call: ${call.name}`);
      }
    },
    [monsterHealth, sendMessage]
  );

  // Purpose: Register the tool call handler with the Gemini Live hook.
  useEffect(() => {
    onToolCall(handleToolCall);
  }, [onToolCall, handleToolCall]);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-gray-950">
      {/* Purpose: Camera preview — mirrored for natural self-view */}
      {stream && isCameraOn ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover scale-x-[-1]"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            {permissionState === "denied" ? (
              <>
                <div className="mb-3 text-5xl">🔒</div>
                <p className="text-[16px] font-medium text-gray-300">
                  Camera access denied
                </p>
                <p className="mt-1 text-[16px] text-gray-500">
                  Please allow camera access in your browser settings
                </p>
              </>
            ) : permissionState === "error" ? (
              <>
                <div className="mb-3 text-5xl">⚠️</div>
                <p className="text-[16px] font-medium text-gray-300">
                  Camera error
                </p>
                <p className="mt-1 max-w-xs text-[16px] text-gray-500">
                  {mediaError}
                </p>
              </>
            ) : !isCameraOn ? (
              <>
                <div className="mb-3 text-5xl">📷</div>
                <p className="text-[16px] font-medium text-gray-300">
                  Camera is off
                </p>
              </>
            ) : (
              <>
                <div className="mb-3 animate-pulse text-5xl">📸</div>
                <p className="text-[16px] font-medium text-gray-300">
                  Requesting camera access…
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Purpose: Top-bar overlay — connection status + session info */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-4 pb-2 pt-[env(safe-area-inset-top,12px)]">
        {/* Purpose: Status dot with optional pulse animation */}
        <div className="flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-md">
          <span className="relative flex h-3 w-3">
            {statusIndicator.pulse && (
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${statusIndicator.color}`}
              />
            )}
            <span
              className={`relative inline-flex h-3 w-3 rounded-full ${statusIndicator.color}`}
            />
          </span>
          <span className="text-[16px] font-medium text-white">
            {statusIndicator.label}
          </span>
        </div>

        {/* Purpose: SgStudyPal branding badge */}
        <div className="rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-md">
          <span className="text-[16px] font-bold text-violet-400">
            SgStudyPal
          </span>
        </div>
      </div>

      {/* Purpose: Error banner — shown when WebSocket or media errors occur */}
      {(wsError || mediaError) && (
        <div className="absolute left-4 right-4 top-16 z-10 rounded-xl bg-red-900/80 px-4 py-3 backdrop-blur-md">
          <p className="text-[16px] font-medium text-red-200">
            {wsError ?? mediaError}
          </p>
        </div>
      )}

      {/* Purpose: Sprint 173 — Math Monster Boss Fight health bar */}
      {status === "connected" && (
        <div className="absolute left-4 right-4 top-16 z-10">
          <div
            className={`rounded-2xl bg-black/60 px-4 py-3 backdrop-blur-lg border border-slate-700/50 transition-all duration-200 ${
              isAttacking ? "animate-[shake_0.5s_ease-in-out]" : ""
            }`}
          >
            {/* Purpose: Red flash overlay on attack */}
            {attackFlash && (
              <div className="absolute inset-0 rounded-2xl bg-red-500/30 animate-pulse pointer-events-none" />
            )}

            <div className="flex items-center gap-3">
              {/* Purpose: Monster avatar */}
              <div className="text-3xl flex-shrink-0">
                {monsterHealth > 0 ? "👾" : "💀"}
              </div>

              <div className="flex-1 min-w-0">
                {/* Purpose: Monster name + HP label */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white">
                    Math Monster
                  </span>
                  <span className="text-xs font-mono text-red-300">
                    {monsterHealth}/100 HP
                  </span>
                </div>

                {/* Purpose: Health bar — smooth CSS transition on width change */}
                <div className="h-3 w-full rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      monsterHealth > 50
                        ? "bg-gradient-to-r from-red-500 to-red-400"
                        : monsterHealth > 25
                          ? "bg-gradient-to-r from-orange-500 to-amber-400"
                          : monsterHealth > 0
                            ? "bg-gradient-to-r from-red-600 to-red-500 animate-pulse"
                            : "bg-gray-700"
                    }`}
                    style={{ width: `${monsterHealth}%` }}
                  />
                </div>

                {/* Purpose: Defeated message */}
                {monsterHealth === 0 && (
                  <p className="text-xs text-emerald-400 font-semibold mt-1 animate-bounce">
                    🎉 You defeated the Math Monster!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purpose: Bottom action bar — floating circular buttons */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pb-[env(safe-area-inset-bottom,20px)]">
        <div className="flex items-center justify-center gap-4 whitespace-nowrap px-4 py-4">
          {/* Purpose: Mic toggle button */}
          <button
            id="btn-mic-toggle"
            onClick={toggleMic}
            disabled={!stream}
            className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl shadow-lg transition-all active:scale-95 ${
              isMicOn
                ? "bg-white/20 text-white backdrop-blur-md"
                : "bg-red-500/90 text-white"
            } disabled:opacity-40`}
            aria-label={isMicOn ? "Mute microphone" : "Unmute microphone"}
          >
            {isMicOn ? "🎤" : "🔇"}
          </button>

          {/* Purpose: Start/End Session button — larger for emphasis */}
          {status === "idle" || status === "error" ? (
            <button
              id="btn-start-session"
              onClick={handleStartSession}
              disabled={!stream}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-600 text-2xl shadow-lg shadow-violet-900/50 transition-all hover:bg-violet-500 active:scale-95 disabled:opacity-40"
              aria-label="Start AI tutoring session"
            >
              ▶️
            </button>
          ) : (
            <button
              id="btn-end-session"
              onClick={handleEndSession}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-2xl shadow-lg shadow-red-900/50 transition-all hover:bg-red-500 active:scale-95"
              aria-label="End session"
            >
              ⏹️
            </button>
          )}

          {/* Purpose: Camera toggle button */}
          <button
            id="btn-camera-toggle"
            onClick={toggleCamera}
            disabled={!stream}
            className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl shadow-lg transition-all active:scale-95 ${
              isCameraOn
                ? "bg-white/20 text-white backdrop-blur-md"
                : "bg-red-500/90 text-white"
            } disabled:opacity-40`}
            aria-label={isCameraOn ? "Turn off camera" : "Turn on camera"}
          >
            {isCameraOn ? "📷" : "🚫"}
          </button>
        </div>
      </div>
    </div>
  );
}
