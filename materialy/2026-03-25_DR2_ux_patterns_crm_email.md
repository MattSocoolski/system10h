# UX blueprint for an AI-powered CRM email app

**An AI operating system that scans Gmail, drafts replies, and manages your pipeline needs UX patterns that build trust while maximizing throughput.** The best mobile CRM and email apps — Superhuman, Spark, HubSpot, Pipedrive — have converged on specific gesture vocabularies, notification architectures, and offline strategies that directly apply to this product. This report distills concrete interaction patterns, named design systems, and technical architectures from the top apps in each category across six research areas: draft review, AI transparency, pipeline UX, push notifications, offline-first architecture, and onboarding flows.

The core tension in this app is unique: AI acts on your behalf (reading emails, writing drafts, updating CRM), which demands higher trust thresholds than typical productivity tools. Every UX decision — from swipe direction to notification copy to permission sequencing — must resolve the tension between speed (approve drafts fast) and control (never send something wrong). The patterns below show exactly how the best apps solve this.

---

## 1. Draft review demands Spark's four-zone swipe model, not Tinder cards

The most critical interaction in this app is reviewing AI-generated drafts. Research across Superhuman, Spark, Edison Mail, HubSpot, Salesforce, and Front reveals a clear winner for approve/reject workflows on mobile.

**Spark's four-zone swipe system** is the optimal pattern. It maps short-left, long-left, short-right, and long-right to four independent actions — configurable per user. For an AI draft review flow, the recommended mapping is: **short-right → approve, long-right → approve-and-send, short-left → reject, long-left → edit**. Spark's key insight is that short swipes should cause the item to leave the inbox, so your thumb stays in the same position as the next item slides up. This enables rapid batch processing without repositioning.

**Superhuman's approach** offers complementary patterns worth adopting. Their two-finger tap opens a contextual command palette (replacing long-press, which is reserved exclusively for text selection). Their triage bar — a scrollable action row at the bottom of open messages — intentionally truncates to hint at more options. After any action, auto-advance moves to the next message automatically, eliminating navigation taps. Superhuman's Split Inbox (AI-sorted tabs: Important, Other, VIP, Team) maps directly to draft categorization by confidence level or lead priority.

**Tinder-style card stacks are wrong for this use case.** While binary swipe-to-approve feels intuitive, email drafts require reading text (not visual snap judgments), often need editing rather than pure approve/reject, and require CRM context that doesn't fit on a card. The "swipe right" gesture also carries strong romantic cultural coding that feels inappropriate in a B2B context. Research from AVI 2012 found swiping requires more attention than tapping in distracted contexts, and repeated swipe errors compound — unlike taps, where failures are straightforward to diagnose.

**Batch processing is essential for high-volume users.** Spark auto-suggests batch actions matching configured swipe actions, creating consistency between individual and bulk workflows. The recommended pattern: long-press enters select mode → checkboxes appear on all rows → contextual action bar replaces the toolbar showing "N selected" with Approve All, Reject All, and Edit buttons. Add an **"Approve all high-confidence"** filter button that selects only drafts above a configurable threshold (e.g., 90% style match), letting power users clear safe drafts in one tap.

**For draft preview, use inline expand with progressive disclosure.** Show a collapsed card with: recipient name, subject line, first 2 lines of AI draft, and a confidence indicator. Tap to expand inline (not full-page navigation), revealing the complete draft with the original email thread collapsed above. Full-page compose view should only appear when the user taps "Edit." Front's shared draft pattern — where drafts show a gray banner indicating visibility and support real-time collaborative editing — is worth adopting for team-based draft review.

**The undo mechanism should use a 5-8 second toast** for routine approvals and **10-15 seconds for sends/rejections**. Place the toast within the bottom-third thumb zone. Research suggests **68% of critical email mistakes occur between seconds 6-27** after sending, and mobile users have 29% higher mis-send rates than desktop. Include haptic feedback on action execution. The undo button should be the only interactive element in the toast — no competing buttons.

---

## 2. No major consumer app shows explicit confidence percentages

The most striking finding across GitHub Copilot, Notion AI, Grammarly, Google Smart Compose, Apple Intelligence, ChatGPT, and Microsoft Copilot: **not a single major consumer app displays numerical confidence scores.** Every app uses implicit signals instead. This has direct implications for how to surface "85% style match."

**The confidence display spectrum** ranges from invisible to explicit:

