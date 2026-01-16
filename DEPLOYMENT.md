# Appointment Booking System - Production Deployment Guide

## Project Structure
```
kodeme/
├── src/                    # React frontend
│   ├── api/               # API functions
│   ├── components/        # React components
│   ├── pages/             # Page components
│   ├── config/            # Configuration
│   └── ...
├── backend/               # Node.js/Express backend
│   ├── server.js          # Main server file
│   ├── .env.production    # Production env vars
│   └── package.json
└── ...
```

## Deployment Steps

### Frontend (React)

1. **Set environment variable for production API:**
   ```bash
   set REACT_APP_API_URL=https://your-production-domain.com/api
   ```

2. **Build the frontend:**
   ```bash
   npm run build
   ```

3. **Deploy to hosting (Vercel, Netlify, etc.):**
   - Connect your git repo
   - Set environment variable: `REACT_APP_API_URL`
   - Deploy the `dist/` folder

### Backend (Node.js)

**Option A: Deploy to Heroku**

1. Install Heroku CLI
2. Create Procfile:
   ```
   web: node backend/server.js
   ```
3. Push to Heroku:
   ```bash
   heroku create your-app-name
   heroku config:set NODE_ENV=production
   heroku config:set EMAIL_USER=your-email@gmail.com
   heroku config:set EMAIL_PASSWORD=your-app-password
   git push heroku main
   ```

**Option B: Deploy to Render**
- Connect GitHub repo
- Set environment variables in dashboard
- Deploy

**Option C: Self-hosted (VPS)**
1. Install Node.js on server
2. Clone repository
3. Install dependencies: `npm install`
4. Create `.env` file with production credentials
5. Use PM2 to keep process running:
   ```bash
   npm install -g pm2
   pm2 start backend/server.js --name appointments
   pm2 startup
   pm2 save
   ```

## Environment Variables

### Frontend (.env.production)
```
REACT_APP_API_URL=https://your-backend-domain.com
```

### Backend (.env.production)
```
NODE_ENV=production
PORT=3001
EMAIL_USER=your-production-email@gmail.com
EMAIL_PASSWORD=your-production-app-password
```

## Database (When Ready)

Currently using in-memory storage (slots reset on server restart). For production:

1. **Option 1: Add MongoDB**
   ```bash
   npm install mongoose
   ```
   Update `slotsApi.ts` to use MongoDB

2. **Option 2: Add PostgreSQL**
   ```bash
   npm install pg
   ```
   Use TypeORM or Prisma

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Add CORS configuration for your domain
- [ ] Validate email addresses
- [ ] Add rate limiting to email endpoint
- [ ] Store emails securely (use database, not localStorage)
- [ ] Add authentication for admin slots management
- [ ] Use environment variables for all secrets
- [ ] Enable 2FA on email account

## Integration into Existing Website

1. **Create a route in your main site:**
   ```jsx
   // In your main website routes
   import BookAppointment from './kodeme/src/pages/BookAppointment';
   
   <Route path="/book-appointment" element={<BookAppointment />} />
   ```

2. **Or use as embedded component:**
   ```jsx
   // Create a wrapper component
   <Layout currentPageName="BookAppointment">
     <BookAppointment />
   </Layout>
   ```

3. **Share state/styling with main site**
   - Move colors to CSS variables
   - Use main site's theme
   - Share authentication if needed

## Monitoring & Maintenance

- Monitor email sending success rates
- Set up error logging (Sentry, LogRocket)
- Regular backups of email records
- Monitor API response times
