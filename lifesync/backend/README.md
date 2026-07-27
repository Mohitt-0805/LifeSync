# LifeSync Backend API

Express.js server configured with MongoDB using Mongoose and ES Modules.

## Setup & Running

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file from the `.env.example` template:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/lifesync
   JWT_ACCESS_SECRET=your_jwt_access_secret_here
   JWT_ACCESS_EXPIRY=15m
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
   JWT_REFRESH_EXPIRY=7d
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=smtp_user_placeholder
   SMTP_PASS=smtp_pass_placeholder
   FROM_EMAIL=no-reply@lifesync.com
   FRONTEND_URL=http://localhost:5173
   NODE_ENV=development
   ```

3. **Start the API Server**:
   - Dev mode (reloads automatically on save):
     ```bash
     npm run dev
     ```
   - Production mode:
     ```bash
     npm start
     ```

## Core Architecture
- **Centralized Error Wrapper**: All route responses utilize the custom `ApiError` format when throwing errors, captured by `errorMiddleware.js`.
- **Validation**: Schema inputs are checked on routers via `express-validator` and `validateMiddleware.js`.
- **JWT tokens rotation**: Access tokens are kept in memory/auth headers, while refresh tokens are stored in secure HTTPOnly cookies.
- **Mailer captures**: If SMTP details are unconfigured, links (e.g., password reset tokens) print directly to the server terminal.
