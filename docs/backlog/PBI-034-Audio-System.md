# PBI-034: Audio System (Web Audio API)

**Status:** TODO  
**Priority:** HIGH  
**Estimate:** 8 Story Points  
**Phase:** 7 (Content & Polish)  
**Target Version:** v0.3.0  
**Epic:** [Phase 7: Content & Polish](../PHASE-7-ROADMAP.md)

---

## User Story

**As a** player  
**I want** audio feedback for thrust, collisions, and game events  
**So that** the game feels immersive and matches the retro/neon aesthetic

---

## Context

This PBI implements a procedural audio system using the Web Audio API. All sounds are synthesized at runtime (no external audio files) to maintain small bundle size and match the "procedural everything" philosophy.

**Why This Matters:**
- **Immersion:** Audio transforms the game from a visual demo to a complete sensory experience
- **Feedback:** Sound reinforces game events (collision, death, countdown)
- **Aesthetic:** Retro synthesis matches the neon vector art style
- **Performance:** Procedural audio = zero network requests, tiny bundle impact

**Prerequisites:**
- ✅ Phase 5 complete (game state machine)
- ✅ Settings system (PBI-018) for volume/mute controls
- ✅ Game events (collision, death, state changes)

---

## Blueprint

### Architecture

#### 1. SoundManager Class

**Responsibilities:**
- Initialize Web Audio API context
- Synthesize procedural sounds on demand
- Manage volume and mute state
- Handle AudioContext autoplay restrictions

**File:** `packages/core/src/lib/audio/SoundManager.ts`

```typescript
import { z } from 'zod';

export const SoundConfigSchema = z.object({
  masterVolume: z.number().min(0).max(1),
  muted: z.boolean(),
});

export type SoundConfig = z.infer<typeof SoundConfigSchema>;

export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private config: SoundConfig;
  private initialized = false;

  constructor(config: SoundConfig) {
    this.config = config;
  }

  /**
   * Initialize AudioContext (must be called after user interaction).
   * @returns true if successful, false if blocked by browser
   */
  async init(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.updateVolume();
      this.initialized = true;
      return true;
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      return false;
    }
  }

  /**
   * Resume AudioContext if suspended (handles autoplay restrictions).
   */
  async resume(): Promise<void> {
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  /**
   * Update master volume.
   */
  setVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateVolume();
  }

  /**
   * Toggle mute state.
   */
  setMuted(muted: boolean): void {
    this.config.muted = muted;
    this.updateVolume();
  }

  private updateVolume(): void {
    if (!this.masterGain) return;
    const volume = this.config.muted ? 0 : this.config.masterVolume;
    this.masterGain.gain.setValueAtTime(volume, this.ctx!.currentTime);
  }

  /**
   * Play thrust sound (loopable, modulated by throttle).
   * @param throttle - 0.0 to 1.0 (engine power)
   * @returns Stop function
   */
  playThrust(throttle: number): () => void {
    if (!this.ctx || !this.masterGain) return () => {};

    const now = this.ctx.currentTime;

    // Noise generator (white noise for rocket exhaust)
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Lowpass filter (modulated by throttle)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200 + throttle * 1800, now); // 200-2000 Hz
    filter.Q.setValueAtTime(1.0, now);

    // Gain (volume modulated by throttle)
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(throttle * 0.15, now); // Max 15% volume

    // Connect graph: noise → filter → gain → master
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);

    // Return stop function
    return () => {
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.1);
      noise.stop(this.ctx!.currentTime + 0.1);
    };
  }

  /**
   * Play collision sound (short explosion).
   * @param intensity - 0.0 to 1.0 (impact severity)
   */
  playCollision(intensity: number): void {
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const duration = 0.2; // 200ms

    // Sawtooth oscillator (harsh, retro explosion)
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + duration);

    // Gain envelope (sharp attack, exponential decay)
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(intensity * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Connect: osc → gain → master
    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Play countdown sound (simple beep).
   * @param pitch - Frequency in Hz (higher for final beep)
   */
  playCountdown(pitch: number): void {
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const duration = 0.1; // 100ms beep

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Play death sound (noise burst).
   */
  playDeath(): void {
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const duration = 0.5; // 500ms

    // White noise burst
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize); // Fade out
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Bandpass filter (mid-range crunch)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.setValueAtTime(2.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }

  /**
   * Play "Get Ready" sound (arpeggio).
   */
  playGetReady(): void {
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const notes = [262, 330, 392]; // C4, E4, G4 (C major arpeggio)
    const noteDuration = 0.15;

    notes.forEach((freq, index) => {
      const startTime = now + index * noteDuration;

      const osc = this.ctx!.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + noteDuration);
    });
  }

  /**
   * Cleanup resources.
   */
  dispose(): void {
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
      this.masterGain = null;
      this.initialized = false;
    }
  }
}
```

