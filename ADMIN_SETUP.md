# KrittikaStyle Admin Management System - Setup & API Documentation

## Overview
This document provides comprehensive setup instructions and API documentation for the user and order management features integrated into the KrittikaStyle ecommerce application.

## ✅ Features Implemented

### Backend Features
- **User Management API**: CRUD operations for managing users (admin only)
- **Order Management API**: Create, list, view details, and update order status
- **Admin Authentication**: Role-based access control with JWT
- **Order Item Tracking**: Detailed order items with product information
- **Database Integration**: PostgreSQL with proper foreign key relationships

### Frontend Features
- **Admin Users Dashboard**: 
  - View all users in a professional table layout
  - Edit user details (name, email, role, password)
  - Delete users with confirmation
  - Real-time user count display
  
- **Admin Orders Dashboard**:
  - View all orders with customer and status information
  - Click to view detailed order information
  - Update order status (pending → processing → shipped → delivered)
  - Track order items with product images and prices
  - Delete orders with confirmation
  - Display total revenue and order amounts

- **Admin Stats Dashboard**:
  - Live product count
  - Live user count
  - Live order count
  - Total revenue calculation (from delivered orders)
  - Average order value calculation
  - Quick stats overview cards

## Database Setup

### Required Tables
See `DATABASE_SCHEMA.sql` for the complete schema. You need the following tables:

