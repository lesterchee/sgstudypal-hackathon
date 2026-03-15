// Purpose: Sprint 125 — Inbound audio playback pipeline.
// Decodes base64 PCM16 audio from the Gemini Live API (24kHz mono)
// and schedules seamless playback via the Web Audio API.
// All browser APIs are only invoked at runtime (no top-level access).

export class AudioStreamPlayer {
  private context: AudioContext | null = null;
  private nextPlayTime: number = 0;

  // Purpose: Lazily initialize the AudioContext on first playback.
  // Must be called from a user gesture context (click handler) to
  // satisfy browser autoplay policies.
  init() {
    if (!this.context) {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      this.context = new AudioContextClass({ sampleRate: 24000 });
    }
  }

  // Purpose: Decode a base64-encoded PCM16 chunk and schedule it for
  // gapless playback. Chunks are queued sequentially so they play
  // back-to-back without pops or gaps.
  play(base64Pcm: string) {
    if (!this.context) this.init();
    const ctx = this.context!;

    // 1. Decode base64 → raw bytes
    const binaryString = atob(base64Pcm);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 2. Convert Int16 PCM → Float32 (Web Audio API standard)
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }

    // 3. Create a mono AudioBuffer at 24kHz
    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    // 4. Schedule playback — queue chunks sequentially
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    // Purpose: If we've fallen behind (e.g., first chunk or after a gap),
    // start slightly in the future to prevent scheduling in the past.
    if (this.nextPlayTime < ctx.currentTime) {
      this.nextPlayTime = ctx.currentTime + 0.1;
    }

    source.start(this.nextPlayTime);
    this.nextPlayTime += buffer.duration;
  }

  // Purpose: Tear down the AudioContext and reset the play schedule.
  stop() {
    if (this.context) {
      this.context.close().catch(() => {
        // Purpose: Swallow close errors — context may already be closed.
      });
      this.context = null;
    }
    this.nextPlayTime = 0;
  }
}
