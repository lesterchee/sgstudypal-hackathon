// Purpose: WebRTC Media Hook — manages camera and microphone access via
// navigator.mediaDevices.getUserMedia(). Provides toggle controls, a videoRef
// for the UI, and graceful permission error handling.

"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// Purpose: Permission states the hook can be in.
export type MediaPermissionState = "prompt" | "granted" | "denied" | "error";

// Purpose: Return type of the useMediaDevices hook.
export interface UseMediaDevicesReturn {
  /** Purpose: The active MediaStream, or null if not yet acquired. */
  stream: MediaStream | null;
  /** Purpose: Ref to attach to the <video> element for local preview. */
  videoRef: React.RefObject<HTMLVideoElement>;
  /** Purpose: Whether the microphone track is currently enabled. */
  isMicOn: boolean;
  /** Purpose: Whether the camera track is currently enabled. */
  isCameraOn: boolean;
  /** Purpose: Current permission state for the media devices. */
  permissionState: MediaPermissionState;
  /** Purpose: Human-readable error message if something went wrong. */
  error: string | null;
  /** Purpose: Request camera + mic access and start the stream. */
  startMedia: () => Promise<void>;
  /** Purpose: Toggle the microphone on/off without killing the stream. */
  toggleMic: () => void;
  /** Purpose: Toggle the camera on/off without killing the stream. */
  toggleCamera: () => void;
  /** Purpose: Stop all tracks and release the media stream. */
  stopMedia: () => void;
}

// Purpose: Map common getUserMedia error names to user-friendly messages.
function getMediaErrorMessage(err: unknown): string {
  if (err instanceof DOMException) {
    switch (err.name) {
      case "NotAllowedError":
        return "Camera/microphone permission was denied. Please allow access in your browser settings.";
      case "NotFoundError":
        return "No camera or microphone found. Please connect a device and try again.";
      case "NotReadableError":
        return "Your camera or microphone is already in use by another application.";
      case "OverconstrainedError":
        return "The requested media constraints could not be satisfied by your device.";
      case "AbortError":
        return "Media access was aborted. Please try again.";
      default:
        return `Media error: ${err.message}`;
    }
  }
  return "An unexpected error occurred while accessing your camera/microphone.";
}

// Purpose: Main hook — manages the full lifecycle of camera and mic access.
// All navigator access is gated behind useEffect to prevent SSR crashes.
export function useMediaDevices(): UseMediaDevicesReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [permissionState, setPermissionState] =
    useState<MediaPermissionState>("prompt");
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null!);

  // Purpose: Bind the active stream to the video element whenever it changes.
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Purpose: Cleanup — stop all tracks when the component unmounts.
  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Purpose: Request camera + microphone access. Wrapped in try/catch with
  // user-friendly error messages per .cursorrules §4C (no silent failures).
  const startMedia = useCallback(async () => {
    try {
      setError(null);
      setPermissionState("prompt");

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });

      setStream(mediaStream);
      setIsMicOn(true);
      setIsCameraOn(true);
      setPermissionState("granted");
    } catch (err) {
      console.error("[useMediaDevices] getUserMedia failed:", err);
      const message = getMediaErrorMessage(err);
      setError(message);
      setPermissionState(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "denied"
          : "error"
      );
    }
  }, []);

  // Purpose: Toggle the microphone track on/off without destroying the stream.
  const toggleMic = useCallback(() => {
    if (!stream) return;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMicOn((prev) => !prev);
  }, [stream]);

  // Purpose: Toggle the camera track on/off without destroying the stream.
  const toggleCamera = useCallback(() => {
    if (!stream) return;
    stream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsCameraOn((prev) => !prev);
  }, [stream]);

  // Purpose: Stop all tracks and release the stream completely.
  const stopMedia = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsMicOn(false);
    setIsCameraOn(false);
    setPermissionState("prompt");
  }, [stream]);

  return {
    stream,
    videoRef,
    isMicOn,
    isCameraOn,
    permissionState,
    error,
    startMedia,
    toggleMic,
    toggleCamera,
    stopMedia,
  };
}