- **Threshold filtering** (Gmail Smart Compose): Only show high-confidence predictions. Low-confidence ones simply don't appear. This is the lightest-touch approach.
- **Color-coded severity** (Grammarly): Red underlines for definite errors, blue for clarity, green for engagement, purple for tone. Four colors encode four confidence levels without numbers.
- **Reduced opacity** (Microsoft Copilot): AI-generated content appears at lower opacity until the user reviews and approves it — a "governor mechanism" that makes AI output visually subordinate.
- **Ghost text** (GitHub Copilot, Gmail): Dimmed gray inline text predictions, accepted with Tab/swipe, dismissed by continuing to type. Deliberately minimal.
- **Animated underlines** (Apple Intelligence): Smooth, progressive highlighting communicates that the AI has "thought through" each change. Animation smoothness serves as implicit confidence.

**For the CRM email app, avoid raw percentages.** Instead, use a three-tier qualitative system: a **green checkmark** with "Matches your voice" for high confidence (>85%), a **yellow dot** with "Close match" for medium (70-85%), and an **orange warning** with "Needs review" for lower confidence (<70%). Tap the indicator to see a detailed breakdown: tone match, formality level, length comparison to user's typical replies. This follows Google PAIR's guideline: "Help users calibrate trust, not maximize it."

**The AI badge pattern has converged on purple + sparkle.** Notion uses purple-highlighted AI commands. Grammarly uses purple for tone suggestions. Apple Intelligence uses a hypocycloid sparkle icon. The emerging standard is a **small sparkle icon (✨) in the app's accent color** as the entry point to AI features, with a subtle "AI" label badge on generated content. Notion has started moving away from the sparkle to a custom branded icon — the sparkle may become less necessary as AI features become standard.

**"Why did AI write this?" belongs behind a tap, not inline.** Implement it as a small ℹ️ icon on each draft card that opens a bottom sheet explaining: which emails the AI analyzed, what tone it detected, and what CRM context influenced the reply. Apple's Writing Tools pattern — corrections with per-item explanation plus "Revert to Original" — is the right model. Keep the explanation under 3 sentences. Google PAIR's principle: "Explain for understanding, not completeness."

**Progressive trust building should follow the "Autonomy Dial" pattern** from Smashing Magazine's 2026 agentic AI research. Users set their preferred AI independence level per action type across four levels: *Observe & Suggest* → *Plan & Propose* → *Act with Approval* → *Act Autonomously*. New users start at level 2 (AI drafts replies, user must approve each one). As accuracy improves and user trust grows — measured by approval rate and edit frequency — the app suggests increasing autonomy: "You've approved 94% of AI drafts this month. Want to auto-send replies to routine meeting confirmations?"

---

## 3. Single-stage swipeable kanban beats cramming columns on mobile

Research across Pipedrive, Close CRM, HubSpot, Attio, Folk, Monday.com, Streak, and Copper reveals that mobile pipeline visualization has a clear best practice, and it's not the desktop kanban board.

**The single-stage swipeable view** (used by Pipedrive and Monday.com) outperforms full kanban on phones. Each pipeline stage fills the screen width. Users swipe horizontally between stages while scrolling vertically through deals within each stage. Stage headers show name + deal count + total value (e.g., "Proposal | 12 deals | $340K"). This solves the fundamental problem: a 5-column kanban board on a 390px-wide iPhone shows ~78px per column — too narrow for readable deal cards.

**Deal card anatomy should show exactly five data points.** Across all apps studied, the optimal mobile deal card contains: deal/lead name (bold), company name, monetary value, a time indicator (close date or "last contacted 3 days ago"), and one urgency signal (color-coded: green for recent activity, yellow for stale, red for overdue). HubSpot allows 4 customizable properties per pipeline card. Monday.com shows 3 columns plus a person avatar. More than 5 visible data points creates cognitive overload on mobile.

**Quick actions should combine a FAB with inline swipe.** Use a **floating action button** (bottom-right) exclusively for the single most important creation action: "Add Lead" or "Log Activity." For per-item actions (call, email, change stage, add note), use **swipe gestures on deal cards** — consistent with the draft review swipe vocabulary. Long-press opens a bottom sheet with the full action menu. Research from MDPI found UX experts are skeptical of FABs for complex actions, but Google's own research shows users rely on FABs to navigate unfamiliar screens. The solution: FAB for creation, swipe for quick actions, bottom sheet for everything else.

