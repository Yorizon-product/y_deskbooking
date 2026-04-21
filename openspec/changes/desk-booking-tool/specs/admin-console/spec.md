## ADDED Requirements

### Requirement: Admin-only access
The system SHALL scope all admin-console routes under `/admin/**` and SHALL restrict them to authenticated users with role `admin`.

#### Scenario: Admin visits the console
- **WHEN** an authenticated admin opens `/admin`
- **THEN** the admin dashboard renders with navigation to "Floors & Desks", "Bookings", and "Users"

#### Scenario: Non-admin visits the console
- **WHEN** an authenticated non-admin opens `/admin`
- **THEN** the request is rejected per the `user-auth` role-based route protection requirement

### Requirement: Floors & Desks management surface
The admin-console SHALL provide a UI that exercises the entire `desk-inventory` capability: listing floors and desks, creating/editing/reordering floors, creating/editing/activating/deactivating desks.

#### Scenario: Admin creates a floor and adds desks
- **WHEN** an admin creates a floor named "Floor 3" and adds two desks labelled "3-A" and "3-B"
- **THEN** both desks appear under "Floor 3" in the admin list AND become visible to users as bookable on the public booking page

#### Scenario: Admin deactivates a desk
- **WHEN** an admin toggles "Active" off on a desk
- **THEN** the desk is visually marked inactive in the admin view and is hidden from the public booking page

### Requirement: Booking oversight
The admin-console SHALL allow an admin to view all bookings across all users, filter by date range and/or user, and cancel any booking with an audit note.

#### Scenario: List all bookings for a date range
- **WHEN** an admin sets a date range in the bookings view
- **THEN** the system returns every booking (any status) whose `startAt` falls within the range, showing desk, user, slot, and status

#### Scenario: Admin cancels another user's booking
- **WHEN** an admin cancels a user's upcoming booking and enters a reason
- **THEN** the Booking's status is set to `cancelled`, `cancelledAt` is recorded, the reason is stored, and the affected user's desk/slot becomes available

### Requirement: Utilization snapshot
The admin-console SHALL display a simple utilization snapshot: total desks, desks booked today, bookings per floor for the last 30 days.

#### Scenario: Open the dashboard
- **WHEN** an admin opens `/admin`
- **THEN** the dashboard shows the total number of active desks, the count of desks with a confirmed booking for today, and a 30-day bookings-per-floor summary

### Requirement: User list and role toggle
The admin-console SHALL list all users and SHALL allow an admin to promote a `user` to `admin` or demote an `admin` to `user`.

#### Scenario: Promote a user to admin
- **WHEN** an admin changes another user's role from `user` to `admin`
- **THEN** the User record's role is updated, and the target user's next request sees the elevated role

#### Scenario: Admin cannot demote themselves below the last admin
- **WHEN** the only remaining admin attempts to demote their own role
- **THEN** the operation is rejected with a message explaining that at least one admin must exist
