# Mario Party Online — Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Zero PII in Shared Collections**: `party_profiles`, `party_codes`, `party_names`, `party_friend_requests`, `party_friendships`, `party_invites`, `party_rooms`, and `party_rooms/{roomCode}/players` NEVER store emails, phone numbers, or addresses.
2. **Ownership & Identity Integrity**: Every write validates `request.auth != null && request.auth.token.email_verified == true` and binds the author/owner UID field (`uid`, `fromUid`, `hostUid`) strictly to `request.auth.uid`.
3. **Master Gate on Subcollections**: Writes to `party_rooms/{roomCode}/players/{uid}` strictly verify `exists(/databases/$(database)/documents/party_rooms/$(roomCode))` and `uid == request.auth.uid`.
4. **No Blanket List Scraping**: Every `allow list` rule evaluates `resource.data` against `request.auth.uid` (or `roomCode` for an active room subcollection). No `get()` or `exists()` calls inside `allow list`.
5. **Strict Action-Based Updates & Terminal State Locking**: Every `allow update` wraps the validation blueprint helper first, checks `affectedKeys().hasOnly(...)` per action, preserves immutable fields (`createdAt`, `uid`, `hostUid`, `roomCode`), and locks terminal statuses (`accepted`/`declined`/`expired`/`closed`).
6. **Temporal Integrity**: All `createdAt` and `updatedAt` timestamps must strictly equal `request.time`.

## 2. The "Dirty Dozen" Attack Payloads (All MUST Return PERMISSION_DENIED)
1. **Shadow Field Injection on Profile**: Creating `party_profiles/{uid}` with an extra ghost key `isAdmin: true`.
2. **Identity Spoofing on Profile**: Creating `party_profiles/otherUid` while authenticated as `attackerUid`.
3. **ID Poisoning**: Creating a `party_rooms` document with a 200-char junk ID containing spaces or `$`.
4. **Self-Friend Request**: Creating `party_friend_requests` where `fromUid == toUid`.
5. **Orphan Friend Request**: Creating `party_friend_requests` targeting a non-existent `toUid` not in `party_profiles`.
6. **Unauthorized Request Acceptance**: Sender (`fromUid`) trying to update `status` to `'accepted'` instead of recipient (`toUid`).
7. **Terminal State Mutation**: Attempting to modify a `party_invites` doc after `status` is `'accepted'` or `'declined'`.
8. **Host Hijacking**: Non-host player trying to change `hostUid` or `currentGameId` on `party_rooms/{roomCode}`.
9. **Closed Room Resurrection**: Host trying to update a `party_rooms/{roomCode}` document whose `status` is already `'closed'`.
10. **Unbounded Array Poisoning**: Setting `cupQueue` to 50 items (exceeding max 10) or non-string entries.
11. **Value Poisoning on Score**: Updating `party_rooms/{roomCode}/players/{uid}` with `roundScore: "999999"` (wrong type) or `stars: 9999` (exceeding bounded delta).
12. **Client Timestamp Forgery**: Creating a `party_invites` document with a forged past `createdAt` instead of `request.time`.
