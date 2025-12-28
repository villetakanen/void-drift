# PBI-025: Firebase Project Setup

**Status:** REJECTED  
**Reason:** Architecture pivot to Supabase (see PBI-026). Firebase implementation abandoned in favor of PostgreSQL/Supabase for better leaderboard querying and free tier benefits.

## User Story

**As a** developer  
**I want** Firebase configured for the project  
**So that** we can implement authentication and leaderboard features

---

## Context

This is the foundational PBI for the leaderboard system. It sets up the Firebase project and configures the necessary services without implementing any application logic.

**This PBI is infrastructure-only.** No application code changes except environment configuration.

---

## Acceptance Criteria

### Firebase Project
- [ ] Firebase project created in Firebase Console
- [ ] Project name follows convention: `void-drift` or `void-drift-prod`
- [ ] Blaze plan enabled (required for some features, free tier sufficient)

### Authentication
- [ ] Anonymous Authentication enabled in Firebase Console
- [ ] No other auth providers enabled (keep minimal)

### Firestore
- [ ] Firestore database created in production mode
- [ ] Database location selected (prefer `us-central1` or nearest region)
- [ ] Security rules deployed (see below)

### Environment Variables
- [ ] `.env.example` created with placeholder keys
- [ ] `.env.local` added to `.gitignore` (if not already)
- [ ] Environment variables documented in README or CONTRIBUTING

### Security Rules
- [ ] `firestore.rules` file created in project root
- [ ] Rules deployed to Firebase
- [ ] Rules tested in Firebase Console Rules Playground

---

## Technical Implementation

### Environment Variables

**File:** `.env.example`

```bash
# Firebase Configuration
# Copy to .env.local and fill with values from Firebase Console
PUBLIC_FIREBASE_API_KEY=
PUBLIC_FIREBASE_AUTH_DOMAIN=
PUBLIC_FIREBASE_PROJECT_ID=
PUBLIC_FIREBASE_STORAGE_BUCKET=
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
PUBLIC_FIREBASE_APP_ID=
```

**Note:** `PUBLIC_` prefix required for Astro to expose to client.

### Security Rules

**File:** `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /highscores/{scoreId} {
      // Anyone can read leaderboard
      allow read: if true;
      
      // Only authenticated users can create scores
      // userId field must match authenticated user
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.initials.matches('^[A-Z]{3}$')
        && request.resource.data.seconds > 0
        && request.resource.data.seconds < 1000000
        && request.resource.data.deathCause in ['STAR', 'HULL', 'POWER'];
      
      // Scores are immutable - no updates or deletes
      allow update, delete: if false;
    }
  }
}
```

### Firebase Config File

**File:** `firebase.json`

```json
{
  "firestore": {
    "rules": "firestore.rules"
  }
}
```

---

## Definition of Done

- [ ] Firebase project exists and is accessible
- [ ] Anonymous Auth enabled
- [ ] Firestore database created
- [ ] Security rules deployed and tested
- [ ] Environment variables documented
- [ ] Firebase CLI can deploy rules successfully

---

## Testing Checklist

### Firebase Console
- [ ] Can access project dashboard
- [ ] Anonymous Auth shows in Authentication > Sign-in method
- [ ] Firestore shows empty `highscores` collection (or ready for first write)

### Security Rules Playground
- [ ] Unauthenticated read of `/highscores/test` → ALLOWED
- [ ] Unauthenticated create of `/highscores/test` → DENIED
- [ ] Authenticated create with matching userId → ALLOWED
- [ ] Authenticated create with mismatched userId → DENIED
- [ ] Authenticated update of existing doc → DENIED

---

## Out of Scope

- Firebase SDK installation (PBI-026)
- Application code changes (PBI-026+)
- Hosting configuration (Phase 8)

---

## Dependencies

- Google account for Firebase Console access
- Firebase CLI installed locally (`npm install -g firebase-tools`)

---

## Related Documents

- [Leaderboard System Spec](../specs/leaderboard-system.md)
- [Phase 6 Roadmap](../PHASE-6-ROADMAP.md)