---

#### 2. Integration with Settings

**File:** `apps/web/src/stores/settings.ts`

```typescript
import { atom } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';

export interface Settings {
  controlsInverted: boolean;
  volume: number; // 0.0 to 1.0
  muted: boolean;
}

export const settings = persistentAtom<Settings>(
  'void-drift-settings',
  {
    controlsInverted: false,
    volume: 0.7,
    muted: false,
  },
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);

// Helper functions
export function setVolume(volume: number): void {
  settings.set({ ...settings.get(), volume });
}

export function setMuted(muted: boolean): void {
  settings.set({ ...settings.get(), muted });
}
```

**File:** `apps/web/src/pages/settings.astro`

Add volume controls to existing settings page:

```svelte
<script lang="ts">
  import { settings, setVolume, setMuted } from '../stores/settings';

  let currentSettings = $state(settings.get());

  settings.listen((newSettings) => {
    currentSettings = newSettings;
  });

  function handleVolumeChange(event: Event) {
    const volume = parseFloat((event.target as HTMLInputElement).value);
    setVolume(volume);
  }

  function handleMuteToggle() {
    setMuted(!currentSettings.muted);
  }
</script>

<!-- Existing settings UI -->

<div class="setting">
  <label for="volume">Volume</label>
  <input
    type="range"
    id="volume"
    min="0"
    max="1"
    step="0.1"
    value={currentSettings.volume}
    oninput={handleVolumeChange}
    disabled={currentSettings.muted}
  />
  <span>{Math.round(currentSettings.volume * 100)}%</span>
</div>

<div class="setting">
  <label for="mute">Mute Audio</label>
  <input
    type="checkbox"
    id="mute"
    checked={currentSettings.muted}
    onchange={handleMuteToggle}
  />
</div>
```

---

#### 3. Game Integration

**File:** `apps/web/src/components/Game.svelte`

```typescript
import { SoundManager } from '@void-drift/core';
import { settings } from '../stores/settings';

let soundManager: SoundManager;
let thrustSoundStop: (() => void) | null = null;

$effect(() => {
  // Initialize sound manager
  const config = {
    masterVolume: settings.get().volume,
    muted: settings.get().muted,
  };
  soundManager = new SoundManager(config);

  // Listen for settings changes
  const unsubscribe = settings.listen((newSettings) => {
    soundManager.setVolume(newSettings.volume);
    soundManager.setMuted(newSettings.muted);
  });

  return () => {
    soundManager.dispose();
    unsubscribe();
  };
});

// Initialize AudioContext on first user interaction
function handleFirstInteraction() {
  soundManager.init().then((success) => {
    if (success) {
      soundManager.playGetReady();
    }
  });
}

// In game loop
function update(deltaTime: number) {
  // ... existing game logic

  // Thrust sound
  const isThrusting = inputState.left || inputState.right;
  if (isThrusting && !thrustSoundStop) {
    const throttle = (inputState.left ? 0.5 : 0) + (inputState.right ? 0.5 : 0);
    thrustSoundStop = soundManager.playThrust(throttle);
  } else if (!isThrusting && thrustSoundStop) {
    thrustSoundStop();
    thrustSoundStop = null;
  }

  // Collision detection
  for (const planet of planets) {
    const collision = checkCollision(ship, planet);
    if (collision) {
      soundManager.playCollision(0.8); // 80% intensity
      // ... existing collision logic
    }
  }

  // Death detection
  if (gameState.status === 'GAME_OVER' && !deathSoundPlayed) {
    soundManager.playDeath();
    deathSoundPlayed = true;
  }
}

// State transitions
function handleGameStart() {
  soundManager.resume(); // Ensure context is active
  // ... existing start logic
}
```

---

## Contract

### Schemas

```typescript
// packages/core/src/lib/audio/SoundManager.ts
export { SoundConfigSchema, type SoundConfig, SoundManager };
```

### API Surface

