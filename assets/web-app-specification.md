# Web Application - Project Specification

## Project Overview
A modern full-stack web application with authentication, payment processing, contact functionality, and core navigation tabs built using industry-standard technologies.

---

## Tech Stack

### Frontend
- **Framework**: React 18+ (with TypeScript)
- **Styling**: Tailwind CSS
- **State Management**: React Context API / Redux Toolkit
- **Routing**: React Router v6
- **UI Components**: shadcn/ui or Material-UI (MUI)
- **Form Handling**: React Hook Form + Zod validation
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Language**: TypeScript
- **Authentication**: JWT (JSON Web Tokens) + bcrypt
- **Payment Processing**: Stripe API
- **Database ORM**: Prisma
- **Validation**: Zod / Joi

### Database
- **Primary**: PostgreSQL
- **Alternative**: MongoDB (NoSQL option)
- **Caching**: Redis (optional, for sessions/performance)

### Deployment & DevOps
- **Frontend Hosting**: Vercel / Netlify
- **Backend Hosting**: Railway / Render / AWS EC2
- **Database Hosting**: Supabase / Railway / AWS RDS
- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions

---

## High-Level Design (HLD)

### Architecture Pattern
**3-Tier Architecture**
```
┌─────────────────────┐
│   Frontend (React)  │
│   - UI Components   │
│   - State Mgmt      │
└──────────┬──────────┘
           │ HTTP/REST
           ▼
┌─────────────────────┐
│  Backend (Express)  │
│   - API Routes      │
│   - Business Logic  │
│   - Auth Middleware │
└──────────┬──────────┘
           │ Prisma ORM
           ▼
┌─────────────────────┐
│  Database (Postgres)│
│   - User Data       │
│   - Transactions    │
│   - Content         │
└─────────────────────┘
```

### System Components

#### 1. Authentication System
- User registration with email verification
- Secure login with JWT tokens
- Password reset functionality
- Protected routes (frontend + backend)
- Session management

#### 2. Payment System
- Stripe integration for payment processing
- Payment intent creation
- Webhook handling for payment events
- Transaction history
- Receipt generation

#### 3. Contact System
- Contact form with validation
- Email notification service (SendGrid/NodeMailer)
- Admin dashboard for viewing messages
- Auto-response to user

#### 4. Navigation Tabs
- Home/Dashboard
- Products/Services
- About Us
- Pricing
- Contact
- User Profile (when logged in)

---

## Feature Requirements

### 1. Authentication & Authorization

#### User Registration
- Email and password
- Email verification (optional)
- Password strength requirements
- Username uniqueness check

#### User Login
- Email/username + password
- JWT token generation
- Refresh token mechanism
- "Remember me" functionality

#### Password Management
- Forgot password flow
- Reset password via email link
- Change password (authenticated users)

#### Protected Routes
- Frontend route guards
- Backend middleware for API protection
- Role-based access control (admin/user)

### 2. Payment Integration

#### Stripe Setup
- API key configuration (test/production)
- Stripe Elements for card input
- Payment intent creation
- 3D Secure (SCA) support

#### Payment Flow
```
User selects product → 
Payment form → 
Stripe processing → 
Webhook confirmation → 
Database update → 
Success/failure page
```

#### Features
- One-time payments
- Subscription support (optional)
- Payment history page
- Invoice/receipt download
- Refund handling (admin)

### 3. Contact Functionality

#### Contact Form Fields
- Name (required)
- Email (required, validated)
- Subject/Category dropdown
- Message (textarea, required)
- Phone (optional)

#### Backend Processing
- Email validation
- Spam protection (rate limiting)
- Send email to admin
- Store in database
- Auto-reply to user

### 4. Core Pages/Tabs

#### Home/Dashboard
- Hero section
- Feature highlights
- Call-to-action buttons
- Recent updates/news

#### Products/Services
- Product grid/list
- Filter and search
- Individual product pages
- Add to cart (if e-commerce)

#### About Us
- Company information
- Team section
- Mission/vision
- Contact information

#### Pricing
- Pricing tiers
- Feature comparison table
- Payment integration link

#### User Profile
- View/edit profile information
- Payment history
- Subscription management
- Settings

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user',
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Payments Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  stripe_payment_id VARCHAR(255) UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50), -- succeeded, failed, pending
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Contact Messages Table
```sql
CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'unread', -- unread, read, responded
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints

### Authentication
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - User login
POST   /api/auth/logout            - User logout
POST   /api/auth/refresh           - Refresh JWT token
POST   /api/auth/forgot-password   - Request password reset
POST   /api/auth/reset-password    - Reset password with token
GET    /api/auth/verify-email      - Verify email address
```

### User Management
```
GET    /api/users/me               - Get current user profile
PUT    /api/users/me               - Update user profile
DELETE /api/users/me               - Delete account
GET    /api/users/:id              - Get user by ID (admin)
```

### Payments
```
POST   /api/payments/create-intent - Create Stripe payment intent
POST   /api/payments/webhook       - Stripe webhook handler
GET    /api/payments/history       - Get user payment history
GET    /api/payments/:id           - Get specific payment details
```

