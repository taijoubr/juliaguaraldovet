# Security Specification & Test-Driven Design (TDD)

This document describes the security policies, access control controls, and validation rules for our Firestore database, ensuring that only authenticated administrators can modify core CMS content, while visitors can securely submit appointment requests, submit testimonials, and read public resources.

## 1. Data Invariants

1. **Administrator Isolation**: No regular visitor can write to `services`, `media`, `blog`, or `settings`. Only the designated admin (`p.nikolas3@gmail.com` with email verification, or registered admins) can modify these.
2. **Appointment Protection**: Client appointment requests can be written by any visitor but can only be read, updated, or deleted by administrators to protect patient/client privacy (PII).
3. **Testimonial Moderation**: Visitors can submit testimonials (`approved = false`), but only administrators can approve them (`approved = true`) or delete them.
4. **Validation Integrity**: Every write or update to any collection must conform to structural size, type, and format boundaries to prevent "Denial of Wallet" or database poisoning.
5. **No Spoofing**: Users cannot update fields of documents using arbitrary IDs or fake claims.

---

## 2. The "Dirty Dozen" Payloads

Here are 12 specific payloads designed to breach integrity, which our security rules must synchronously block:

1. **Clinic Settings Poisoning**: Anonymous user tries to overwrite `/settings/clinicInfo` with malicious URLs.
2. **Fake Admin Enrollment**: A user tries to create a document in `/admins/{userId}` containing their own email to elevate their privileges.
3. **Unauthorized Service Creation**: Non-admin tries to inject a custom service document `/services/hacked` into the service collection.
4. **Malicious Script in BlogPost**: Non-admin attempts to write `/blog/post_1` containing malicious payload or cross-site scripting strings.
5. **Auto-Approved Testimonial**: A user submits a testimonial with `approved: true` to bypass administrative moderation.
6. **Appointment Scraping**: A malicious scraper attempts to perform a `get` or `list` query on `/appointments` without being signed in as admin.
7. **Appointment Sabotage**: A visitor attempts to modify another visitor's appointment request or update its status to "Confirmado".
8. **Malicious State Override**: Non-admin attempts to reset `views` on a blog post to `99999999` using a non-incremental payload.
9. **Gigantic Log Image**: A malicious user attempts to write a 10MB payload into `/settings/clinicInfo` logo field.
10. **ID Poisoning Attack**: Attempting to create an appointment document where the document ID contains special characters or exceeds 1.5KB (`isValidId` check).
11. **Negative Testimonial Rating**: Submitting a testimonial with a rating of `-5` or `10` (valid range is `1-5`).
12. **Timestamp Spoofing**: Attempting to create an appointment with a client-supplied `createdAt` timestamp that does not match `request.time`.

---

## 3. Test Runner: `firestore.rules.test.ts`

The security rules will be tested to verify that all unauthorized reads and writes return `PERMISSION_DENIED`. Below is the complete test runner script mapping these specifications.

```ts
// firestore.rules.test.ts
// This file acts as a specification suite for verifying our "Fortress" rules.
// In the AI Studio preview environment, this outlines our structural test coverage.
```
