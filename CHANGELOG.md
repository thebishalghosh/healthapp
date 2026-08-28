# Frontend Changelog

## [Unreleased]

### Added

* Added authenticated profile loading and update flows through the shared `AuthContext`.
* Added profile completion tracking for date of birth, gender, height, weight, activity level, and fitness goal.
* Added deterministic date helpers for displaying backend `YYYY-MM-DD` dates as `DD/MM/YYYY` and converting them back before updates.
* Added shared nutrition normalization and daily health summary normalization.
* Added authenticated API methods for nutrition, daily health, water, food, workout, and sleep endpoints.
* Added the authenticated Edit Profile screen and Profile tab entry point.

### Changed

* Dashboard profile information now comes from the authenticated user and health profile.
* Dashboard nutrition and health-tracking summaries now use backend-driven state.
* Nutrition screen now presents personalized calorie, macro, fiber, and water target information with consumption data where available.
* Profile updates can mark existing nutrition results stale; the frontend provides the Calculate/Recalculate flow when nutrition needs to be refreshed.
* Nutrition screen supports pull-to-refresh and backend calculation/recalculation actions.
* Dashboard refreshes daily health data when the screen receives focus and supports pull-to-refresh.

### Fixed

* Fixed frontend date formatting so users enter `DD/MM/YYYY` while the backend receives `YYYY-MM-DD`.
* Fixed the profile service named exports for `formatDateForDisplay` and `formatDateForApi`.
* Removed connected Dashboard mock calorie and water target values.
* Added explicit handling for missing, stale, invalid, and unavailable nutrition data.
* Added frontend handling for `404`, `409 NUTRITION_STALE`, `422 VALIDATION_ERROR`, and `401` authentication states.
* Added Dashboard water logging controls using the existing authenticated API flow.

### Backend Integration

The frontend currently integrates with the following backend APIs:

#### Authentication

* `GET /api/v1/auth/me`
* `POST /api/v1/auth/register`
* `POST /api/v1/auth/login`
* `POST /api/v1/auth/logout`

#### Health Profile

* `GET /api/v1/health/profile`
* `PUT /api/v1/health/profile`

Supported profile fields include:

* `first_name`
* `last_name`
* `date_of_birth`
* `gender`
* `height_cm`
* `weight_kg`
* `activity_level`
* `fitness_goal`

#### Nutrition

* `GET /api/v1/health/nutrition`
* `POST /api/v1/health/nutrition/calculate`

Nutrition targets remain completely backend-driven.

The frontend does **not** calculate:

* BMR
* TDEE
* Calories
* Protein
* Carbohydrates
* Fat
* Fiber
* Water targets

The frontend consumes the backend `calories_target`, `protein_g`, `carbohydrates_g`, `fat_g`, `fiber_g`, and `water_ml` values.

#### Daily Health Summary

* `GET /api/v1/health/today`

Used by the Dashboard for:

* Nutrition target
* Calories consumed
* Water target
* Water consumed
* Water percentage
* Workout duration
* Workout calories
* Sleep duration

#### Tracking APIs

Frontend API methods are available for:

* `/api/v1/health/water`
* `/api/v1/health/food`
* `/api/v1/health/workouts`
* `/api/v1/health/sleep`

Water logging is currently connected to Dashboard controls.

Food, workout, and sleep API methods exist, but dedicated logging screens are not yet implemented.

### Nutrition State Handling

The frontend supports the backend nutrition states:

* `200` — nutrition data available.
* `404` — nutrition has not been calculated yet.
* `409 / NUTRITION_STALE` — profile changed after the last nutrition calculation.
* `422 / VALIDATION_ERROR` — profile is incomplete or invalid for calculation.
* `401` — authentication/session failure.

The existing authentication flow handles session clearing for unauthorized requests.

### UI / UX

#### Nutrition Screen

Current Nutrition screen includes:

* `Today's Nutrition` header.
* Personalized nutrition subtitle.
* Calorie consumed/target presentation.
* Calorie percentage.
* Calorie progress visualization.
* Protein target card.
* Carbohydrate target card.
* Fat target card.
* Fiber target card.
* Water target/progress card.
* Loading states.
* Empty states.
* Error states.
* Stale nutrition state.
* Profile validation state.
* Retry actions.
* Calculate/Recalculate flow.
* Pull-to-refresh.

#### Dashboard

Current Dashboard includes backend-driven:

* User profile information.
* Age.
* Gender.
* Height.
* Weight.
* Fitness goal.
* Activity level.
* Profile completion.
* Nutrition calorie target.
* Calories consumed.
* Water target.
* Water consumed.
* Water percentage.
* Workout duration.
* Workout calories.
* Sleep duration.

Dashboard water controls currently expose:

* `+250 ml`
* `+500 ml`
* `+750 ml`

These controls use the authenticated water API and refresh the daily health summary after logging.

### State / Architecture

* Expo Router remains the application navigation architecture.
* `AuthContext` remains the shared authenticated application state owner.
* Existing API service architecture is preserved.
* `health.js` provides the health-tracking API methods.
* Nutrition state remains shared through the existing context/API architecture.
* Dashboard uses `/health/today` as its authoritative source for daily nutrition and tracking summaries.
* No additional global context or duplicate API client was introduced.
* No frontend nutrition calculation engine was introduced.

### Mock / Placeholder Status

The following areas remain incomplete or placeholder-based:

* Health score.
* AI insight.
* Movement content.
* Daily plan.
* Food/meal entry UI.
* Workout logging UI.
* Sleep logging UI.

Legacy `mockData.js` may still contain values for future or unsupported features, but connected nutrition and daily health values are sourced from the backend.

### Validation

The following checks have been completed:

* `npx expo export --platform android` — passed.
* Editor diagnostics on modified frontend files — passed with no errors.
* `git diff --check` — passed.
* Runtime profile-service export check — passed.
* Date helper verification confirmed:

  * `1999-05-24` → `24/05/1999`
  * `24/05/1999` → `1999-05-24`
* Expo Doctor — `17/18` checks passed.
* Existing Expo/Expo Constants patch-version mismatch warnings remain.

### Runtime Verification Status

Code-level integration and Android export validation have passed.

The following still require verification in Expo Go or on a physical Android device:

* Calculate Targets button visibility and interaction.
* Recalculate Targets flow after changing the health profile.
* Dashboard `+250 ml`, `+500 ml`, and `+750 ml` water controls.
* Confirmation that water totals update visually after logging.
* Authenticated API behavior using a real user session.
* Pull-to-refresh behavior on the Dashboard and Nutrition screen.

### Known Limitations / Next Steps

* Complete and verify the Nutrition Calculate/Recalculate user experience.
* Complete and verify Dashboard water logging on a real device.
* Build food/meal logging UI.
* Build workout logging UI.
* Build sleep logging UI.
* Implement health score calculation.
* Implement AI health insights.
* Implement AI chatbot for premium users.
* Implement AI food scanner.
* Implement smart reminders.
* Implement streaks, goals, and achievements.
* Implement weekly health reports.
* Implement Spotify/workout music integration.
* Implement subscription functionality.
* Implement advertisement/revenue functionality.
* Replace remaining unsupported Dashboard placeholders with backend-driven features as their APIs become available.
