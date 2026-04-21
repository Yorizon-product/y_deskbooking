## ADDED Requirements

### Requirement: View desk availability for a date
Any authenticated user SHALL be able to pick a date (default: today) and see every active desk annotated with its availability for that date's three time slots: `morning`, `afternoon`, `all-day`.

#### Scenario: Open the booking page with the default date
- **WHEN** an authenticated user opens `/book`
- **THEN** the system renders each active desk grouped by floor, with a status per slot indicating whether the slot is free, booked by the current user, or booked by someone else

#### Scenario: Change the date
- **WHEN** the user changes the date picker to another date within the allowed booking window
- **THEN** the desk availability refreshes to reflect that date

#### Scenario: Date outside the booking window
- **WHEN** the user selects a date more than 60 days in the future or any date in the past
- **THEN** the system prevents the selection (UI) and rejects the request (API)

### Requirement: Create a booking
An authenticated user SHALL be able to book a free desk for a chosen date and slot. The slot determines the stored `startAt`/`endAt` range in the office timezone:
- `morning` → 08:00–12:00
- `afternoon` → 12:00–18:00
- `all-day` → 08:00–18:00

#### Scenario: Successful booking
- **WHEN** a user submits a booking for a desk + date + slot that is currently free
- **THEN** a Booking record is created with `status = confirmed` and the user is shown a confirmation with a link to "My bookings"

#### Scenario: Conflict with an existing booking
- **WHEN** two users submit overlapping bookings for the same desk within the same request window
- **THEN** at most one booking succeeds; the other is rejected with a message that the desk was just taken. The database SHALL reject the conflicting row via a range-exclusion constraint — application code alone is not sufficient

#### Scenario: All-day booking over a half-day booking
- **WHEN** a user attempts to book `all-day` on a desk that already has a confirmed `morning` OR `afternoon` booking that day
- **THEN** the request is rejected with a conflict message

#### Scenario: Booking on an inactive desk
- **WHEN** a user submits a booking for a desk that has been deactivated
- **THEN** the request is rejected with a validation message

### Requirement: View and cancel own bookings
An authenticated user SHALL be able to list their upcoming and past bookings, and cancel any of their upcoming bookings.

#### Scenario: List own bookings
- **WHEN** a user opens `/my-bookings`
- **THEN** the system returns their bookings grouped into "upcoming" (startAt ≥ today) and "past", sorted chronologically

#### Scenario: Cancel a future booking
- **WHEN** a user cancels one of their upcoming bookings
- **THEN** the Booking's status becomes `cancelled`, `cancelledAt` is set, the desk/slot becomes available again to other users, and the user sees a confirmation

#### Scenario: Cancel a booking that has already started
- **WHEN** a user cancels a booking whose `startAt` is in the past
- **THEN** the operation is rejected with a message ("past bookings cannot be cancelled")

#### Scenario: Cancel someone else's booking
- **WHEN** a non-admin user attempts to cancel a booking they do not own
- **THEN** the request is rejected with 403

### Requirement: One booking per user per date
The system SHALL prevent a single user from holding more than one confirmed booking for the same date (across all desks and slots).

#### Scenario: Second booking on the same date
- **WHEN** a user who already has a confirmed booking for date `D` attempts to create another booking for date `D`
- **THEN** the request is rejected with a message explaining the per-day limit, unless the user first cancels the existing booking