**HubSpot's mobile-first innovations are worth stealing.** Their **custom keyboard extension** lets users insert CRM data (snippets, templates, contact info) into any messaging app — LinkedIn, WhatsApp, SMS. Their **Caller ID overlay** shows CRM contact info (name, company, deal name, deal amount) on incoming call screens without saving contacts to the phone. Their **business card scanner** uses AI to create CRM contacts from photos. These leverage mobile hardware in ways desktop CRMs cannot.

**For contact/lead detail views, use a sticky header with tabbed sections.** Pin key info at the top (name, company, phone/email action buttons). Below, three tabs: Overview (key metrics as cards), Timeline (chronological activity feed), and Files/Notes. Close CRM's communication-first approach — prioritizing the activity timeline over data fields — is the right instinct for a mobile companion app. HubSpot's middle-column widgets (stage tracker, association cards) provide a good model for the Overview tab.

**Search and filter should use persistent filter chips + a bottom sheet.** Place 4-5 quick-access filter chips at the top of list views ("My Leads," "Closing This Week," "High Value," "Needs Follow-up"). Tapping a "Filter" chip opens a modal bottom sheet with full options: stage multi-select, owner filter, date range, deal value range, activity status. Pipedrive's pre-built filters like "No contact 7+ days" reportedly raised engagement by **34%**. Support saved filter configurations (HubSpot allows up to 5 on mobile).

---

## 4. Five to eight notifications per day is the CRM budget ceiling

Push notification strategy can make or break an AI-powered app that generates content on the user's behalf. Research across Superhuman, Spark, HubSpot, Salesforce, Slack, and Linear — combined with iOS platform capabilities — reveals a precise framework.

**The daily notification budget is 5-8 pushes maximum.** The average smartphone user receives **46-63 notifications per day** across all apps. Users who receive 5+ notifications per week from a single app are **64% more likely to delete it**. But users who disable push notifications are **52% more likely to churn entirely**. The sweet spot for a CRM app: 1-2 immediate (urgent items), 1 morning digest (overnight AI activity), 1 evening digest (pipeline changes), and 2-3 contextual (real-time email opens, meeting reminders).

**Spark's Smart Notifications model is the right foundation.** Rather than ML classification, Spark uses a behavioral signal: only notify about emails from people the user has previously replied to. Everything else is muted by default. For the AI CRM app, translate this to: only push immediately for leads the user has engaged with in the last 14 days. New lead notifications can batch to the morning digest. This is transparent, predictable, and gives users a clear mental model of when they'll be interrupted.

**iOS notification categories should support approve/reject from the Lock Screen.** Register four categories at app launch:

- **AI_DRAFT_READY**: Actions — "Review Draft" (opens app), "Send As-Is" (requires Face ID), "Edit" (opens app)
- **DEAL_UPDATE**: Actions — "View Deal" (opens app), "Call Now" (opens app)
- **APPROVAL_REQUEST**: Actions — "Approve" (requires Face ID, background), "Reject" (destructive, requires Face ID), "Add Comment" (text input)
- **EMAIL_ACTIVITY**: Actions — "Send Follow-up" (opens app), "View" (opens app)

Adding actionable CTAs boosts notification outcomes by **40%+** according to MoEngage data. Transactional notifications (like "Client responded to your proposal") see **69% average open rates** vs. 7.8% for generic pushes.

**Use iOS interruption levels strategically.** Time-Sensitive (breaks Focus modes) only for: deal closing today, contract expiring, approval blocking a teammate. Active (default) for: new deal assignment, prospect reply, meeting in 15 minutes. Passive (no sound/vibration) for: AI processing complete, weekly summary, pipeline digest. Never use Critical — it requires an Apple entitlement and is reserved for health/safety.

**iOS Live Activities are a compelling differentiator.** A "Sales Day" Live Activity on the Lock Screen showing pending draft count, next meeting countdown, and daily pipeline delta keeps the app present without spamming notifications. Dynamic Island compact view shows pending drafts badge + next meeting time. Apps using Live Activities show **23.7% higher 30-day retention rates**. The Activity can update via push token, persists for up to 8 hours, and works even when the app is backgrounded.

**Slack's cross-device awareness pattern prevents duplicate interruptions.** If the user is active on desktop (detected via API), suppress mobile push notifications. Send mobile push only after 1-10 minutes of desktop inactivity. For the AI CRM app: if the user is reviewing drafts on web, don't push mobile notifications for the same drafts. Track "last active device" server-side and route notifications accordingly.

