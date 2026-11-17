# Store release assessment: ranked Survival as an installable game

Date: 2026-11-13. Baseline: web release 0.6.2, challenge `ion-storm`.

## Question

Could ranked Survival and the Hangar, limited to sanctioned ships and parts, be
published as the official game on the Apple App Store, Google Play and Steam,
as a native or hybrid app? What are the options, what do they cost, and what
happens when the ranked rules change in 0.7.0?

## Answer

Yes, as a hybrid. The same web bundle goes into Capacitor for iOS and Android
and into Electron for Steam. A native rewrite is not justified.

The wrappers are the small part of the work. Most of the effort is in four
things the web alpha does not have and a store game needs: a game-only client
without the Lab, sound, gamepad input, and a decision on score integrity.

The assessment uses the ruleset model recorded in the
[game contract](../specs/game/spec.md) on 2026-11-13. A ruleset is the
simulation, its parameters, and the sanctioned ships and parts. It has one
board and never changes once it has one. A client carries one ruleset and
uses that board only. Clients with the same ruleset share a board, and
controls are each client's own.

Recommended order: do the shared groundwork on the web first, then a desktop
build on itch.io as a free packaging rehearsal, then Steam, then iPad, then
Android.

## How this was assessed

Four sub-agents gathered the data: two read the repository (stack inventory,
game scope and rules versioning), two researched the web (mobile wrappers and
store obligations, Steam). I spot-checked repository claims that looked wrong.
Web claims marked _unverified_ come from memory or a single vendor source.
Effort figures are my estimates in working days with agent-assisted
development; they are not measurements.

## What we have today

| Area          | State                                                                                                                          | Consequence for a port                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Build         | Static Astro 5 site, Svelte 5, no adapter, no server code                                                                      | Drops into any webview shell                                                            |
| Rendering     | Canvas 2D only, 1920×1080 logical frame, three flight layers                                                                   | No WebGL or shader porting                                                              |
| Simulation    | Fixed 1/60 s step (`packages/mode-a/src/lib/simulation.ts`), seeded systems                                                    | A 60 Hz webview cap costs nothing; replay verification is possible                      |
| Input         | Keyboard, and pointer-event thrust pads (`apps/web/src/components/controls/ThrustPads.svelte`)                                 | Touch exists for iPad landscape; no gamepad code                                        |
| Audio         | None                                                                                                                           | A store game without sound reads as unfinished                                          |
| Assets        | Procedural art, local fonts, no CDN calls                                                                                      | Runs offline once bundled                                                               |
| Backend       | Firebase anonymous auth and Firestore on the Spark plan; no Functions, App Check or analytics                                  | No accounts, so no account-deletion or sign-in-provider obligations                     |
| Scores        | Client-computed; Firestore rules check shape and consistency only                                                              | Cheating is trivial; fine for an alpha, a risk for "official ranked"                    |
| Identity      | Anonymous uid per install, three-letter initials                                                                               | Reinstall or new device loses personal bests                                            |
| Rules version | `CHALLENGE` literal in `packages/mode-a/src/schemas/highscore.ts`, mirrored in `firestore.rules`, which names `ion-storm` only | A store client carrying `ion-storm` shares the web board. See "Updating to 0.7.0 rules" |
| Game and Lab  | One Astro app; about 100 Lab pages beside six game pages; Practice, Derelicts, Gauntlet and Playground share the flight deck   | A store build must exclude the Lab and gate the unranked modes                          |
| Packaging     | No PWA manifest, service worker, CI, or wrapper code                                                                           | Everything on the packaging side is new                                                 |

Licence is MIT, so anyone may repackage the source. That does not block
publishing; it means the store listing and the leaderboard are what make a
build official.

## Options

### A. Installable web app (PWA)

Add a manifest and a service worker. Android, desktop Chrome and iPad Safari
can then install the game to the home screen. Cost is nothing and updates stay
instant. It is not in any store, and it does not meet "install from the store".
Worth doing anyway because the offline bundle is groundwork for every wrapper.

### B. Capacitor for iOS and Android (recommended for mobile)

Capacitor 8 needs iOS 15+, Android API 24+, Xcode 26 and Node 22. The web
bundle ships inside the binary.

- Performance: a 60 fps Canvas 2D game is feasible. WKWebView is reported to
  cap `requestAnimationFrame` at 60 Hz on ProMotion iPads; with a 60 Hz
  simulation that is not a problem. No current benchmark was found for Canvas
  2D in Android System WebView, so low-end Android is unmeasured.
- Firebase: popup and redirect sign-in are unreliable in WKWebView. Anonymous
  sign-in does not use them and should work (_unverified_).
- Apple review: a thin web wrapper is the standard rejection under the
  minimum-functionality guideline. The HTML5 games guideline permits bundled
  web games. Offline play, haptics and a bundled binary lower the risk. One
  mode and no sound raise it.
- Phones: the game is designed for keyboard and iPad landscape touch. A phone
  layout is new design work. Apple allows an iPad-only app; Google Play is
  mostly phones.
- Google Play: a personal developer account must run a closed test with 12
  testers opted in for 14 continuous days before production access.

