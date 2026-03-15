// Purpose: Audio PCM Downsampler — captures raw audio from a MediaStream,
// downsamples to 16kHz mono PCM16 (Int16), and encodes to Base64.
// Uses the Web Audio API ScriptProcessorNode for real-time audio capture.
// All browser APIs are only invoked at runtime (no top-level access).

// Purpose: Handle for controlling the audio capture pipeline externally.
export interface AudioCaptureHandle {
  /** Purpose: Stop the audio pipeline and release all resources. */
  stop: () => void;
}

// Purpose: Convert a Float32Array audio buffer to Int16 PCM format.
// Gemini Multimodal Live API requires 16-bit signed integer PCM.
function float32ToInt16(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    // Purpose: Clamp the float value to [-1, 1] then scale to Int16 range.
    const clamped = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  return int16Array;
}

// Purpose: Convert an Int16Array to a Base64 string. Uses the browser's
// btoa() function on the raw byte sequence of the PCM data.
function int16ToBase64(int16Array: Int16Array): string {
  const bytes = new Uint8Array(int16Array.buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Purpose: Configuration for the audio encoder.
export interface AudioEncoderConfig {
  /** Purpose: Target sample rate in Hz. Gemini requires 16000. */
  sampleRate: number;
  /** Purpose: ScriptProcessorNode buffer size. Must be a power of 2. */
  bufferSize: number;
}

// Purpose: Default config — 16kHz sample rate, 4096 buffer size.
const DEFAULT_CONFIG: AudioEncoderConfig = {
  sampleRate: 16000,
  bufferSize: 4096,
};

// Purpose: Start capturing audio from a MediaStream, downsampling to 16kHz
// mono PCM16, and calling onChunk with the Base64-encoded audio data.
// Returns a handle to stop the capture and release all audio resources.
export function startAudioCapture(
  stream: MediaStream,
  onChunk: (base64Pcm: string) => void,
  config: Partial<AudioEncoderConfig> = {}
): AudioCaptureHandle {
  const { sampleRate, bufferSize } = { ...DEFAULT_CONFIG, ...config };

  // Purpose: Create AudioContext at the target sample rate. The browser
  // will automatically resample the microphone input to match.
  const audioContext = new AudioContext({ sampleRate });

  // Purpose: Create a source node from the microphone MediaStream.
  const source = audioContext.createMediaStreamSource(stream);

  // Purpose: ScriptProcessorNode captures raw audio buffers for processing.
  // Note: ScriptProcessorNode is deprecated in favor of AudioWorklet, but
  // is widely supported and simpler for a hackathon scaffold. AudioWorklet
  // migration is a Day 3+ optimization.
  const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);

  // Purpose: Process each audio buffer — convert Float32 → Int16 → Base64
  // and emit via the onChunk callback.
  processor.onaudioprocess = (event: AudioProcessingEvent) => {
    const inputData = event.inputBuffer.getChannelData(0);

    // Purpose: Skip silent frames to save bandwidth.
    let maxAmplitude = 0;
    for (let i = 0; i < inputData.length; i++) {
      const abs = Math.abs(inputData[i]);
      if (abs > maxAmplitude) maxAmplitude = abs;
    }
    // Purpose: Threshold — skip if the signal is essentially silence.
    if (maxAmplitude < 0.01) return;

    // Purpose: Convert Float32 → Int16 PCM → Base64.
    const int16Data = float32ToInt16(inputData);
    const base64Chunk = int16ToBase64(int16Data);

    onChunk(base64Chunk);
  };

  // Purpose: Wire up the audio graph: microphone → processor → destination.
  // The destination connection is required for ScriptProcessorNode to fire.
  source.connect(processor);
  processor.connect(audioContext.destination);

  return {
    stop: () => {
      processor.onaudioprocess = null;
      processor.disconnect();
      source.disconnect();
      audioContext.close().catch(() => {
        // Purpose: Swallow close errors — context may already be closed.
      });
    },
  };
}
