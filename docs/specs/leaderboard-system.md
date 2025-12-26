# Feature: Leaderboard System (High Scores)

**Status:** PLANNED  
**Target Version:** v0.2.0  
**Phase:** 6 (High Scores)

---

## Blueprint

### Context

Mode A's survival gameplay needs a competitive element to drive replayability. The leaderboard system provides:

- **Global competition:** Players compete for the longest survival time
- **Arcade identity:** Classic 3-letter initials (AAA, ACE, etc.)
- **Anti-cheat baseline:** Anonymous auth ties scores to device/session
- **Death context:** Scores show how the player died (STAR/HULL/POWER)

**Why This Architecture:**
- Firebase Anonymous Auth requires no signup (frictionless)
- Firestore provides real-time capable database with free tier
- UID hashing prevents exposing raw user IDs while maintaining uniqueness
- Client-side validation + security rules provide defense in depth

### Architecture

#### Data Flow

```
[Game Over] → [Initials Entry] → [Generate UID Hash] → [Submit to Firestore] → [Leaderboard Display]
     ↑                                                         ↓
     └──────────────────── [Play Again] ←──────────────────────┘
```

#### Firebase Services

| Service | Purpose |
|---------|---------|
| Anonymous Auth | Generate stable UID per device/session |
| Firestore | Store and query high scores |
| Security Rules | Validate writes, prevent tampering |

#### Firestore Schema

**Collection:** `highscores`

```typescript
// packages/mode-a/src/lib/schemas/highscore.ts
import { z } from 'zod';

export const HighScoreSchema = z.object({
  initials: z.string().length(3).regex(/^[A-Z]{3}$/),
  uidHash: z.string().length(6).regex(/^[A-F0-9]{6}$/),
  seconds: z.number().min(0).max(999999),
  deathCause: z.enum(['STAR', 'HULL', 'POWER']),
  timestamp: z.number(),       // Unix ms
  userId: z.string(),          // Raw UID for security rules
});

export type HighScore = z.infer<typeof HighScoreSchema>;
```

**Document Structure:**
```json
{
  "initials": "ACE",
  "uidHash": "A3F8B2",
  "seconds": 142.35,
  "deathCause": "HULL",
  "timestamp": 1703001234567,
  "userId": "abc123xyz..."
}
```

#### UID Hash Generation

```typescript
// packages/mode-a/src/lib/auth/hash.ts
export async function generateUidHash(uid: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(uid);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 6).toUpperCase();
}
```

**Example:**
- UID: `xK9mNpQrStUvWxYz...` (Firebase anon UID)
- Hash: `A3F8B2` (first 6 hex chars, uppercase)

---

### Anti-Patterns

**NEVER:**
- Store raw UID in displayed leaderboard (privacy)
- Allow score submission without auth (spam)
- Trust client-sent `seconds` without server validation (cheating)
- Use `onSnapshot` for leaderboard (unnecessary cost)

**AVOID:**
- Complex validation logic in security rules (keep simple)
- Storing additional user data (GDPR concerns)
- Real-time leaderboard updates (fetch on demand)

---

## Contract

### Definition of Done

#### Authentication
- [ ] Firebase project configured with Anonymous Auth enabled
- [ ] User automatically signed in anonymously on first visit
- [ ] Auth state persists across page refreshes
- [ ] UID available before score submission

#### Initials Entry
- [ ] 3-letter input with arcade-style UI
- [ ] Keyboard input (A-Z only, auto-uppercase)
- [ ] On-screen letter buttons for mobile
- [ ] Backspace/delete support
- [ ] Submit button enabled only when 3 letters entered
- [ ] Default initials: `AAA`

#### Score Submission
- [ ] Score submitted on initials confirmation
- [ ] Includes: initials, uidHash, seconds, deathCause, timestamp, userId
- [ ] Firestore write succeeds within 2 seconds
- [ ] Error handling for network failures (retry option)
- [ ] Validation matches Zod schema

#### Leaderboard Display
- [ ] Route: `/leaderboard`
- [ ] Displays top 20 scores sorted by seconds (descending)
- [ ] Shows: rank, initials, uidHash, time, death cause icon
- [ ] Current player's score highlighted if in top 20
- [ ] Loading state while fetching
- [ ] Empty state if no scores exist
- [ ] Link back to game

#### Security Rules
- [ ] Read: Anyone can read highscores
- [ ] Create: Only authenticated users, userId must match auth.uid
- [ ] Update/Delete: Denied (scores are immutable)
- [ ] Validate: seconds > 0, initials is 3 uppercase letters

---

### Regression Guardrails

**Performance:**
- Leaderboard fetch < 500ms on good connection
- Initials entry UI renders at 60fps
- No layout shift during score submission

**Security:**
- Unauthenticated writes rejected
- Mismatched userId writes rejected
- Invalid data format writes rejected

**UX:**
- Score submission works offline (queued)
- Network errors don't crash the game
- User can skip leaderboard and play again

---

### Scenarios

**Scenario 1: First-Time Player Submits Score**
- Given a player has never visited before
- When they die for the first time
- Then they are automatically signed in anonymously
- And they see the initials entry screen
- And they can enter 3 letters and submit
- And their score appears in the leaderboard

**Scenario 2: Returning Player Submits Score**
- Given a player has visited before (has stored auth)
- When they die
- Then they use their existing anonymous UID
- And the uidHash matches their previous entries
- And they can have multiple scores in the leaderboard

**Scenario 3: Network Failure During Submission**
- Given a player submits their score
- When the network request fails
- Then they see an error message
- And they can retry submission
- Or they can skip and play again