```sql
-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image VARCHAR(500),
    description TEXT,
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending',
    total_amount DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items Table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Setup Instructions

1. **Create Database**:
   ```bash
   createdb skart_db
   ```

2. **Import Schema**:
   ```bash
   psql -U postgres -d skart_db -f backend/DATABASE_SCHEMA.sql
   ```

3. **Verify Connection**:
   ```bash
   psql -U postgres -d skart_db -c "\dt"
   ```

## Backend API Endpoints

### Authentication
- **POST** `/api/auth/signup` - Register new user
- **POST** `/api/auth/login` - Login user
- **GET** `/api/auth/profile` - Get current user profile (requires token)

### User Management (Admin Only)
- **GET** `/api/users` - Get all users
  - Headers: `Authorization: Bearer <token>`
  - Response: Array of user objects with id, name, email, role, created_at

- **GET** `/api/users/:id` - Get single user
  - Headers: `Authorization: Bearer <token>`
  - Response: Single user object

- **PUT** `/api/users/:id` - Update user
  - Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
  - Body: `{ name?, email?, password?, role? }`
  - Response: Updated user object

- **DELETE** `/api/users/:id` - Delete user
  - Headers: `Authorization: Bearer <token>`
  - Response: Success message

### Order Management

#### For All Authenticated Users
- **POST** `/api/orders` - Create new order
  - Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
  - Body: `{ items: [{id, quantity, price}], totalAmount }`
  - Response: Created order object

- **GET** `/api/orders/user/my-orders` - Get user's own orders
  - Headers: `Authorization: Bearer <token>`
  - Response: Array of user's orders

- **GET** `/api/orders/:id` - Get order details
  - Headers: `Authorization: Bearer <token>`
  - Response: Order with items detail

#### For Admin Only
- **GET** `/api/orders` - Get all orders
  - Headers: `Authorization: Bearer <token>`
  - Response: Array of all orders with user info

- **PUT** `/api/orders/:id/status` - Update order status
  - Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
  - Body: `{ status: "pending|processing|shipped|delivered|cancelled" }`
  - Response: Updated order object

- **DELETE** `/api/orders/:id` - Delete order
  - Headers: `Authorization: Bearer <token>`
  - Response: Success message

### Products (Existing)
- **GET** `/api/products` - Get all products (public)
- **GET** `/api/products/:id` - Get single product (public)
- **POST** `/api/products` - Create product (admin only, with file upload)
- **PUT** `/api/products/:id` - Update product (admin only)
- **DELETE** `/api/products/:id` - Delete product (admin only)

## Frontend Components

### AdminUsers.js
Location: `src/admin/AdminUsers.js`

**Features**:
- Display users in a responsive table
- Edit user details with modal form
- Delete users with confirmation dialog
- Real-time state updates
- Error handling and loading states
- Professional UI with hover effects

**Key Functions**:
- `fetchUsers()` - Load all users from API
- `handleEdit(user)` - Open edit modal
- `handleSaveEdit()` - Save updated user
- `handleDelete(userId)` - Delete user

### ManageOrders.js
Location: `src/admin/ManageOrders.js`

**Features**:
- Display all orders in a scrollable table
- Click to view detailed order information
- Update order status with color-coded buttons
- View order items with product images
- Calculate and display order totals
- Delete orders with confirmation
- Status tracking (pending, processing, shipped, delivered, cancelled)

**Key Functions**:
- `fetchOrders()` - Load all orders
- `fetchOrderDetails(orderId)` - Get detailed order info
- `handleUpdateStatus(orderId, newStatus)` - Update order status
- `handleDeleteOrder(orderId)` - Delete order

### AdminDashboard.js
Location: `src/admin/AdminDashboard.js`

**Features**:
- Display live statistics cards (products, users, orders, revenue)
- Calculate total revenue from delivered orders
- Show average order value
- Animated loading states
- Responsive grid layout
- Hover animations on stat cards

**Statistics Displayed**:
- Total Products Count
- Total Users Count
- Total Orders Count
- Total Revenue (from delivered orders only)
- Average Order Value
- Inventory Items Count

## How to Use

### As an Admin

1. **Login as Admin**:
   - Login with an admin account (must have role = 'admin' in database)
   - You'll see the admin link in the navbar

2. **View Dashboard**:
   - Click "📊 Admin" → "Dashboard" to see store statistics
   - Monitor products, users, orders, and revenue

3. **Manage Users**:
   - Click "📊 Admin" → "👥 Users"
   - View all users in the table
   - Click "✏️ Edit" to modify user details or change role
   - Click "🗑️ Delete" to remove a user
   - Cannot delete your own account (self-protection)

4. **Manage Orders**:
   - Click "📊 Admin" → "📋 Orders"
   - View the orders list on the left
   - Click "View" to see order details on the right
   - Use status buttons to update order progress
   - View product images and prices for each order item
   - Delete orders if needed

5. **Manage Products**:
   - Click "📊 Admin" → "📦 Products"
   - Add new products with images
   - Edit existing products
   - Delete products as needed

### As a Regular User

1. **View Products**: Browse the storefront
2. **Add to Cart**: Click "Add to Cart" on products
3. **Checkout**: Proceed to checkout to create an order
4. **View Orders**: (Future feature) View your order history

## File Structure

### Backend
```
backend/
├── server.js              # Express server setup with new routes
├── db.js                  # Database connection
├── DATABASE_SCHEMA.sql    # SQL schema file
├── .env                   # Environment variables
├── routes/
│   ├── auth.js           # Authentication routes
│   ├── products.js       # Product CRUD routes
│   ├── users.js          # NEW: User management routes
│   ├── orders.js         # UPDATED: Enhanced order routes
│   └── cart.js           # Cart routes
└── uploads/              # Product image storage
```

### Frontend
```
src/
├── admin/
│   ├── AdminDashboard.js  # UPDATED: Real data from APIs
│   ├── AdminLayout.js     # Sidebar navigation
│   ├── AdminUsers.js      # NEW: User management UI
│   ├── ManageOrders.js    # UPDATED: Order management UI
│   ├── ManageProducts.js  # Product management UI
│   └── AdminUsers.js      # User management UI
├── pages/
├── components/
└── context/
```

## Testing

### Test User Management
```bash
curl -X GET http://localhost:5500/api/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Test Order Management
```bash
curl -X GET http://localhost:5500/api/orders \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Test Update Order Status
```bash
curl -X PUT http://localhost:5500/api/orders/1/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "shipped"}'
```

## Error Handling

### Common Issues

1. **"Admin access required" error**:
   - Ensure your user account has role = 'admin' in database
   - Run: `UPDATE users SET role='admin' WHERE email='your@email.com';`

2. **"User not found" when fetching users**:
   - Verify the users table has data
   - Check database connection in .env file

3. **"Failed to fetch orders"**:
   - Ensure orders table exists and is properly linked to users table
   - Check JWT token is valid

4. **Image not displaying in orders**:
   - Verify product.image field contains valid URL or base64 string
   - Check uploads directory is accessible

## Security Considerations

✅ **Implemented**:
- JWT authentication on all protected endpoints
- Admin role verification on sensitive operations
- Password hashing with bcrypt
- Users cannot delete their own accounts
- Foreign key constraints to prevent orphaned data

⚠️ **Future Improvements**:
- Rate limiting on API endpoints
- Input validation and sanitization
- HTTPS in production
- Session management and token refresh
- Audit logging for admin actions
- Two-factor authentication

## Notes

- All timestamps are in UTC timezone
- Prices are stored as DECIMAL(10, 2) for accurate currency handling
- Order status flow: pending → processing → shipped → delivered
- Revenue calculation includes only "delivered" orders
- Admin can change any user's role or password
- Orders are immutable once created (status updates only)

## Support

For issues or questions, check:
1. Backend terminal output for server errors
2. Browser console for frontend errors
3. Database logs: `psql -U postgres -d skart_db`
4. API response headers and status codes

---

**Integrated on**: March 2, 2026  
**Admin User Management**: ✅ Complete  
**Admin Order Management**: ✅ Complete  
**Admin Dashboard**: ✅ Complete with real-time data
