## ADDED Requirements

### Requirement: Email magic-link sign-in
The system SHALL allow users to sign in by receiving a single-use, time-limited link at their email address. No password storage is required for standard users.

#### Scenario: Request a magic link with a known email
- **WHEN** a visitor submits their email at `/sign-in`
- **THEN** the system sends a single-use sign-in link to that email, expires it after 15 minutes, and displays a confirmation screen without revealing whether the address is registered

#### Scenario: Click a valid magic link
- **WHEN** a user opens a magic link within its validity window
- **THEN** the system creates an authenticated session, invalidates the link so it cannot be reused, and redirects the user to the app home

#### Scenario: Click an expired or already-used link
- **WHEN** a user opens a magic link that has expired or been consumed
- **THEN** the system rejects the link, shows an error, and offers to send a new one

### Requirement: First-time user auto-provisioning
The system SHALL create a user record the first time a new email successfully completes the sign-in flow, with role `user`.

#### Scenario: Brand-new email completes sign-in
- **WHEN** a valid magic link belongs to an email not yet in the database
- **THEN** the system creates a new User record with role `user`, then signs that user in

### Requirement: Session lifecycle
The system SHALL maintain an authenticated session via a secure, HTTP-only cookie, and SHALL allow the user to sign out from any authenticated page.

#### Scenario: Explicit sign-out
- **WHEN** an authenticated user clicks "Sign out"
- **THEN** the session is invalidated server-side, the session cookie is cleared, and the user is returned to the public landing page

#### Scenario: Session expiry
- **WHEN** a session cookie exceeds its maximum age (30 days)
- **THEN** protected routes redirect the request to `/sign-in`

### Requirement: Role-based route protection
The system SHALL distinguish two roles — `user` and `admin` — and SHALL block non-admins from admin-only routes.

#### Scenario: Non-admin requests an admin route
- **WHEN** an authenticated user with role `user` requests any route under `/admin`
- **THEN** the system responds with 403 and renders a "not authorized" page

#### Scenario: Unauthenticated request to a protected route
- **WHEN** an unauthenticated visitor requests any route that requires sign-in
- **THEN** the system redirects to `/sign-in?callbackUrl=<requested-path>` and, after successful sign-in, returns the user to the originally requested path
