// Purpose: Video Frame Extractor — captures frames from an HTMLVideoElement
// using an offscreen canvas, compresses to JPEG, and returns pure Base64.
// Sprint 126: Throttled to 0.5 FPS (2000ms) at 40% JPEG quality to reduce
// WebSocket bandwidth and eliminate AI audio latency ("Brain Delay").

// Purpose: Configuration for the video encoder.
export interface VideoEncoderConfig {
  /** Purpose: JPEG compression quality (0–1). Lower = smaller payload. */
  quality: number;
  /** Purpose: Target width for the output frame. Height scales proportionally. */
  targetWidth: number;
  /** Purpose: Minimum interval between frames in milliseconds (1000 = 1 FPS). */
  frameIntervalMs: number;
}

// Purpose: Default config — 0.5 FPS, 512px wide, 40% JPEG quality.
// Sprint 126: Reduced from 1 FPS / 50% to halve outbound bandwidth.
const DEFAULT_CONFIG: VideoEncoderConfig = {
  quality: 0.4,
  targetWidth: 512,
  frameIntervalMs: 2000,
};

// Purpose: Sprint 154 — Module-level canvas cache. Reuses a single
// offscreen canvas across all frame captures to eliminate GC pressure.
let _canvas: HTMLCanvasElement | null = null;
let _ctx: CanvasRenderingContext2D | null = null;
let _lastWidth = 0;
let _lastHeight = 0;

// Purpose: Capture a single frame from the video element, draw it to an
// offscreen canvas, compress to JPEG, and return the pure Base64 string
// (no data URI prefix). Returns null if the video is not ready.
export function captureVideoFrame(
  video: HTMLVideoElement,
  config: Partial<VideoEncoderConfig> = {}
): string | null {
  const { quality, targetWidth } = { ...DEFAULT_CONFIG, ...config };

  // Purpose: Guard — video must have valid dimensions to capture.
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    return null;
  }

  // Purpose: Calculate proportional height based on target width.
  const aspectRatio = video.videoHeight / video.videoWidth;
  const targetHeight = Math.round(targetWidth * aspectRatio);

  // Purpose: Sprint 154 — Reuse canvas if dimensions match, otherwise reallocate.
  if (!_canvas || !_ctx || _lastWidth !== targetWidth || _lastHeight !== targetHeight) {
    _canvas = document.createElement("canvas");
    _canvas.width = targetWidth;
    _canvas.height = targetHeight;
    _ctx = _canvas.getContext("2d");
    _lastWidth = targetWidth;
    _lastHeight = targetHeight;
  }

  if (!_ctx || !_canvas) {
    console.warn("[videoEncoder] Failed to get 2D canvas context");
    return null;
  }

  // Purpose: Draw the current video frame onto the cached offscreen canvas.
  _ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

  // Purpose: Export as JPEG data URI and strip the prefix to get pure Base64.
  const dataUrl = _canvas.toDataURL("image/jpeg", quality);
  const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, "");

  return base64;
}

// Purpose: Handle for controlling the frame capture loop externally.
export interface FrameCaptureHandle {
  /** Purpose: Stop the capture loop and clean up. */
  stop: () => void;
}

// Purpose: Start a throttled frame capture loop. Uses requestAnimationFrame
// for browser-optimized scheduling but enforces a minimum interval (default
// 1000ms = 1 FPS) to avoid flooding the WebSocket with frames.
// The onFrame callback receives the pure Base64 string for each captured frame.
export function startFrameCapture(
  video: HTMLVideoElement,
  onFrame: (base64: string) => void,
  config: Partial<VideoEncoderConfig> = {}
): FrameCaptureHandle {
  const { frameIntervalMs } = { ...DEFAULT_CONFIG, ...config };
  let lastCaptureTime = 0;
  let animationFrameId: number | null = null;
  let stopped = false;

  // Purpose: The rAF loop — checks if enough time has passed since the
  // last capture before extracting a new frame. This ensures we never
  // block the render cycle or exceed the target frame rate.
  function captureLoop(timestamp: number) {
    if (stopped) return;

    if (timestamp - lastCaptureTime >= frameIntervalMs) {
      const frame = captureVideoFrame(video, config);
      if (frame) {
        onFrame(frame);
      }
      lastCaptureTime = timestamp;
    }

    animationFrameId = requestAnimationFrame(captureLoop);
  }

  // Purpose: Kick off the loop.
  animationFrameId = requestAnimationFrame(captureLoop);

  return {
    stop: () => {
      stopped = true;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    },
  };
}
