# Kodeme Backend: Copilot AI Agent Instructions

## Project Architecture
- **API routes**: All API endpoints are defined in `src/routes/`. Each route file corresponds to a logical API area (e.g., `calendar.ts`, `auth/google.ts`).
- **Controllers**: Business logic for each route is implemented in `src/controllers/`. Controllers are named to match their route (e.g., `calendarController.ts`).
- **Middleware**: Shared request/response logic (e.g., CORS) is in `src/middleware/`.
- **Services**: Reusable logic and integrations (e.g., Firebase, token management) are in `src/services/`.
- **Types**: Shared TypeScript types are in `src/types/`.
- **Entry point**: The app starts from `src/index.ts`.

## Developer Workflows
- **Install dependencies**: `npm install`
- **Development mode**: `npm run dev` (uses nodemon or similar for hot reload)
- **Production build**: `npm run build`
- **Start production server**: `npm start`
- **Default port**: 4000 (change in `src/index.ts` if needed)

## Project Conventions
- Route, controller, and service files are named for their domain (e.g., `calendar`, `bookingConfirmation`).
- Each route imports its controller; controllers may use services for business logic.
- Middleware is applied globally or per-route as needed.
- Keep API logic out of route files—delegate to controllers/services.
- Use TypeScript throughout; types are defined in `src/types/`.

## Integration & Patterns
- **External integrations**: See `src/services/` for Firebase and calendar provider logic.
- **Cross-component communication**: Controllers call services; services may interact with external APIs.
- **Adding new endpoints**: Create a new route in `src/routes/`, a matching controller in `src/controllers/`, and update services/types as needed.

## Examples
- To add a new API for invitations:
  1. Add `src/routes/invitations.ts`
  2. Add `src/controllers/invitationsController.ts`
  3. Add logic to `src/services/invitationsService.ts` if needed
  4. Register the route in `src/routes/index.ts`

## References
- See [README.md](../../README.md) for setup and configuration details.
- Key directories: `src/routes/`, `src/controllers/`, `src/services/`, `src/middleware/`, `src/types/`

---
For further conventions or questions, review the code in the above directories or ask a maintainer.
