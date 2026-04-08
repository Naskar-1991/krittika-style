# Shiprocket Order Creation - Debug Guide

## Issue: "Please add billing/shipping address first" Error

If you're getting a 400 error from Shiprocket with message `"Please add billing/shipping address first"`, it means one or more address fields are invalid or missing.

## Debugging Steps

### 1. Check Backend Logs

When creating an order, check your backend console for DETAILED logs:

```
📦 CHECKOUT DATA RECEIVED:
  user: { ... }
  shippingInfo: { ... }

🔍 VALIDATION CHECK - Errors: X
  - [specific field issues]

📝 Cleaned Data: { ... }
```

### 2. Required Fields (The "Big 5")

These MUST be present and properly formatted:

| Field | Rules | Example |
|-------|-------|---------|
| **Phone** | 10+ digits, no spaces | `9876543210` |
| **Pincode** | 5-6 digits only | `400001` |
| **State** | 2+ characters | `Maharashtra` |
| **Address** | 5+ characters | `123 Main Street` |
| **City** | Non-empty | `Mumbai` |

If ANY of these fail validation, the order will NOT be sent to Shiprocket.

### 3. What the Logs Show

#### ✅ If validation PASSES:
```
✅ All validation checks passed!
📤 Sending valid order to Shiprocket...
=== SHIPROCKET ORDER CREATION ===
Raw input from routes: { ... }
Payload sent to Shiprocket API: { ... }
✅ Shiprocket Order Created Successfully: { ... }
```

#### ❌ If validation FAILS:
```
❌ SHIPROCKET VALIDATION FAILED:
   - Phone: invalid (user.phone: "", shippingInfo.phone: "", cleaned: "")
   - Pincode: invalid (input: "40001", cleaned: "")
   ...
📝 Cleaned Data: { phone: "", pincode: "", ... }
⏭️  SKIPPING SHIPROCKET - Validation errors found
```

#### ⚠️ If validation PASSES but Shiprocket REJECTS:
```
✅ All validation checks passed!
❌ SHIPROCKET API ERROR:
  message: 'Request failed with status code 400'
  status: 400
  shiprocketMessage: 'Please add billing/shipping address first'
  sentPayload: { ... what was sent ... }
```

## Common Issues & Fixes

### Issue: Empty Phone Number
**Log shows:** `Phone: invalid (user.phone: "", shippingInfo.phone: "")`

**Fix:** 
- Phone field must be filled in checkout form
- Must be at least 10 digits
- Only numeric characters (spaces, dashes are removed)

```javascript
// Don't send: "98 7654 3210" or "98-7654-3210"
// Send as: "9876543210"
```

### Issue: Invalid Pincode
**Log shows:** `Pincode: invalid (input: "40001", cleaned: "")`

**Fix:**
- Pincode must be 5-6 digits
- Remove any dashes or spaces
- Must be numeric only

```javascript
// Don't send: "400-001" or "400 001"
// Send as: "400001"
```

### Issue: State Too Short
**Log shows:** `State: empty or too short (input: "MH", cleaned: "")`

**Fix:**
- State must be at least 2 characters (minimum)
- Use full state name when possible
- Recommended: Full name like "Maharashtra" instead of "MH"

```javascript
// Better: "Maharashtra"
// Acceptable: "MH" (if it's in dropdown)
```

### Issue: Address Too Short
**Log shows:** `Address: empty (input: "apt 5", cleaned: "")`

**Fix:**
- Address must be at least 5 characters
- Include street number, street name, apartment number
- Be specific and complete

```javascript
// Don't send: "apt 5" or "main"
// Send as: "123 Main Street Apt 5"
```

### Issue: Missing Customer Name
**Log shows:** `Customer name: "Customer" (user.name: "", firstName: "", lastName: "")`

**Fix:**
- Either set user profile name, OR
- Provide firstName AND lastName in checkout form
- Cannot use default "Customer" value

## Testing Checklist

Before placing an order, verify:

- [ ] Phone number is 10+ digits
- [ ] Pincode is 5-6 digits (numeric only)
- [ ] State is at least 2 characters
- [ ] Address is at least 5 characters
- [ ] City is filled in
- [ ] Customer name is not "Customer" (either user profile or firstName+lastName)

## Backend Console Output Format

```
📦 Stage 1: Raw Data Received
   - Shows exactly what came from frontend

🔍 Stage 2: Validation
   - Shows what fields passed/failed
   - Shows cleaned data after sanitization

📤 Stage 3: Send to Shiprocket (if validation passed)
   - Shows exact payload being sent

✅/❌ Stage 4: Response
   - Shows success or specific Shiprocket error
   - Includes the rejected payload for comparison
```

## Important Notes

1. **Orders are always created locally** - Even if Shiprocket fails, your order exists in the database
2. **Shipping tracking only works if Shiprocket accepts the order** - Without successful sync, tracking page shows no data
3. **Field lengths** - Shiprocket may have maximum length limits too, not just minimums
4. **State codes** - Some regions might require specific state codes instead of names

## Next Steps

1. **Check your logs** during checkout
2. **Identify which field fails** from the "Cleaned Data" section
3. **Fix the checkout form** to provide valid data
4. **Test with complete shipping info**

If the issue persists after providing valid data, Shiprocket's API might be rejecting the payload format itself - check the "sentPayload" field in the error logs to compare with Shiprocket API documentation.
