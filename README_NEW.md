# KrittikaStyle - Ecommerce Application

A full-stack ecommerce application built with React and Node.js/Express, featuring user authentication, product management, shopping cart, and **integrated Razorpay payment gateway**.

## Features

✅ User Authentication (Signup/Login with JWT)  
✅ Product Catalog with Filtering  
✅ Shopping Cart Management  
✅ **Razorpay Payment Gateway Integration**  
✅ Order Management & Tracking  
✅ Admin Dashboard  
✅ User Profile Management  
✅ Responsive Design  

## Quick Start

### Prerequisites
- Node.js (v14+)
- PostgreSQL
- npm or yarn

### Backend Setup

```bash
cd backend
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database and Razorpay credentials

# Run database migrations
psql -U postgres -d ecommerce -f DATABASE_SCHEMA.sql
psql -U postgres -d ecommerce -f MIGRATION_ADD_PAYMENT.sql

# Start the server
npm start
# For development with auto-reload: npm run dev
```

Backend runs on `http://localhost:5500`

### Frontend Setup

```bash
# In root directory
npm install
npm start
```

Frontend runs on `http://localhost:3000`

## Payment Integration

This app uses **Razorpay** for secure payment processing.

### Setup Razorpay

1. Create account at [Razorpay](https://razorpay.com)
2. Get API keys from dashboard
3. Add to `.env` file:
   ```
   RAZORPAY_KEY_ID=your_key_here
   RAZORPAY_KEY_SECRET=your_secret_here
   ```

See [RAZORPAY_SETUP.md](./RAZORPAY_SETUP.md) for detailed setup instructions.

### Payment Features
- Support for: Cards, UPI, Net Banking, Wallets
- Secure signature verification
- Payment status tracking
- Order status synchronization

## Project Structure

```
├── backend/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── orders.js
│   │   ├── payment.js (NEW)
│   │   ├── products.js
│   │   ├── users.js
│   │   └── cart.js
│   ├── db.js
│   ├── server.js
│   └── package.json
├── src/
│   ├── pages/
│   │   ├── Checkout.js (Updated with Razorpay)
│   │   ├── Products.js
│   │   ├── Home.js
│   │   ├── Profile.js
│   │   └── MyOrders.js
│   ├── components/
│   ├── context/
│   └── admin/
├── public/
└── package.json
```

## Database Schema

The app uses PostgreSQL with the following main tables:
- `users` - User accounts and authentication
- `products` - Product catalog
- `orders` - Order records with payment status
- `order_items` - Items in each order
- `cart` - Shopping cart items

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create product (admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/user/my-orders` - Get user's orders
- `GET /api/orders/:id` - Get order details

### Payment (NEW)
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify-payment` - Verify payment
- `GET /api/payment/status/:orderId` - Check payment status

### Users (Admin)
- `GET /api/users` - List all users
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)

## Environment Variables

Create a `.env` file in the backend folder:

```env
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
JWT_SECRET=your_secret
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce
DB_USER=postgres
DB_PASSWORD=your_password
PORT=5500
```

## Available Scripts

### Frontend

`npm start` - Runs development server  
`npm run build` - Build for production  
`npm test` - Run tests  

### Backend

`npm start` - Start server  
`npm run dev` - Start with nodemon (auto-reload)  

## Testing Payment

Use test cards in Razorpay dashboard:
- **Visa**: 4111111111111111
- **Mastercard**: 5555555555554444
- **UPI**: testmerchant@okhdfcbank

See [RAZORPAY_SETUP.md](./RAZORPAY_SETUP.md#8-testing-payment) for more test cards.

## Security

⚠️ **Important**:
- Never commit `.env` to version control
- Keep `RAZORPAY_KEY_SECRET` confidential
- Always verify payments on backend
- Use HTTPS in production
- Implement rate limiting for API endpoints

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running
- Check DB credentials in `.env`
- Verify database and tables exist

### Payment Integration Issues
- Check Razorpay API keys are correct
- Verify CORS settings
- Check browser console for errors
- See [RAZORPAY_SETUP.md](./RAZORPAY_SETUP.md#11-troubleshooting)

## Learn More

- [React Documentation](https://reactjs.org/)
- [Express.js Guide](https://expressjs.com/)
- [Razorpay Documentation](https://razorpay.com/docs)
- [PostgreSQL Guide](https://www.postgresql.org/docs/)

## License

ISC