Tauri 2 mobile was ruled out: its own release notes say mobile is not yet
first-class, it adds a Rust toolchain, and it gains nothing for a canvas game.
A Trusted Web Activity for Play was not researched in depth.

### C. Electron with steamworks.js for Steam (recommended for desktop)

Electron bundles Chromium, so rendering matches the web alpha and the Steam
overlay works. steamworks.js gives achievements and overlay; its leaderboard
support is _unverified_, which does not matter if the Firestore board stays.

Tauri was ruled out for Steam: the overlay reportedly does not work with
WebView2, no mature Tauri 2 Steamworks plugin was found, and Linux would render
through WebKitGTK, a third engine to test.

- First release lead time: identity and tax checks take 15 to 30 days, then 21
  days between fee and release, with a public "coming soon" page for at least
  two weeks. Plan for six to eight weeks from signing up.
- Steam Deck Verified needs full controller support with matching glyphs and a
  smallest font of 9 px at 1280×800. The 1080-line logical frame scales to
  about 0.67 on the Deck, so small text needs checking.
- No rule was found that forbids an external leaderboard. A store-page
  disclosure for third-party accounts may exist (_unverified_); anonymous
  sign-in probably does not count as an account.
- AI disclosure covers generated content the player consumes. Coding
  assistance is outside it, and the art is drawn by our own code.
- macOS builds need notarisation; Windows signing is probably unnecessary when
  distributing only through Steam (_unverified_).

itch.io takes desktop builds with no listing fee and no lead time. It is a
cheap rehearsal for the Electron packaging before paying Steam.

### D. Native rewrite (Godot, Unity, or a native canvas runtime)

This discards the TypeScript simulation, the procedural drawing code and the
Zod contracts, or at least the whole render layer. A rewritten simulation
would also have to behave identically to the TypeScript one to share a
ruleset's board, and every new ruleset would be implemented twice. Estimated
at months against weeks. Reconsider only if webview
performance on real devices turns out unacceptable.

## Repository setup

Decided 2026-11-15.

- Packaged releases live in one private repository with its own licence. It
  holds the game client, the Capacitor shell, the Electron shell, and the
  signing and store configuration. Store credentials and signing keys never
  enter this repository.
- The release repository takes a snapshot of the game from this repository at
  a ruleset. That forces a release path in which the ruleset is frozen. The
  imported simulation, parameters and sanctioned catalogue are not edited
  there. Screens, controls and shells are the release repository's own.
- Fixes are made in this repository and reach a release by a new snapshot.
  Nothing flows back from the release repository.

What this requires here:

- **A defined import set.** The rules live in `packages/core` and
  `packages/mode-a`, but the game's screens live in `apps/web` beside the Lab.
  The snapshot needs a stated list of game files, or the screens moved into a
  package of their own.
- **A maintenance line per released ruleset.** A fix that does not affect
  ranked play, such as a Hangar defect, must reach the store without bringing
  along whatever ruleset the web has moved to. That needs a branch kept at
  each released ruleset, where such fixes are applied and from which
  snapshots are taken. A fix that does affect ranked play is a new ruleset.
- **Licence housekeeping.** The copyright holder can release the same code
  under another licence. The bundled fonts and the npm dependencies keep
  their own licences and notices in the store builds.

The source of every ruleset stays public under MIT in this repository. The
private repository protects the shells, the mobile controls, the store assets
and the credentials. It does not make the game itself closed.

## Work needed

| Work                                                                                                                                                                             | Needed for                | Estimate                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Game-only client in the release repository: title, Hangar, flight, scores, settings and credits, imported at a ruleset, with no Lab, Practice, Derelicts, Gauntlet or Playground | All                       | 3–5 days                                                                                                         |
| Import path: a defined set of game files in this repository, and a script that snapshots them at a ruleset into the release repository                                           | All                       | 2–4 days                                                                                                         |
| Offline bundle, manifest, icons, safe areas, orientation lock                                                                                                                    | All                       | 2–3 days                                                                                                         |
| Mobile controls, designed for the client                                                                                                                                         | Mobile                    | Design work, not estimated                                                                                       |
| Gamepad input and glyphs                                                                                                                                                         | Steam; optional on mobile | 2–4 days                                                                                                         |
| Sound                                                                                                                                                                            | All, in practice          | Unknown. No audio design exists. `docs/architecture.md` prefers procedural audio, which fits Web Audio synthesis |
| Electron shell, Steam integration, store page, itch.io build                                                                                                                     | Steam                     | 4–7 days, plus lead time                                                                                         |
| Capacitor shells, haptics, privacy labels, store listings                                                                                                                        | Mobile                    | 5–8 days, plus review and the Play closed test                                                                   |
| Phone layout                                                                                                                                                                     | Phones                    | Design work, not estimated                                                                                       |
| Score integrity: replay submission checked by a Cloud Function                                                                                                                   | Optional                  | 5–10 days, and the Blaze plan                                                                                    |

Wrappers and shared groundwork come to roughly three to five weeks of work
before sound, mobile controls and any phone layout.

## Cost