**Notification copy for AI actions must reduce anxiety.** Lead with what the AI did, not that it acted autonomously. Good: "Sarah Chen replied to your proposal — AI drafted a response for you to review." Bad: "AI automatically processed an incoming email." Always include an undo path in the notification or its expanded view. For post-action notifications: "✅ AI scheduled your meeting with David Park for Thursday 2pm (you pre-approved scheduling) — [View Details] [Undo]."

---

## 5. TanStack Query plus SQLite outbox is the right offline architecture

The offline-first stack for an Expo/React Native CRM app has a clear recommended architecture. Research across TanStack Query, expo-sqlite, WatermelonDB, MMKV, PowerSync, and comparison of Linear, Notion, Todoist, and Figma's approaches converges on a specific pattern.

**TanStack Query v5 is excellent as the API layer but insufficient alone for offline CRM.** It handles optimistic updates, mutation pausing when offline, and automatic replay on reconnect via `resumePausedMutations()`. But it's a cache, not a database — no JOINs, no complex filtering, no partial sync. For a CRM with contacts, deals, drafts, and activities, the full cache serialization becomes slow at **10K+ records**. The critical limitation: `mutationFn` cannot be serialized, so you must register default mutation functions via `setMutationDefaults` at app startup for mutations to survive app kills.

**The recommended stack is TanStack Query + expo-sqlite + Drizzle ORM + MMKV.** Each layer serves a distinct purpose:

