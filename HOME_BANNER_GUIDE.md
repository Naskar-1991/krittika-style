# Home Banner Component - Setup & Integration Guide

## Overview

A beautiful, responsive home page banner component featuring **5 different daily lifestyle activities** with:
- ✨ Auto-rotating carousel slides
- 🎨 Gradient backgrounds with lifestyle themes
- 📱 Mobile-responsive design
- 🎯 Call-to-action buttons
- 🔄 Manual navigation with arrows and indicators
- 💳 Built-in promotional cards section

---

## Features

### Lifestyle Activity Slides

1. **Casual Everyday Wear** - Comfortable & Stylish Clothing
2. **Office Essentials** - Professional Attire for Work
3. **Weekend Fashion** - Trendy Outfits for Fun Times
4. **Sports & Active Wear** - Performance Gear for Active Lifestyle
5. **Seasonal Collections** - Weather-Appropriate Style

Each slide includes:
- Beautiful background image (from Unsplash)
- Emoji icon for visual appeal
- Title and subtitle
- Description text
- Call-to-action button
- Navigation stats (Fast Shipping, Easy Returns, Secure Payment)

### Additional Sections

**Activity Cards Grid:**
- Displays all 5 lifestyle categories as clickable cards
- Hover animations for interactivity
- "Explore" buttons linking to products

**Promotional Cards:**
- Special Offer (20% off first purchase)
- Member Benefits
- New Arrivals

---

## Installation

### Step 1: Verify Files Are Created

Files created in your project:
```
src/
├── components/
│   ├── HomeBanner.js          ← Main React component
│   └── HomeBanner.css         ← Styling
```

### Step 2: Update Your Home Page

Edit `src/pages/Home.js` (or whatever your home page file is):

```javascript
import React from "react";
import HomeBanner from "../components/HomeBanner";
import "./Home.css";

const Home = () => {
  return (
    <div className="home-page">
      {/* Add the banner at the top */}
      <HomeBanner />

      {/* Rest of your home page content */}
      {/* ... other sections ... */}
    </div>
  );
};

export default Home;
```

### Step 3: No Additional Dependencies Required

The component uses:
- React hooks (useState, useEffect) - already installed
- React Router (navigate) - already installed
- Pure CSS - no external libraries needed

---

## Component API

### HomeBanner Component Props

Currently, the component works standalone without props. If you want to customize it, you can modify the `slides` array in the component:

```javascript
const slides = [
  {
    id: 1,
    title: "Your Title",
    subtitle: "Your Subtitle",
    description: "Description text",
    emoji: "🎯",
    color: "#667eea",
    cta: "Button Text",
    image: "https://your-image-url.jpg",
  },
  // ... more slides
];
```

### Customization Options

**Change Auto-Slide Duration:**
```javascript
// In useEffect (around line 100), change interval value:
const interval = setInterval(() => {
  setCurrentSlide((prev) => (prev + 1) % slides.length);
}, 5000); // Change 5000ms (5 seconds) to your desired duration
```

**Change Banner Height:**
```css
/* In HomeBanner.css, modify: */
.banner-wrapper {
  height: 500px; /* Change this value */
}
```

**Change Gradient Colors:**
```javascript
// In the slides array, modify the gradient property:
gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
```

---

## Image Sources

The component comes with free images from **Unsplash**:
- Casual Wear: Fashion model in casual clothes
- Office Essentials: Professional business attire
- Weekend Fashion: Trendy young fashion
- Sports & Active: Athletic performance wear
- Seasonal: Seasonal fashion collection

### Replace Images

To use your own images, update the `image` property in the slides array:

```javascript
image: "https://your-image-url.jpg"
```

**Recommended Free Image Sources:**
- **Unsplash.com** - High-quality, free lifestyle images
- **Pexels.com** - Royalty-free stock photos
- **Pixabay.com** - Free images and videos
- **Your Brand Photos** - Upload to your server/CDN

---

## Styling Variables

Key CSS variables you might want to customize:

```css
/* Button Colors */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Text Colors */
color: #1a1a1a; /* Dark text */
color: white;   /* Light text */

/* Spacing */
padding: 60px;  /* Main banner padding */
gap: 25px;      /* Card spacing */

/* Border Radius */
border-radius: 12px; /* Card roundness */
border-radius: 50%;  /* Circle buttons */
```

---

## Responsive Breakpoints