| Item                                      | Cost                                                                                                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Apple Developer Program                   | $99 per year                                                                                                                                      |
| Google Play registration                  | $25 once                                                                                                                                          |
| Steam Direct                              | $100 once per app, recouped only after $1,000 revenue                                                                                             |
| itch.io                                   | Free                                                                                                                                              |
| Firebase Spark                            | Free. The daily Firestore read quota limits leaderboard views; a wider audience may force the Blaze plan (_quota figures not checked this round_) |
| Live web-bundle updates (Capgo), optional | From about $14 per month                                                                                                                          |
| iOS builds                                | Need a Mac, which we have                                                                                                                         |
| Windows testing                           | Needs a Windows machine or VM                                                                                                                     |

A free game never recoups the Steam fee, and the Apple fee recurs for as long
as the app stays listed. Stores also require a privacy policy URL, and selling
in the EU as a trader publishes contact details on the listing (_both from
memory, unverified_). No monetisation stance exists in the docs; free versus
paid is an open decision that changes tax paperwork and that disclosure.

## Maintenance

- Apple requires builds against the current Xcode and SDK each April. Google
  requires a new target API level each August. Each is a rebuild and a
  resubmission, even with no game change.
- Capacitor and Electron need a major upgrade roughly once a year. Electron
  also carries Chromium security updates.
- Every store release is three submissions with screenshots, notes and review
  waits.
- The store client releases on its own schedule. Web releases, Lab work and
  new web rulesets never force a store release.
- Each ruleset that a released client carries keeps its rule in
  `firestore.rules`, so the rules file grows by one rule per ruleset.

## Updating to 0.7.0 rules

A rules update is a new ruleset with a new name and a new board. A store
client moves to it by shipping a release that carries it. Until a player
installs that release, their build keeps working on the board of the ruleset
it carries, because boards do not close. No installed build is stranded and
no version check is needed.

The web and the store client choose their rulesets independently. Both can
carry `ion-storm` and share its board. When a later ruleset exists, either
client may move to it while the other stays.

Consequences to plan for:

- Sanctioning a new ship or part makes a new ruleset, so the store client
  gains ships only through a ruleset change, which starts an empty board.
- A defect that affects scores stays in its ruleset. The fix is a new ruleset.
- After an update, players on the old and new store builds are on different
  boards until the old build falls out of use.
- Keeping a ruleset's name in step with its content is a judgement made at
  release, by the procedure in `docs/development.md`. With two clients on one
  board, that judgement covers both.
- Where scores are stored and how they are verified is an alpha arrangement
  and is undecided for later stages.

Nothing in the docs, specs or plans describes 0.7.0 yet, so its size is
unknown.

## Open decisions

1. Free or paid.
2. Which ruleset the first store client carries, and whether the web keeps
   carrying it.
3. Whether "official ranked" needs score verification before a store release.
4. iPad only, or phones as well.
5. Sound direction.
6. Name: no check was made for existing "Void Drift" titles on the stores.

## Not verified in this round

Android webview canvas performance and gamepad behaviour; Steam Input with the
web Gamepad API; Google Play Games Services policy; EU trader disclosure
details; Firebase quota figures; whether Steam reviews each build after the
first release.

## Sources

- Capacitor 8: https://ionic.io/blog/announcing-capacitor-8 ,
  https://capacitorjs.com/docs/next/updating/8-0
- WKWebView frame rate: https://bugs.webkit.org/show_bug.cgi?id=294338
- Firebase auth in Capacitor: https://capawesome.io/plugins/firebase/authentication
- Tauri 2 mobile: https://v2.tauri.app/blog/tauri-2-0-0-release-candidate/
- Apple review guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple build requirements: https://developer.apple.com/news/upcoming-requirements/
- Apple Developer Program: https://developer.apple.com/programs/whats-included/
- Google Play fee and testing gate:
  https://support.google.com/googleplay/android-developer/answer/14659200 ,
  https://support.google.com/googleplay/android-developer/answer/14151465
- Google target API: https://developer.android.com/google/play/requirements/target-sdk
- Live updates: https://capawesome.io/blog/how-live-updates-for-capacitor-work/ ,
  https://capgo.app/blog/do-google-allow-live-updates/
- Steam Direct: https://partner.steamgames.com/steamdirect ,
  https://partner.steamgames.com/doc/gettingstarted/appfee ,
  https://partner.steamgames.com/doc/gettingstarted/onboarding ,
  https://partner.steamgames.com/doc/store/coming_soon
- Steam free games: https://partner.steamgames.com/doc/store/freetoplay
- steamworks.js: https://github.com/ceifa/steamworks.js
- WebView2 and the Steam overlay:
  https://github.com/MicrosoftEdge/WebView2Feedback/discussions/4019
- Tauri on Linux: https://v2.tauri.app/develop/debug/linux-graphics/
- Steam Deck compatibility: https://partner.steamgames.com/doc/steamdeck/compat
- Steam content survey and AI disclosure:
  https://partner.steamgames.com/doc/gettingstarted/contentsurvey
- Steam tax FAQ: https://partner.steamgames.com/doc/finance/taxfaq
