# easyAppointments

![E2E Tests](https://github.com/LogneBudo/kodeme/actions/workflows/e2e-tests.yml/badge.svg)

![Tests](https://github.com/LogneBudo/kodeme/actions/workflows/e2e-tests.yml/badge.svg?label=tests)

A lightweight appointment scheduling platform that simplifies booking and admin management of time slots.

## What is easyAppointments?

easyAppointments is a self-hosted scheduling solution designed for small businesses and freelancers. It allows:

- **Customers** to book appointments from an intuitive calendar interface
- **Admins** to manage availability by setting working hours, defining blocked times (e.g., lunch breaks), and toggling one-off unavailable slots
- **Flexible scheduling** with recurring blocked slots and per-date/time admin control
- **Appointment tracking** with customer email confirmations and calendar export

The app separates concerns cleanly: blocked times (from settings) are immutable in the UI, while unavailable slots (admin-toggled) can be managed on-the-fly. Appointments overlay on top of this to show real-time bookings.

## Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Git](https://git-scm.com/)
- A Firebase project ([create one free here](https://firebase.google.com/))

### Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/lognebudo/kodeme.git
   cd kodeme
   ```

2. **Install dependencies:**
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

3. **Configure Firebase:**
   - Create a `.env` file in the root and add your Firebase config:
     ```
     VITE_FIREBASE_API_KEY=your_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

5. **Admin setup:**
   - Register a new user in the app
   - Manually promote that user to admin role in Firestore (set `role: "admin"` in the users collection)
   - Navigate to the Admin panel to configure working hours, days, and blocked slots

## Hosting

### Deploy to Firebase Hosting

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

3. **Initialize and deploy:**
   ```bash
   firebase init hosting
   # Choose your Firebase project
   # Set public directory to `dist`
   firebase deploy
   ```

### Deploy Backend (Cloud Functions)

The `backend/server.js` can be deployed as a Cloud Function or to a standalone Node server:

**Cloud Functions:**
```bash
firebase functions:deploy
```

**Standalone Node:**
```bash
node backend/server.js
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed hosting instructions.

## Tech Stack

- **Frontend:** React 18 + TypeScript, Vite (build tool)
- **UI:** TailwindCSS (styling), Lucide React (icons), Sonner (toast notifications)
- **Date & Time:** date-fns
- **Backend:** Firebase (Authentication, Firestore)
- **Deployment:** Firebase Hosting, Cloud Functions (optional)

## Features

- ✅ Settings-driven availability (working hours, working days, blocked slots)
- ✅ One-off unavailable slot management
- ✅ Appointment booking with email confirmation
- ✅ Calendar export for confirmed appointments
- ✅ Admin role-based access control
- ✅ Responsive design for mobile and desktop

## License

See [LICENSE](LICENSE) for details.

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