The component is fully responsive with breakpoints at:
- **1024px** - Tablets
- **768px** - Small tablets/large phones
- **480px** - Small phones

Each breakpoint adjusts:
- Font sizes
- Spacing/padding
- Grid layout
- Button sizes
- Arrow button sizes

---

## Browser Compatibility

✅ Chrome/Edge (Latest)
✅ Firefox (Latest)
✅ Safari (Latest)
✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## Performance Tips

1. **Optimize Images:**
   - Use images around 1200x400px max
   - Compress images (TinyPNG, ImageOptim)
   - Use WebP format for faster loading

2. **Lazy Loading:**
   If you have many images, add lazy loading:
   ```javascript
   image: "https://your-image-url.jpg",
   loading: "lazy"
   ```

3. **CDN Usage:**
   For production, host images on a CDN like Cloudinary or AWS S3

---

## Interaction Features

### 1. Auto-Rotating Carousel
- Automatically cycles through slides every 5 seconds
- Continues even with manual navigation

### 2. Manual Navigation
- **Left/Right Arrows** - Previous/Next slide
- **Indicator Dots** - Click to jump to specific slide
- Hover effects on all interactive elements

### 3. Activity Cards
- Hover animation (slide up)
- Click button to go to products page

### 4. Promotional Cards
- Color-coded (gradient backgrounds)
- Hover effects with lift animation

---

## Customization Examples

### Example 1: Change to 3-Slide Banner

In `HomeBanner.js`, modify the `slides` array:

```javascript
const slides = [
  // Keep only 3 slides instead of 5
  { id: 1, ... },
  { id: 2, ... },
  { id: 3, ... },
];
```

### Example 2: Disable Auto-Rotation

Comment out the useEffect:

```javascript
// useEffect(() => {
//   const interval = setInterval(() => {
//     setCurrentSlide((prev) => (prev + 1) % slides.length);
//   }, 5000);
//   return () => clearInterval(interval);
// }, []);
```

### Example 3: Custom CTA Links

Change navigation destinations:

```javascript
onClick={() => navigate("/products?category=casual")}
onClick={() => navigate("/collections/office-wear")}
```

---

## Accessibility Features

✅ Semantic HTML buttons
✅ ARIA labels ready (can be added)
✅ Keyboard navigation support
✅ Color contrast meets WCAG standards
✅ Focus states on interactive elements
✅ Responsive text sizing

---

## Troubleshooting

### Images Not Loading
- Check image URLs are correct
- Ensure no CORS issues
- Try using https:// instead of http://

### Carousel Not Auto-Playing
- Check browser console for errors
- Ensure `useEffect` is not commented out
- Verify interval duration is set

### Buttons Not Working
- Verify React Router is installed
- Check route paths are correct
- Ensure navigate function is imported

### Styling Issues
- Clear browser cache (Ctrl+Shift+Delete)
- Check CSS file path is correct
- Verify no CSS conflicts with global styles

---

## API Endpoints Needed

The component links to these pages (ensure they exist):
- `/products` - Products page
- `/` - Home page
- `/profile` - User profile page

Update the navigation links if your routes are different:

```javascript
// Change these paths to match your routing:
navigate("/products")
navigate("/")
navigate("/profile")
```

---

## SEO Optimization

The component includes semantic HTML, but for better SEO:

```javascript
// Add meta tags in Home.js
<Helmet>
  <title>KrittikaStyle - Fashion for Every Lifestyle</title>
  <meta name="description" content="Shop daily lifestyle fashion..."/>
</Helmet>
```

---

## Maintenance

### Regular Updates
- Update image URLs if hosting changes
- Review promotional content periodically
- Update CTA text for seasonal campaigns

### Analytics Integration
```javascript
// Add onClick to track button clicks:
onClick={() => {
  gtag.event("banner_click", { slide: currentSlide });
  navigate("/products");
}}
```

---

## Next Steps

1. ✅ Component files created
2. ✅ Integration ready
3. 📝 Add to your Home page
4. 🖼️ Replace images with your own
5. 🎨 Customize colors/text as needed
6. 🚀 Deploy to production
7. 📊 Monitor performance metrics

---

## Support & Customization

Need help?
- Review the component code - it's well commented
- Check CSS variables for quick styling changes
- Modify the `slides` array for content updates
- Use browser DevTools to test responsive design

---

**Component Created:** April 5, 2026  
**Version:** 1.0  
**Status:** Production Ready ✅