- **TanStack Query**: API calls, optimistic UI updates, server state synchronization
- **expo-sqlite with Drizzle ORM**: Local source of truth, complex queries, the outbox table for pending mutations
- **MMKV**: Auth tokens, user preferences, TanStack Query cache persistence (20-30x faster than AsyncStorage)
- **@react-native-community/netinfo**: Online/offline detection (must be manually wired — React Native doesn't auto-detect like browsers)

**The outbox pattern is the critical offline primitive.** Every mutation (approve draft, update lead, reject draft) writes to both the local SQLite database and an outbox table simultaneously. The outbox stores: entity type, action, JSON payload, idempotency key, timestamp, and status (pending/synced/failed/conflict). When the device comes online, a sync engine processes the outbox in order. Idempotency keys prevent duplicate operations on retry. This is the pattern Todoist uses in production, handling **92% of users who make ≤3 edits per hour** with zero conflicts.

**Field-level last-write-wins is the right conflict resolution strategy.** CRDTs are overkill for CRM. Linear, Todoist, and Figma all use last-write-wins in production. Linear explicitly has **no creation-date checking** — if you edit offline and a teammate changes the same field, the last write overwrites. For the specific conflict of "draft approved offline but email already replied to on web," this is a business logic conflict, not a data conflict. The server validates state transitions: `approved` is only valid from `pending_review`. If the server finds the draft already in `replied` state, it rejects the approval and returns an error. The client shows: "This draft was already sent by [teammate] at [time]. Your approval has been reverted."

**Background sync uses expo-background-task** (replacement for expo-background-fetch) with a minimum 15-minute interval and 30-second execution window on iOS. This supplements — but cannot replace — foreground sync triggers on network status change, app foregrounding, and after each local mutation. The sync engine must use a mutex guard (one sync at a time) to prevent race conditions.

**Total local footprint for a typical sales rep is 20-50MB.** Cache all assigned contacts (5K × ~2KB = ~10MB), active deals (1-2K records), all pending drafts (<100), last 30 days of activities, and metadata for recent email threads. Do not cache file contents — download on demand. SQLite handles 50MB databases with sub-millisecond single-record reads. Performance only degrades noticeably above 500MB.

**When to consider PowerSync instead:** If the app evolves to need automatic bi-directional sync with Postgres, real-time collaborative editing across multiple users on the same records, or the data model grows to many interrelated entities. PowerSync is production-ready (v1.0+), uses Rust-based sync, and integrates with Drizzle ORM. But for draft approval as the primary offline action, the simpler TanStack Query + SQLite + outbox pattern gives full control without vendor lock-in.

---

## 6. Show AI magic before asking for Gmail access

The onboarding flow determines whether users trust the app enough to grant email access. Research across Superhuman, Spark, Notion AI, ChatGPT, Grammarly, and Loom reveals a precise permission sequencing strategy and trust-building framework.

**Superhuman's synthetic inbox is the model to follow.** Their current onboarding (evolved from the original 1:1 Zoom calls that added ~$650K ARR per specialist per year) places users in a sandbox with pre-filled sample emails where they practice the interface risk-free. Tutorial text at the bottom of the screen guides actions. "Temporary labels" enlarge key UI elements with text labels for the first 7 days, then labels disappear to maintain minimalism. This drove a **17% increase in Week 1 activation** and **20% boost in keyboard shortcut usage**.

**The permission sequence must follow a value-first cadence.** Based on research across all apps studied, the optimal order is:

1. **Demo before any permissions**: Show a 15-second animation or interactive preview of AI drafting a reply to a sample email. Loom lets users record before signing up. ChatGPT provides instant value with zero permissions. Replicate this: let users see AI in action with sample data before asking for anything.
2. **Gmail OAuth (read-only scope first)**: Pre-permission screen: "To draft responses in your voice, [App] needs to understand your email patterns." Emphasize what you won't do: "We never delete emails, modify contacts, or access attachments unless you ask." Google's incremental authorization means you can start with `gmail.readonly` and upgrade to `gmail.send` later.
3. **Immediate value delivery (the wow moment)**: Within 2-5 minutes of Gmail connection, show 2-3 AI-generated draft summaries from real emails. The median SaaS time-to-value is **1 day, 12 hours** (Userpilot 2024 benchmark, 547 companies). Beating this dramatically — aiming for under 5 minutes — validates the permission grant and prevents regret-uninstall.
4. **Notification permission (after value demonstrated)**: Frame contextually: "Want to know when a draft is ready for review?" Headspace-style: ask after the user has reviewed their first AI draft, not during setup.
5. **CRM/Notion access (deferred)**: Only request when user attempts CRM features. Frame as: "Connect your workspace to automatically log contacts from your emails."
6. **Gmail send scope (progressive upgrade)**: Only after user has reviewed and approved several drafts. Frame as: "Ready to send approved drafts directly?"

**Grammarly's trust playbook applies directly to the "AI reads your email" problem.** Grammarly faces the worst-case permission scenario — iOS's "Full Access" toggle for keyboards that lumps keystroke capture with network access, accompanied by Apple's alarming warning about credit card numbers. Their strategy: specific carve-outs stating what they don't access ("blocked from sensitive fields"), explicit security language ("encrypted in transit and at rest"), and anti-surveillance positioning ("does not record every keystroke"). For the AI CRM app, adapt this: "We analyze your last 30 days of emails to identify contacts and draft responses. We never read attachments, never share email content with third parties, and you can exclude specific senders or folders anytime."

**The first draft review tutorial needs four screens.** Screen 1: animated processing state ("Analyzing your recent conversations... This usually takes about 2 minutes") with progress steps visible. Screen 2: original email thread collapsed above the AI draft in a visually distinct container, with three prominent actions — ✓ Approve, ✏️ Edit, ✗ Reject. Screen 3: if the user edits, celebrate the feedback ("Got it! I'll remember this preference for future drafts"). Screen 4: one additional capability reveal — not a feature dump.

**Empty states must educate, not just spin.** Before AI processing completes, show what the interface will look like with sample data. Include a progress bar with named steps (Reading emails → Identifying contacts → Learning your style → Drafting responses). Offer a brief "tell us about your workflow" prompt to gather preferences while the user waits. The Read.ai redesign (March 2026) established the trust-first pattern: the very first screen shows "You're in control. Set it your way" before any setup options appear.

---

## Conclusion: five principles that connect everything

The six research areas converge on a unified design philosophy for an AI-powered CRM email app. **First, speed requires trust** — users won't approve drafts quickly unless they trust the AI, and trust builds through transparency (qualitative confidence indicators, not percentages), progressive autonomy (the Autonomy Dial), and always-available undo. **Second, mobile gestures must be consistent across contexts** — the same swipe vocabulary should work for draft review, pipeline management, and notification actions, following Spark's principle of matching individual and batch action patterns.

**Third, the offline-first architecture should be invisible.** Users shouldn't think about connectivity. The TanStack Query + SQLite outbox pattern lets them approve drafts on an airplane, with server validation handling conflicts when connectivity returns. **Fourth, notifications are a trust contract** — 5-8 per day maximum, behaviorally-filtered like Spark's Smart Notifications, with iOS actionable buttons that let users approve drafts from the Lock Screen without opening the app.

**Fifth, and most fundamentally, the onboarding sequence is a trust ladder.** Show AI magic with sample data → earn Gmail access → deliver the wow moment within 5 minutes → earn notification permission → earn CRM access → eventually earn send permission. Each rung delivers value before requesting the next level of access. The apps that master this sequence — Superhuman with synthetic inboxes, ChatGPT with zero-permission instant value, Grammarly with explicit security carve-outs — achieve activation rates and retention that permission-first apps cannot match.