# Project: VOID DRIFT

**"Newtonian Chaos in a Shared Browser Tab"**

## 1. High Concept

**Void Drift** is a multiplayer, top-down space brawler that prioritizes "game feel" (juice, drift, inertia) over complex controls. It pays homage to _Star Control: Super Melee_ but simplifies the input for modern cross-platform accessibility (Desktop & Mobile).

Players pilot ships using only differential thrust (Left/Right engines) in a gravity-dense arena. The goal: outmaneuver opponents, utilize planetary gravity slingshots, and survive the chaos.

## 2. The "Vibe" & Aesthetic

- **Visual Style:** High-contrast neon vectors on deep void backgrounds. CRT scanlines, chromatic aberration on impacts, and heavy particle usage for thrust and explosions.
    
- **Camera:** Dynamic "Director Mode" auto-zoom. The camera calculates the bounding box of all living ships and smoothly interpolates between 5 zoom levels to keep everyone in frame.
    
- **Physics:** "Floaty" but responsive. Heavy inertia. Wrapping borders (Pac-man topology) preserve velocity.
    

## 3. Tech Stack & Constraints

- **Language:** TypeScript (Strict).
    
- **Runtime/Bundler:** Vite.
    
- **Framework:** Svelte 5 (No SvelteKit - Single Page App architecture).
    
- **Data Validation:** Zod (Runtime schema validation for game state).
    
- **Linting/Formatting:** Biome.
    
- **Backend-as-a-Service:** Firebase (Free Tier).
    
    - **Auth:** Anonymous & Custom Token (if needed).
        
    - **Database:** Firestore (State synchronization and Leaderboards).
        
- **Styling:** Native CSS (Scoped Svelte styles). **No Tailwind.**
    
- **Rendering:** HTML5 Canvas API (for the game loop) + DOM (for UI overlay).
    

## 4. Gameplay Mechanics

### 4.1 Controls (Differential Thrust)

The ship has two main engines and one special ability.

- **Input (Desktop - Implemented):**
    - `A` / `Left Arrow`: Rotate Left + Partial Thrust (Spiraling turn).
    - `D` / `Right Arrow`: Rotate Right + Partial Thrust (Spiraling turn).
    - `A` + `D`: Full Forward Thrust.
    - `Space`: Antimatter Bomb.

- **Input (Mobile - Planned 0.0.2):**
    - **Tap Left Half:** Rotate Left + Partial Thrust.
    - **Tap Right Half:** Rotate Right + Partial Thrust.
    - **Tap Both Halves:** Full Forward Thrust.
    - **Double Tap (Anywhere/Both):** Antimatter Bomb.

- **Physics Logic (Tuned):**
    - **Drift:** Ships have low drag (0.5/sec) and preserve momentum.
    - **Max Speed:** Capped at 500px/s to ensure playability.
    - **Rotation:** Differential thrust creates a spiraling motion if only one engine is used.

### 4.2 Combat & Weapons

- **Primary Fire:** Auto-turret. When an enemy enters a defined radius and arc, the ship fires standard plasma bolts automatically.
    
- **Secondary (Ult):** Antimatter Bomb. Drop a mine that has a 3-second fuse. Creates a massive gravity implosion before exploding, sucking nearby ships in. Long cooldown (30s).
    

### 4.3 The Arena

- **Central Star:** Massive gravity source. Instant death on contact.
    
- **Planets:** Smaller gravity wells. Good for slingshot maneuvers.
    
- **Borders:** Screen wrap. Flying off the right side creates a "warp" effect and spawns you on the left side with momentum preserved.
    

## 5. Architecture & Data Flow

### 5.1 Game Loop (The Engine)

We will run a standard `requestAnimationFrame` loop decoupled from the network tick.

1. **Input:** Capture local state.
    
2. **Physics:** Apply gravity, velocity, collision detection.
    
3. **Render:** Draw canvas frame.
    
4. **Network Sync:** Every 100ms (10Hz), push "Player State" to Firestore. Listen for "Opponent States".
    

### 5.2 Zod Schemas (The Truth)

We define the game state in Zod to ensure type safety across the app.

