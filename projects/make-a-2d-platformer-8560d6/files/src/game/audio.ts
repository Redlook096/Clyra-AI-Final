// Web Audio API sound synthesis
let audioCtx: AudioContext | null = null;
let audioEnabled = true;

export function initAudio(): void {
  try {
    audioCtx = new AudioContext();
  } catch {
    audioEnabled = false;
  }
}

export function setAudioEnabled(enabled: boolean): void {
  audioEnabled = enabled;
}

export function isAudioEnabled(): boolean {
  return audioEnabled;
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'square', volume = 0.15) {
  if (!audioCtx || !audioEnabled) return;

  // Resume context if suspended (needed for user gesture)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playNoise(duration: number, volume = 0.08) {
  if (!audioCtx || !audioEnabled) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  source.connect(gain);
  gain.connect(audioCtx.destination);
  source.start();
}

export function playJump(): void {
  playTone(440, 0.1, 'square', 0.1);
  setTimeout(() => playTone(660, 0.1, 'square', 0.08), 50);
}

export function playCoin(): void {
  playTone(880, 0.08, 'square', 0.12);
  setTimeout(() => playTone(1320, 0.12, 'square', 0.1), 60);
}

export function playStomp(): void {
  playTone(220, 0.15, 'triangle', 0.12);
  setTimeout(() => playTone(440, 0.1, 'triangle', 0.1), 80);
}

export function playDeath(): void {
  playTone(300, 0.15, 'sawtooth', 0.12);
  setTimeout(() => playTone(200, 0.2, 'sawtooth', 0.1), 100);
  setTimeout(() => playNoise(0.2, 0.06), 50);
}

export function playCheckpoint(): void {
  playTone(523, 0.1, 'triangle', 0.1);
  setTimeout(() => playTone(659, 0.1, 'triangle', 0.1), 80);
  setTimeout(() => playTone(784, 0.2, 'triangle', 0.12), 160);
}

export function playLevelComplete(): void {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, 'triangle', 0.12), i * 120);
  });
}

export function playHit(): void {
  playNoise(0.1, 0.1);
  playTone(150, 0.15, 'sawtooth', 0.08);
}

export function playMenuSelect(): void {
  playTone(440, 0.06, 'square', 0.06);
}