### Contact
```
POST   /api/contact                - Submit contact form
GET    /api/contact                - Get all messages (admin)
GET    /api/contact/:id            - Get specific message (admin)
PUT    /api/contact/:id            - Update message status (admin)
DELETE /api/contact/:id            - Delete message (admin)
```

---

## Frontend Component Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── ForgotPasswordForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── payment/
│   │   ├── PaymentForm.tsx
│   │   ├── PaymentHistory.tsx
│   │   └── StripeProvider.tsx
│   ├── contact/
│   │   └── ContactForm.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── Navigation.tsx
│   └── common/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       └── Loader.tsx
├── pages/
│   ├── Home.tsx
│   ├── About.tsx
│   ├── Pricing.tsx
│   ├── Contact.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   └── Profile.tsx
├── context/
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── usePayment.ts
│   └── useApi.ts
├── services/
│   ├── api.ts
│   ├── auth.service.ts
│   ├── payment.service.ts
│   └── contact.service.ts
├── utils/
│   ├── validation.ts
│   ├── formatters.ts
│   └── constants.ts
└── types/
    ├── user.types.ts
    ├── payment.types.ts
    └── api.types.ts
```

---

## Backend Structure

```
src/
├── controllers/
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   ├── payment.controller.ts
│   └── contact.controller.ts
├── middleware/
│   ├── auth.middleware.ts
│   ├── validation.middleware.ts
│   ├── error.middleware.ts
│   └── rateLimit.middleware.ts
├── routes/
│   ├── auth.routes.ts
│   ├── user.routes.ts
│   ├── payment.routes.ts
│   └── contact.routes.ts
├── services/
│   ├── auth.service.ts
│   ├── email.service.ts
│   ├── payment.service.ts
│   └── user.service.ts
├── models/
│   └── prisma/
│       └── schema.prisma
├── utils/
│   ├── jwt.util.ts
│   ├── bcrypt.util.ts
│   └── validators.ts
├── config/
│   ├── database.ts
│   ├── stripe.ts
│   └── env.ts
└── index.ts
```

---

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxx
```

### Backend (.env)
```
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRES_IN=30d

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourapp.com

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

---

## Security Considerations

1. **Authentication**
   - Hash passwords with bcrypt (12+ rounds)
   - Use HTTP-only cookies for tokens
   - Implement CSRF protection
   - Add rate limiting on auth endpoints

2. **Payment Security**
   - Never store card details
   - Use Stripe Elements (PCI compliant)
   - Validate webhook signatures
   - Log all payment events

3. **API Security**
   - CORS configuration
   - Input validation and sanitization
   - SQL injection prevention (use ORM)
   - XSS protection
   - Rate limiting on all endpoints

4. **Data Protection**
   - Encrypt sensitive data at rest
   - Use HTTPS in production
   - Regular security audits
   - Implement proper error handling (no stack traces to client)

---

## Deployment Steps

### Frontend (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables
4. Deploy

### Backend (Railway/Render)
1. Push code to GitHub
2. Connect repository to hosting platform
3. Configure environment variables
4. Set up PostgreSQL database
5. Run migrations
6. Deploy

### Database Setup
```bash
# Install Prisma
npm install prisma @prisma/client

# Initialize Prisma
npx prisma init

# Create migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

---

## Testing Strategy

### Frontend
- Unit tests: Jest + React Testing Library
- E2E tests: Cypress/Playwright
- Component tests: Storybook

### Backend
- Unit tests: Jest
- Integration tests: Supertest
- API tests: Postman/Insomnia collections

---

## Future Enhancements

- [ ] Social login (Google, GitHub)
- [ ] Two-factor authentication (2FA)
- [ ] Real-time notifications (WebSocket)
- [ ] Admin dashboard with analytics
- [ ] Email marketing integration
- [ ] Multi-language support (i18n)
- [ ] Dark mode toggle
- [ ] Mobile app (React Native)
- [ ] API documentation (Swagger)
- [ ] CDN for static assets

---

## Quick Start Commands

### Initialize Project
```bash
# Frontend
npx create-vite@latest frontend --template react-ts
cd frontend
npm install react-router-dom axios @stripe/stripe-js tailwindcss
npm install -D @types/node

# Backend
mkdir backend && cd backend
npm init -y
npm install express cors dotenv bcryptjs jsonwebtoken stripe prisma
npm install -D typescript @types/express @types/node ts-node nodemon
npx tsc --init
```

### Run Development
```bash
# Frontend
npm run dev

# Backend
npm run dev
```

---

## Additional Notes

- Keep dependencies updated regularly
- Follow REST API best practices
- Use consistent code formatting (Prettier/ESLint)
- Write meaningful commit messages
- Document complex logic
- Use TypeScript for type safety
- Implement proper logging (Winston/Pino)
- Set up monitoring (Sentry for errors)

---

**Last Updated**: 2026-04-26  
**Version**: 1.0.0