```typescript
// Example Draft Schemas
const Vector2 = z.object({ x: z.number(), y: z.number() });

const PlayerState = z.object({
  uid: z.string(),
  position: Vector2,
  velocity: Vector2,
  rotation: z.number(),
  health: z.number(),
  lastInput: z.number(), // Timestamp for lag comp
  isDead: z.boolean(),
  score: z.number()
});

const GameLobby = z.object({
  id: z.string(),
  hostId: z.string(),
  status: z.enum(['waiting', 'playing', 'finished']),
  players: z.record(PlayerState), // Record<uid, PlayerState>
  levelSeed: z.number(), // Deterministic planet generation
  createdAt: z.number()
});
```

### 5.3 Firestore Structure

Strict adherence to project rules.

- **Public Games (Lobbies):**
    
    - `artifacts/{appId}/public/data/lobbies/{lobbyId}`
        
- **Global Leaderboard:**
    
    - `artifacts/{appId}/public/data/scores/{userId}`
        
    - _Note:_ Since we can't use complex `orderBy` on the fly without indices, we will fetch the top list or update a single "HighScores" document if traffic allows, or fetch all scores (if low user count) and sort client-side.
        

## 6. Directory Scaffolding

```
/
├── biome.json              # Linter config
├── vite.config.ts
├── index.html
├── src/
│   ├── main.ts             # Entry point
│   ├── App.svelte          # Root component (handles routing via conditional rendering)
│   ├── assets/             # Sounds, Sprites (if any, mostly procedural)
│   ├── lib/
│   │   ├── config.ts       # Constants (Gravity constants, Ship speed, Zoom levels)
│   │   ├── firebase.ts     # Firebase Init, Auth, Firestore wrappers
│   │   ├── store.ts        # Svelte stores (user, lobby state, loading)
│   │   ├── schemas/
│   │   │   ├── common.ts   # Vector logic, Math helpers
│   │   │   └── game.ts     # Zod definitions for Game State
│   │   ├── engine/
│   │   │   ├── Loop.ts     # Main RAF loop
│   │   │   ├── Physics.ts  # Gravity, Collision, Wrapping logic
│   │   │   ├── Renderer.ts # Canvas drawing, Zoom logic, Particle system
│   │   │   ├── Input.ts    # Keyboard/Touch normalization
│   │   │   └── Audio.ts    # Synth sound generator
│   │   └── ui/
│   │       ├── Lobby.svelte        # Invite link generation, Player list
│   │       ├── GameHUD.svelte      # Health bars, Cooldowns, Zoom indicator
│   │       ├── Joystick.svelte     # Visual feedback for mobile touch
│   │       └── Leaderboard.svelte  # Global kills tracker
```

## 7. Implementation Roadmap

### Phase 1: The Engine (Vibe Check) - [COMPLETED v0.0.1]

- [x] Set up Svelte + Canvas.
- [x] Implement the "Ship" with differential thrust physics.
- [x] Implement Screen Wrapping.
- [x] Tuning: Single-engine thrust spirals, Max Speed cap, Inertia Damping.
- _Outcome:_ A playable tech demo with satisfying drift physics.

### Phase 2: Mobile Controls (Alpha) - [CURRENT v0.0.2]

- [ ] Implement Touch Inputs (Split screen tapping).
- [ ] Ensure Portrait Mode playability.
- [ ] Add Visual Feedback for touches (Joystick/Overlay).
- [ ] Prevent default touch behaviors (Scrolling/Zooming).

### Phase 3: Asset Gallery & Design System [Planned v0.0.3]

- [ ] Implement `/#gallery` hidden route.
- [ ] Refactor procedural assets (Ship, Asteroids) into pure functions.
- [ ] Create interactive workbench for standardizing "The Vibe" (Colors, Typography).
- [ ] Add controls to test physics assets in isolation.

### Phase 4: The Network (Lobby) - [Planned v0.0.4]

- Firebase Auth (Anon).
- Create Lobby / Join Lobby logic.
- URL parsing to join specific lobby IDs.

### Phase 5: Multiplayer Sync

- Hook up the physics loop to Firestore `onSnapshot`.
- Implement "Lerp" (Linear Interpolation) so enemy ships don't teleport, but slide to their new network positions.

### Phase 6: Combat & Juice

- Add Auto-fire logic.
- Add Antimatter Bomb.
- Add "Zoom" camera controller.
- Add Particle effects and Screen Shake.

### Phase 7: Persistence

- Save kills to Global Leaderboard.
- Polish UI.