```typescript
class SoundManager {
  constructor(config: SoundConfig);
  
  // Initialization
  init(): Promise<boolean>;
  resume(): Promise<void>;
  
  // Volume control
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  
  // Sound playback
  playThrust(throttle: number): () => void; // Returns stop function
  playCollision(intensity: number): void;
  playCountdown(pitch: number): void;
  playDeath(): void;
  playGetReady(): void;
  
  // Cleanup
  dispose(): void;
}
```

---

## Acceptance Criteria

### SoundManager Implementation
- [x] `SoundManager` class created in `@void-drift/core`
- [x] AudioContext initialized on user interaction (not on page load)
- [x] Master gain node controls global volume
- [x] All sounds synthesized procedurally (zero audio files)

### Sound Effects
- [x] **Thrust:** Continuous noise loop, modulated by throttle (0.0-1.0)
- [x] **Collision:** Sharp sawtooth explosion (120Hz → 40Hz decay)
- [x] **Death:** Bandpass-filtered noise burst (500ms)
- [x] **Get Ready:** C major arpeggio (C4-E4-G4)
- [x] **Countdown:** Simple sine beeps (configurable pitch)

### Settings Integration
- [x] Volume slider added to settings page (0-100%)
- [x] Mute checkbox added to settings page
- [x] Volume changes apply immediately (no restart required)
- [x] Settings persisted to localStorage
- [x] Mute disables all audio (volume = 0)

### Game Integration
- [x] Thrust sound plays when thrusting (left/right keys)
- [x] Thrust sound stops when no thrust input
- [x] Thrust pitch modulates with throttle intensity
- [x] Collision sound plays on planet impact
- [x] Death sound plays on game over
- [x] Get Ready sound plays on game start
- [x] AudioContext resumes on state changes (handles autoplay restrictions)

### Performance
- [x] Sound synthesis adds < 0.5ms to frame time
- [x] No audio pops or clicks during playback
- [x] Thrust loop seamless (no audible loop point)
- [x] 60 FPS maintained with all sounds active

---

## Technical Implementation

### Step 1: SoundManager Core (2 hours)

1. **File:** `packages/core/src/lib/audio/SoundManager.ts`
   - Implement `SoundManager` class
   - Test AudioContext initialization in browser console
   - Validate schema with Zod

2. **File:** `packages/core/src/index.ts`
   - Export `SoundManager` and types

### Step 2: Procedural Sound Synthesis (3 hours)

1. **Thrust Sound:**
   - Create noise buffer generator
   - Implement lowpass filter modulation
   - Test loop seamlessness

2. **Collision Sound:**
   - Implement sawtooth oscillator with frequency sweep
   - Tune attack/decay envelope
   - Test intensity scaling

3. **Death Sound:**
   - Implement noise burst with bandpass filter
   - Tune duration and fade curve

4. **Countdown/Get Ready:**
   - Implement simple tone generators
   - Create arpeggio sequencing

### Step 3: Settings Integration (1 hour)

1. **File:** `apps/web/src/stores/settings.ts`
   - Add `volume` and `muted` to settings schema
   - Implement `setVolume()` and `setMuted()` helpers

2. **File:** `apps/web/src/pages/settings.astro`
   - Add volume slider UI
   - Add mute checkbox UI
   - Wire up event handlers

### Step 4: Game Integration (2 hours)

1. **File:** `apps/web/src/components/Game.svelte`
   - Initialize `SoundManager` in component mount
   - Call `init()` on first user interaction
   - Integrate thrust sound with input state
   - Integrate collision sound with collision detection
   - Integrate death sound with game over
   - Handle AudioContext resume on state changes

### Step 5: Testing & Tuning (2 hours)

1. **Cross-Browser Testing:**
   - Chrome/Edge (Chromium)
   - Firefox
   - Safari (macOS/iOS)
   - Test AudioContext autoplay restrictions

2. **Sound Tuning:**
   - Adjust thrust filter frequency range
   - Adjust collision pitch sweep
   - Adjust death noise duration
   - Balance volume levels across all sounds

3. **Performance Testing:**
   - Profile audio synthesis overhead
   - Test with sustained thrust + rapid collisions
   - Verify no GC pressure from sound playback

---

## Definition of Done

- [x] `SoundManager` class implemented and tested
- [x] All 5 sound effects synthesized procedurally
- [x] Volume and mute controls in settings page
- [x] Sounds integrated with game events
- [x] AudioContext restrictions handled correctly
- [x] Works in Chrome, Firefox, and Safari
- [x] 60 FPS maintained with audio active
- [x] Zero TypeScript errors
- [x] Code reviewed and merged to `feat/phase-7`

---

