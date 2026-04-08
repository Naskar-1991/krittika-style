# Logo Management Feature - Setup Guide

## 📋 Overview
This document outlines the implementation of the Logo Management feature for your ecommerce platform. The feature allows administrators to upload, manage, and display a site logo through the admin panel with display on the frontend header.

## ✨ Features Implemented

### Backend (Node.js/Express)
1. **New Database Table**: `site_settings`
   - Stores logo URL, alt text, site name, and description
   - Located in: `backend/MIGRATION_ADD_LOGO.sql`
   - File: [MIGRATION_ADD_LOGO.sql](./backend/MIGRATION_ADD_LOGO.sql)

2. **Logo API Routes**: `backend/routes/logo.js`
   - **GET** `/api/logo` - Fetch current logo (Public endpoint)
   - **POST** `/api/logo/upload` - Upload/update logo (Admin only)
   - **DELETE** `/api/logo/:id` - Delete logo (Admin only)
   - Features:
     - Multer file upload handling with image validation
     - Automatic old logo file cleanup
     - 5MB file size limit
     - Support for JPG, PNG, GIF, WebP, SVG formats

3. **Server Integration**: Updated `server.js`
   - Added logo route import and middleware binding

### Frontend (React)

#### Admin Panel
1. **Logo Management Page**: `src/admin/ManageLogo.js`
   - Upload new logo with preview
   - Edit alt text for accessibility
   - View current logo
   - Delete logo from system
   - Success/error notifications

2. **Styling**: `src/admin/ManageLogo.css`
   - Responsive two-column layout (single column on mobile)
   - Professional form design
   - Image preview functionality
   - Alert notifications

3. **Admin Navigation**: Updated `AdminLayout.js`
   - Added "🎨 Logo" link in admin sidebar
   - Routes to `/admin/logo`

4. **App Routes**: Updated `App.js`
   - Imported `ManageLogo` component
   - Added protected route: `/admin/logo`

#### Frontend Display
1. **Header Component**: Updated `src/components/Header.js`
   - Fetches logo from API on component mount
   - Displays uploaded logo image in header
   - Falls back to default icon + text if no logo
   - Loads logo without blocking component

2. **Header Styling**: Updated `src/components/Header.css`
   - Added `.logo-image` style for responsive logo display
   - Max height: 50px, Max width: 200px
   - Object-fit: contain for proper aspect ratio

## 🚀 Setup Instructions

### Step 1: Run Database Migration
Execute the migration to create the `site_settings` table:

```bash
# Using psql
psql -U postgres -d ecommerce_db -f backend/MIGRATION_ADD_LOGO.sql

# OR in your database client, run the SQL from MIGRATION_ADD_LOGO.sql
```

### Step 2: Verify Backend Route
Check that the logo route is properly integrated:
```javascript
// In server.js, verify this line exists:
app.use("/api/logo", logoRoute);
```

### Step 3: Restart Backend Server
```bash
cd krittika-style/backend
npm start
```

### Step 4: Access Admin Logo Management
1. Login as admin
2. Click "🎨 Logo" in the admin sidebar
3. Upload your logo:
   - Select image file
   - Add alt text (for accessibility)
   - Click "Upload Logo"
4. View and manage current logo

### Step 5: Verify Frontend Display
- Visit homepage or any public page
- Logo should appear in the header
- If no logo is uploaded, default icon appears

## 📁 File Structure
```
krittika-style/
├── backend/
│   ├── MIGRATION_ADD_LOGO.sql          (Database migration)
│   ├── routes/
│   │   └── logo.js                      (API endpoints)
│   ├── server.js                        (Updated with logo route)
│   └── uploads/                         (Logo files stored here)
├── src/
│   ├── admin/
│   │   ├── ManageLogo.js               (Admin logo management)
│   │   ├── ManageLogo.css              (Admin styling)
│   │   ├── AdminLayout.js              (Updated with logo nav)
│   │   └── ...
│   ├── components/
│   │   ├── Header.js                   (Updated for logo display)
│   │   ├── Header.css                  (Updated styling)
│   │   └── ...
│   └── App.js                          (Updated routes)
```

## 🔐 API Endpoints

### Get Current Logo
```bash
GET /api/logo
# Response: { id, logo_url, logo_alt_text, site_name }
# Status: 200 - Always returns JSON (null if no logo)
```

### Upload Logo (Admin Only)
```bash
POST /api/logo/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Request Body:
- logo: <image file>
- altText: string (optional, default: "Logo")

Response: { message, data: { id, logo_url, logo_alt_text } }
Status: 201 - Created
```

### Delete Logo (Admin Only)
```bash
DELETE /api/logo/:id
Authorization: Bearer <token>

Response: { message: "Logo deleted successfully" }
Status: 200 - OK
```

## 🎨 Features & Validation

### Image Validation
- **Allowed Formats**: JPG, PNG, GIF, WebP, SVG
- **Max Size**: 5MB per file
- **Auto Cleanup**: Old logo file is deleted when new one is uploaded

### Accessibility
- Alt text field required for each logo
- Proper semantic HTML structure
- ARIA labels on form controls

### Responsive Design
- Admin panel: 2 columns (desktop), 1 column (mobile)
- Logo display: Automatically scales to fit header
- Mobile-friendly navigation

## 🔍 Troubleshooting

### Logo not displaying
1. Check if logo is uploaded in admin panel
2. Verify `/uploads` folder exists with logo files
3. Check browser console for API errors
4. Ensure backend is running

### Upload fails
1. Check file size (must be < 5MB)
2. Verify file is a valid image format
3. Ensure `/uploads` directory has write permissions
4. Check server logs for detailed errors

### Database errors
1. Verify migration was run successfully
2. Check database connection settings
3. Ensure `site_settings` table exists

## 📝 Notes

- Logo is displayed in the main header across all public pages
- Admin panel allows easy logo management without database access
- Logo URL is stored in database with automatic file management
- Supports responsive logo sizing
- Fallback to default branding if no logo exists

## ✅ Testing Checklist

- [ ] Database migration executed successfully
- [ ] Backend server starts without errors
- [ ] Admin can navigate to `/admin/logo`
- [ ] Logo upload form works and shows preview
- [ ] Logo appears in header after upload
- [ ] Logo deletes successfully
- [ ] Page refreshes and logo persists
- [ ] Logo displays correctly on mobile
- [ ] Default branding shows if logo is deleted
- [ ] Alt text is properly set