**Scenario 4: Viewing Leaderboard**
- Given a player navigates to `/leaderboard`
- When the page loads
- Then they see top 20 scores
- And scores are sorted by time (longest first)
- And each entry shows initials, hash, time, death icon

**Scenario 5: Player in Top 20**
- Given a player just submitted a top-20 score
- When they view the leaderboard
- Then their entry is visually highlighted
- And they can easily identify their score

---

## Technical Implementation

### Config Structure

**Config Location:** `apps/web/src/lib/firebase/config.ts`

```typescript
// Firebase config params (values from Firebase console)
export const FIREBASE_CONFIG = {
  apiKey: /* env var */,
  authDomain: /* env var */,
  projectId: /* env var */,
  storageBucket: /* env var */,
  messagingSenderId: /* env var */,
  appId: /* env var */,
} as const;

// Leaderboard config
export const LEADERBOARD_CONFIG = {
  COLLECTION_NAME: 'highscores',
  MAX_DISPLAY_COUNT: number,      // Top N scores to show
  FETCH_TIMEOUT_MS: number,       // Network timeout
  DEFAULT_INITIALS: 'AAA',
} as const;
```

### File Structure

```
apps/web/src/
├── lib/
│   └── firebase/
│       ├── config.ts           # Firebase + leaderboard config
│       ├── init.ts             # Firebase app initialization
│       ├── auth.ts             # Anonymous auth helpers
│       └── highscores.ts       # Firestore read/write helpers
├── pages/
│   └── leaderboard.astro       # Leaderboard route
└── components/
    ├── InitialsEntry.svelte    # 3-letter input UI
    ├── Leaderboard.svelte      # Score list display
    └── LeaderboardEntry.svelte # Single score row

packages/mode-a/src/lib/
├── schemas/
│   └── highscore.ts            # HighScore Zod schema
└── auth/
    └── hash.ts                 # UID hash generation
```

### Security Rules

**Location:** `firestore.rules` (project root)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /highscores/{scoreId} {
      // Anyone can read
      allow read: if true;
      
      // Only authenticated users can create
      // userId must match the authenticated user
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.initials.matches('^[A-Z]{3}$')
        && request.resource.data.seconds > 0
        && request.resource.data.seconds < 1000000;
      
      // No updates or deletes (scores are immutable)
      allow update, delete: if false;
    }
  }
}
```

### UI Components

#### Initials Entry

```
┌─────────────────────────────────────┐
│                                     │
│         ENTER YOUR INITIALS         │
│                                     │
│            [ A ] [ A ] [ A ]        │
│                                     │
│   A B C D E F G H I J K L M         │
│   N O P Q R S T U V W X Y Z         │
│              [ ← ]                  │
│                                     │
│           [ SUBMIT SCORE ]          │
│                                     │
│          [ SKIP → PLAY AGAIN ]      │
│                                     │
└─────────────────────────────────────┘
```

#### Leaderboard

```
┌─────────────────────────────────────┐
│                                     │
│           HIGH SCORES               │
│                                     │
│   #   INITIALS    TIME    CAUSE     │
│   ─────────────────────────────     │
│   1.  ACE·A3F8B2  142.35s   ☠️       │
│   2.  VXN·9D4E1C  128.70s   ⚡       │
│   3.  YOU·FFFFFF   85.20s   🔥  ←   │
│   ...                               │
│                                     │
│          [ PLAY AGAIN ]             │
│                                     │
└─────────────────────────────────────┘
```

**Death Cause Icons:**
- STAR: 🔥 or sun icon (incinerated)
- HULL: ☠️ or broken ship (hull failure)
- POWER: ⚡ or battery (out of power)

---

## Implementation Order (PBIs)

### PBI-025: Firebase Project Setup (2 SP)
- Create Firebase project
- Enable Anonymous Auth
- Configure Firestore
- Add environment variables
- Deploy security rules

### PBI-026: Anonymous Auth Flow (3 SP)
- Initialize Firebase in app
- Implement auto-signin on load
- Persist auth state
- Export auth helpers (getUid, isAuthenticated)
- Add UID hash generation

### PBI-027: Initials Entry UI (3 SP)
- Create InitialsEntry.svelte component
- 3-letter display with cursor
- On-screen keyboard (A-Z + backspace)
- Physical keyboard support
- Submit/skip buttons

### PBI-028: Score Submission (3 SP)
- Create highscore Zod schema
- Implement Firestore write helper
- Wire initials entry to submission
- Handle success/error states
- Add retry mechanism

### PBI-029: Leaderboard Display (3 SP)
- Create `/leaderboard` route
- Implement Firestore query (top N, sorted)
- Build Leaderboard.svelte component
- Add death cause icons
- Highlight current player's score
- Loading/empty states

---

## Known Limitations

**v0.2.0:**
- No server-side score validation (client-trusted)
- No rate limiting on submissions
- No score deletion (admin only via Firebase console)
- No profile/account system

**Future Enhancements:**
- Server-side validation via Cloud Functions
- Daily/weekly leaderboards
- Personal best tracking
- Score sharing (social cards)
- Replay system (verify scores)

---

## Dependencies

- Firebase project with Blaze plan (free tier sufficient)
- Environment variables configured for Firebase
- PBI-021 (Package Restructure) completed first

---

## Related Documents

- [Survival Core Spec](./survival-core.md) — Death cause types
- [Design System Spec](./design-system-core.md) — UI tokens
- [Phase 6 Roadmap](../PHASE-6-ROADMAP.md) — Implementation timeline
