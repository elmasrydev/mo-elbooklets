# WhatsApp OTP — Complete Mobile Integration Guide

Every OTP in this app is a 6-digit code delivered over WhatsApp. There are
**four** flows, and they are deliberately not interchangeable:

| # | Flow | Audience | Send | Consume |
|---|---|---|---|---|
| 1 | Verify number at signup | Student | `sendMobileOtp` | `verifyMobileOtp` |
| 2 | Verify number at signup | Parent | `sendParentMobileOtp` | `verifyParentMobileOtp` |
| 3 | Forgot password | Student | `sendPasswordResetOtp` | `resetPasswordWithOtp` |
| 4 | Forgot password | Parent | `sendParentPasswordResetOtp` | `resetParentPasswordWithOtp` |

Read [§2 Codes are scoped](#2-codes-are-scoped) before you build anything — it is
the single most common source of "the code doesn't work" bugs.

---

## 1. Ground rules that apply to all four flows

**The number format.** Send the national number **with its leading zero**
(`01039890331`) and `country_code` as `+2`. `+20` and a number without the
leading zero are both accepted and normalised server-side, so you cannot break it
by sending a reasonable variant — but be consistent, because what you send at
*send* time and *consume* time must refer to the same phone.

**Arabic-Indic numerals.** `٠١٢٣٤٥٦٧٨٩` are accepted everywhere a number or a
code is expected — the server converts them. Do **not** strip non-ASCII digits
client-side with a `\d` regex: JavaScript's `\d` is ASCII-only and will silently
delete an Arabic code, leaving the user staring at an empty field with no error.

**Code lifetime.** 10 minutes. Drive your countdown from the `expires_in` field
(seconds) rather than hardcoding it.

**Attempts.** 5 wrong guesses burns the code. The user must request a new one.

**Non-production.** On any non-production environment the code is always
`123456`. Do not build a QA flow that scrapes it from anywhere else.

**Localisation.** Send the `lang` header (`ar` or `en`; defaults to `ar`). Every
`message` in every response below is returned pre-translated and is safe to
display as-is. Do not write your own copy for these.

---

## 2. Codes are scoped

Each code is stamped with the purpose it was issued for and the audience it
belongs to. A code only works with its matching consume mutation:

```
sendMobileOtp              → verifyMobileOtp              (student, verification)
sendParentMobileOtp        → verifyParentMobileOtp        (parent,  verification)
sendPasswordResetOtp       → resetPasswordWithOtp         (student, reset)
sendParentPasswordResetOtp → resetParentPasswordWithOtp   (parent,  reset)
```

Cross-feeding any other pair returns `success: false` with an invalid-code
message. Two consequences for the client:

- **Always start a flow with a fresh send call.** Never reuse a code the app
  happens to still have in memory from a different screen.
- **A parent and their child often share one handset and one number.** Verifying
  the child does not verify the parent, and a reset code for one account cannot
  touch the other. This is intentional — it is what stops one family member's
  routine verification message from becoming a takeover token for the other's
  account.

---

## 3. Flow 1 & 2 — verifying the number at signup

### The happy path

`register` (student) and `parentRegister` (parent) **both send the code
automatically**. So do `login` and `parentLogin` when the account is not yet
verified. In the normal case you do not call a send mutation at all — you land on
the code screen and the message is already on its way.

```
register / parentRegister  ─┐
                            ├─→ code screen ──→ verify*MobileOtp ──→ app
login / parentLogin ────────┘   (resend available after 60s)
```

### How to know whether verification is needed

Read `mobile_verified_at` off the account in the auth payload. It is `null` until
the number is confirmed.

```graphql
mutation ParentLogin($input: ParentLoginInput!) {
    parentLogin(input: $input) {
        access_token
        token_type
        parent { id name mobile mobile_verified_at }
    }
}
```

`user { … mobile_verified_at }` is the equivalent on the student `login` /
`register` payloads. **Branch on this field, not on a guess.**

> You still receive a valid `access_token` when the number is unverified. Store
> it — you need it to call `verifyMobileOtp` / `verifyParentMobileOtp`, which are
> both authenticated. Just don't let the user past the code screen.

### Consuming the code

```graphql
mutation VerifyParentMobileOtp($otp: String!) {
    verifyParentMobileOtp(otp: $otp) {
        success
        message
        parent { id mobile_verified_at }
    }
}
```

The student equivalent is `verifyMobileOtp(otp:)` returning `user { … }`.

**The number is taken from the authenticated account, never from your request** —
you only send the code. There is no way to verify a number you are not signed in
as, which is why these two mutations are guarded and the send mutations are not.

On `success: true`, re-read `mobile_verified_at` from the response and proceed.
On `success: false`, show `message` and let them retry or resend.

### Resending

```graphql
mutation SendParentMobileOtp($mobile: String!, $countryCode: String) {
    sendParentMobileOtp(mobile: $mobile, country_code: $countryCode) {
        success
        message
        expires_in
    }
}
```

Student equivalent: `sendMobileOtp(mobile:, country_code:)`.

Keep the resend button disabled for **60 seconds** after every send, including
the automatic one at register/login. The first limit a user meets should be your
own countdown, not a server rejection — see [§5](#5-rate-limits).

---

## 4. Flow 3 & 4 — forgot password

This is the **primary** recovery path for both audiences. Both students and
parents sign in by mobile number, and `email` is nullable on student accounts, so
the email-link mutations (`forgotPassword`, `parentForgotPassword`) reach only the
minority who have an address on file. Offer the email link as a secondary option
for someone who no longer holds the number; lead with the code.

### Step 1 — request the code

```graphql
mutation SendPasswordResetOtp($mobile: String!, $countryCode: String) {
    sendPasswordResetOtp(mobile: $mobile, country_code: $countryCode) {
        success
        message
        expires_in
    }
}
```

Parent equivalent: `sendParentPasswordResetOtp(mobile:, country_code:)` — same
arguments, same response shape.

| Field | Meaning |
|---|---|
| `success` | `true` — request accepted. `false` — **rate limited only**. |
| `message` | Localised, ready to display. |
| `expires_in` | Seconds until the code dies (600). Drive the countdown from this. |

> ### `success: true` does not mean the number is registered
>
> The identical payload comes back whether or not an account exists. This is
> deliberate: otherwise the endpoint would be a free directory of who uses the
> app. **Never render it as "we found your account", and always advance to the
> code screen** — stopping early for unknown numbers would leak exactly what the
> shared response exists to hide.

### Step 2 — set the new password

```graphql
mutation ResetPasswordWithOtp(
    $mobile: String!
    $countryCode: String
    $otp: String!
    $password: String!
    $passwordConfirmation: String!
) {
    resetPasswordWithOtp(
        mobile: $mobile
        country_code: $countryCode
        otp: $otp
        password: $password
        password_confirmation: $passwordConfirmation
    ) {
        success
        message
    }
}
```

Parent equivalent: `resetParentPasswordWithOtp` with the same arguments.

`password` must be at least 8 characters and match `password_confirmation`. A
violation of those rules arrives in the **top-level `errors` array**, not as
`success: false` — handle both shapes.

### After a successful reset — read this

**Every existing access token for that account is revoked**, including the one
your app is holding. You must:

1. Clear the stored token.
2. Route to the login screen.
3. Have the user sign in with the new password.

Do **not** try to reuse the stored token, and do **not** auto-login. Other
devices signed into that account are logged out too. That is intended — the reset
may have been prompted by someone holding a stolen token.

---

## 5. Rate limits

Every WhatsApp message costs real money, and the send mutations are
unauthenticated and take an arbitrary number, so the limits are layered. **All
four flows share one budget per number** — the cost is per message sent, not per
reason for sending it.

| Scope | Limit |
|---|---|
| Same number | 1 per 60 seconds |
| Same number | 3 per hour |
| Same number | 10 per day |
| Same IP | 5 per hour, 20 per day |
| Everyone combined | a global hourly ceiling |

All of them surface identically: `success: false` plus a localised `message`
(`auth.please_wait_before_requesting_another_otp`,
`auth.otp_hourly_limit_reached`, `auth.otp_daily_limit_reached`, or
`auth.otp_temporarily_unavailable` when the global ceiling trips).

### What the client must do

- **Disable resend for 60 seconds after every send.** This is the single most
  important thing on this page — without it, an impatient user burns their hourly
  quota in under a minute and is locked out of their own recovery.
- **On `success: false`, show `message` and stop.** Never auto-retry: retries
  consume the hourly and daily budget and make the lockout longer.
- **Expect per-IP trips on shared networks.** A whole school behind one NAT can
  hit the IP limit. If several users at one location report being blocked, that
  is the cause — the limit is tunable server-side via `OTP_MAX_PER_IP_HOUR`.

Rate limits are reported the same way for registered and unregistered numbers, so
a limit message never tells you whether an account exists either.

---

## 6. Screen flows, end to end

### Signup (either audience)

1. User completes registration → `register` / `parentRegister`.
2. Store `access_token`. Read `mobile_verified_at` — it will be `null`.
3. Go to the code screen. **A code has already been sent.** Start a 60s resend
   countdown and a 10-minute expiry countdown.
4. User enters 6 digits → `verifyMobileOtp` / `verifyParentMobileOtp`.
5. `success: true` → into the app. `success: false` → show `message`, stay put.
6. Resend (after 60s) → `sendMobileOtp` / `sendParentMobileOtp`, restart the
   countdown.

### Login when the number was never verified

Same as steps 2–6 above. `login` / `parentLogin` return a token *and* auto-send a
fresh code when `mobile_verified_at` is `null`.

### Forgot password (either audience)

1. User taps *Forgot password* → enters their mobile number.
2. `sendPasswordResetOtp` / `sendParentPasswordResetOtp`.
   On `success: false`, show `message` and stay put.
3. **Advance to the code screen regardless** — the API deliberately will not tell
   you whether the number is registered.
4. Countdown from `expires_in`; resend disabled for 60s.
5. User enters the code and a new password → `resetPasswordWithOtp` /
   `resetParentPasswordWithOtp`.
6. On `success: true`, **clear the stored token** and route to login.
7. Offer "reset by email instead" as a secondary link throughout, pointing at
   `forgotPassword` / `parentForgotPassword`.

---

## 7. Error handling cheat sheet

| What you see | What it means | What to do |
|---|---|---|
| `success: true` on a send | Request accepted. Says nothing about the account existing. | Advance to the code screen. |
| `success: false` on a send | Rate limited — the only reason. | Show `message`. Do not retry. |
| `success: false` on a verify/reset | Wrong, expired, exhausted, or wrong-purpose code. | Show `message`. Offer resend. |
| Top-level `errors` array | Validation (password too short/mismatched) or an unauthenticated call to a guarded mutation. | Fix the input or the token. |
| Code "never arrives" | Usually a rate limit already tripped, or the number has no WhatsApp. | Surface `message`; offer the email fallback. |
| Code rejected right after a different flow | You reused a code across purposes. | Start the flow with a fresh send call. |

---

## 8. Quick reference

```graphql
# Verification — student
sendMobileOtp(mobile: String!, country_code: String): OtpResponse!
verifyMobileOtp(otp: String!): OtpVerifyResponse!          # authenticated

# Verification — parent
sendParentMobileOtp(mobile: String!, country_code: String): OtpResponse!
verifyParentMobileOtp(otp: String!): ParentOtpVerifyResponse!   # authenticated

# Reset — student
sendPasswordResetOtp(mobile: String!, country_code: String): OtpResponse!
resetPasswordWithOtp(
    mobile: String!, country_code: String, otp: String!,
    password: String!, password_confirmation: String!
): SocialActionResponse!

# Reset — parent
sendParentPasswordResetOtp(mobile: String!, country_code: String): OtpResponse!
resetParentPasswordWithOtp(
    mobile: String!, country_code: String, otp: String!,
    password: String!, password_confirmation: String!
): SocialActionResponse!

# Email fallback (secondary)
forgotPassword(email: String!): SocialActionResponse!
parentForgotPassword(email: String!): SocialActionResponse!
```

`OtpResponse { success, message, expires_in }`
`OtpVerifyResponse { success, message, user }`
`ParentOtpVerifyResponse { success, message, parent }`
`SocialActionResponse { success, message }`
