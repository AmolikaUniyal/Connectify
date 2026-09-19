# Connectify

Connectify is a secure, real-time chat system built with Node.js, Express, Socket.IO, MongoDB, and JWT authentication. Authenticated users can join chat rooms, view persisted message history, see active participants, and exchange messages instantly through a browser interface.

## Features

- Real-time chat using Socket.IO
- Live message broadcasting between connected clients
- User registration with securely hashed passwords
- User login with JWT-based authentication
- Protected profile endpoint for authenticated users
- MongoDB persistence for user accounts
- Server-side safety layer that blocks threatening and suspicious messages before broadcast
- Responsive dark-themed chat interface
- Environment-based configuration for application secrets and database access

## Tech Stack

- **Backend:** Node.js, Express
- **Real-time communication:** Socket.IO
- **Database:** MongoDB with Mongoose
- **Authentication:** JSON Web Tokens (JWT), bcryptjs
- **Security:** Helmet, express-rate-limit, rule-based message safety checks
- **Frontend:** HTML, CSS, JavaScript
- **Configuration:** dotenv, CORS

## Project Structure

```text
connectify/
|-- config/
|   `-- db.js                 # MongoDB connection setup
|-- middleware/
|   `-- auth.js               # JWT authentication middleware
|   `-- messageSafety.js      # Rule-based message safety checks
|-- models/
|   |-- User.js               # User schema
|   `-- Message.js            # Persisted chat-message schema
|-- public/
|   |-- index.html            # Chat interface
|   `-- client.js             # Browser authentication and chat logic
|-- routes/
|   |-- auth.js               # Authentication API routes
|   `-- messages.js           # Protected message-history route
|-- test/
|   `-- messageSafety.test.js # Safety-layer tests
|-- .gitignore                # Excludes secrets and dependencies from Git
|-- server.js                 # Application entry point
`-- package.json
```

## Getting Started

### Prerequisites

- Node.js
- MongoDB Atlas account or a local MongoDB instance

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/<your-username>/connectify.git
   cd connectify
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root:

   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_jwt_secret
   ```

4. Start the application:

   ```bash
   npm start
   ```

5. Open `http://localhost:5000` in your browser.

### Available scripts

```bash
npm start   # Start the server
npm run dev # Start the server with file watching
npm test    # Run the safety-layer tests
```

## API Endpoints

| Method | Endpoint | Description | Authentication |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | Creates a new user account | No |
| POST | `/api/auth/login` | Authenticates a user and returns a JWT | No |
| GET | `/api/auth/profile` | Returns the authenticated user's profile | Bearer token |
| GET | `/api/messages/:room` | Returns the latest 50 delivered messages for a room | Bearer token |

### Signup request

```json
{
  "username": "demo",
  "email": "demo@example.com",
  "password": "123456"
}
```

### Login request

```json
{
  "email": "demo@example.com",
  "password": "123456"
}
```

### Protected route request

```http
Authorization: Bearer <your-jwt-token>
```

## Using the Chat System

1. Create an account from the signup form.
2. Log in with the registered email and password.
3. Choose General, Study, or Technology and select **Join room**.
4. Send messages to users in that room and view the latest persisted history.
5. Use **Log out** to clear the local session.

## Real-Time Messaging Flow

1. A user creates an account or logs in from the browser.
2. The browser sends the JWT during the Socket.IO handshake.
3. The authenticated user joins a chat room and loads its recent message history.
4. The server validates every new message with the safety layer and stores it in MongoDB.
5. Safe messages are broadcast only to the active room; blocked messages are logged and return a reason only to the sender.
6. Connected users receive live room-presence updates.

## Security

- Passwords are hashed with bcrypt before being saved.
- Login tokens are signed with a JWT secret and expire after one hour.
- Protected API routes validate the supplied JWT before returning data.
- The message safety layer rejects empty or oversized messages and blocks common threatening, self-harm-encouraging, credential-request, and unsafe-link patterns before delivery.
- Socket connections require a valid JWT, and API requests are rate limited.
- Helmet adds standard HTTP security headers.
- Sensitive configuration values are stored in environment variables.

## Testing

Run the automated safety-layer tests with:

```bash
npm test
```

The test suite verifies that ordinary messages are accepted and representative threatening, credential-request, and oversized messages are blocked.



## Author

Built as a full-stack real-time communication system using the MERN ecosystem.