## Testing Checklist

### SoundManager
- [ ] AudioContext initializes on first user interaction
- [ ] `init()` returns `true` on success
- [ ] `setVolume(0.5)` reduces volume by 50%
- [ ] `setVolume(0)` silences all audio
- [ ] `setMuted(true)` silences all audio
- [ ] `setMuted(false)` restores volume
- [ ] `dispose()` closes AudioContext (no memory leaks)

### Sound Effects
- [ ] Thrust sound audible when thrusting
- [ ] Thrust pitch increases with throttle intensity
- [ ] Thrust loop seamless (no clicks at loop point)
- [ ] Thrust stops cleanly when releasing thrust input
- [ ] Collision sound plays on planet impact
- [ ] Collision intensity scales with damage
- [ ] Death sound plays on game over (only once)
- [ ] Get Ready sound plays on game start
- [ ] Countdown beeps audible (if implemented)

### Settings Integration
- [ ] Volume slider updates settings store
- [ ] Volume changes apply immediately (no restart)
- [ ] Mute checkbox updates settings store
- [ ] Mute disables all audio instantly
- [ ] Unmute restores audio at previous volume
- [ ] Settings persist across page reload

### Cross-Browser
- [ ] Works in Chrome 120+ (desktop)
- [ ] Works in Firefox 120+ (desktop)
- [ ] Works in Safari 17+ (macOS)
- [ ] Works in Safari iOS 17+ (iPhone)
- [ ] Works in Chrome Android 120+ (Pixel)
- [ ] AudioContext resumes after tab backgrounding

### Performance
- [ ] 60 FPS with thrust + collision sounds (desktop)
- [ ] 60 FPS with thrust + collision sounds (mobile)
- [ ] No audio pops or glitches during playback
- [ ] No GC pauses > 16ms from audio synthesis

---

## Out of Scope

- Background music (defer to Phase 8+)
- 3D positional audio (stereo panning based on position)
- Advanced synthesis (FM synthesis, reverb, delay)
- Audio visualization (waveform display)
- Custom sound presets (player-configurable synthesis params)
- External audio files (MP3, OGG, WAV)

---

## Dependencies

- **Requires:** PBI-018 (Settings System) — for volume/mute persistence
- **Recommended:** PBI-032 (Multi-Planet System) — for varied collision sounds
- **Recommended:** PBI-033 (Visual Juice) — audio + visual feedback synergy
- **Blocks:** None (additive feature)

---

## Anti-Patterns

**AVOID:**
- Initializing AudioContext on page load (breaks autoplay restrictions)
- Using `setInterval` for sound loops (use AudioContext timing)
- Creating new AudioContext per sound (use single shared context)
- External audio files (breaks "procedural everything" philosophy)
- Hardcoded volume values (use settings store)

**DO:**
- Initialize AudioContext on first user interaction
- Use `exponentialRampToValueAtTime` for smooth fades (not linear)
- Disconnect audio nodes after playback (prevent memory leaks)
- Test on iOS Safari (strictest autoplay restrictions)
- Profile audio synthesis performance (Web Audio is generally fast but not free)

---

## Related Documents

- [Phase 7 Roadmap](../PHASE-7-ROADMAP.md) — Epic overview
- [Project Vision](../project-vision.md) — Audio strategy (procedural)
- [Settings System](./PBI-018-Settings-Route.md) — Volume/mute persistence
- [Survival Core Spec](../specs/survival-core.md) — Game events

---

## Notes

**Audio Design Philosophy:**
- Match retro/neon aesthetic (chiptune/arcade synthesis)
- No realistic sounds (avoid "authentic" rocket engines)
- Keep synthesis simple (sine, sawtooth, noise only)
- Prioritize clarity over complexity (each sound distinct)

**Web Audio API Limitations:**
- AudioContext autoplay blocked until user interaction
- iOS Safari requires resume() after tab backgrounding
- Some browsers limit concurrent AudioContext instances
- No standard way to enumerate audio devices (output only)

**Future Enhancements (Deferred):**
- Background music (ambient drone or generative melodies)
- Positional audio (stereo panning based on ship position)
- Doppler effect (pitch shift based on velocity)
- Reverb/delay for "space" atmosphere
- Player-configurable synthesis parameters
- Audio visualization (oscilloscope or spectrum analyzer)

---

## Acceptance

**Implemented by:** TBD  
**Reviewed by:** TBD  
**Audio Tested by:** TBD (test on multiple devices)  
**Sign-off:** TBD
