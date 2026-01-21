# Kodeme Backend

This is the backend API for Kodeme, running as a separate app on port 4000.

## Getting Started

1. Install dependencies:
   ```sh
   npm install
   ```
2. Run in development mode:
   ```sh
   npm run dev
   ```
3. Build for production:
   ```sh
   npm run build
   ```
4. Start production server:
   ```sh
   npm start
   ```

## API Structure
- All API routes should be placed in `src/routes/`
- Controllers go in `src/controllers/`
- Middleware in `src/middleware/`

## Configuration
- The backend runs on port 4000 by default.
- Update `src/index.ts` to change the port if needed.
