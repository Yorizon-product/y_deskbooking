## ADDED Requirements

### Requirement: Manage floors
Admins SHALL be able to create, rename, reorder, and soft-delete floors. Floors group desks in the UI.

#### Scenario: Create a floor
- **WHEN** an admin submits the "New floor" form with a non-empty name
- **THEN** a Floor record is created with the given name and added to the end of the display order

#### Scenario: Rename a floor
- **WHEN** an admin updates a floor's name
- **THEN** the new name is saved and reflected in all views that list floors

#### Scenario: Reorder floors
- **WHEN** an admin changes a floor's position in the list
- **THEN** the floor's `displayOrder` is updated and all floor lists render in the new order

#### Scenario: Soft-delete a floor with no desks
- **WHEN** an admin deletes a floor that has no desks
- **THEN** the floor is marked inactive and hidden from all views

#### Scenario: Attempt to delete a floor that still has desks
- **WHEN** an admin deletes a floor that still has active desks
- **THEN** the operation is rejected with a message explaining that desks must be moved or deactivated first

### Requirement: Manage desks
Admins SHALL be able to create, edit, deactivate, and reactivate desks on any floor. Each desk has a unique label within its floor and optional attributes (monitor, standing, accessible).

#### Scenario: Create a desk
- **WHEN** an admin creates a desk on a given floor with a label not already in use on that floor
- **THEN** a Desk record is created and immediately visible to users as bookable

#### Scenario: Label collision on the same floor
- **WHEN** an admin creates a desk with a label already taken on that floor
- **THEN** the operation is rejected with a validation message

#### Scenario: Edit desk attributes
- **WHEN** an admin changes a desk's attributes (e.g. toggles "has monitor")
- **THEN** the updated attributes are saved and reflected in booking-availability views

#### Scenario: Deactivate a desk
- **WHEN** an admin deactivates a desk
- **THEN** the desk disappears from booking-availability views but is preserved for historical bookings

#### Scenario: Reactivate a desk
- **WHEN** an admin reactivates a previously-deactivated desk that has no future bookings
- **THEN** the desk reappears in booking-availability views starting from today

### Requirement: Public (read-only) inventory access
Any authenticated user SHALL be able to list floors and the desks on each floor, including attributes, for the purpose of choosing where to book.

#### Scenario: Authenticated user lists floors
- **WHEN** an authenticated user requests the inventory list
- **THEN** the system returns all active floors (in display order) and, for each, its active desks with their attributes
