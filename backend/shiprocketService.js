const axios = require('axios');

// Shiprocket API Base URL
const SHIPROCKET_API_BASE = 'https://apiv2.shiprocket.in/v1/external';

// Initialize Shiprocket client
class ShiprocketClient {
  constructor(email = process.env.SHIPROCKET_EMAIL, apiKey = process.env.SHIPROCKET_API_KEY) {
    this.email = email;
    this.apiKey = apiKey;
    this.token = null;
    this.tokenExpiry = null;
    
    // Create initial client with placeholder auth
    // Will be updated after successful authentication
    this.client = axios.create({
      baseURL: SHIPROCKET_API_BASE,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Initialize authentication - MUST be called before making API requests
  async initialize() {
    try {
      console.log('🔐 Initializing Shiprocket Authentication...');
      console.log(`📧 Using email: ${this.email}`);
      
      const token = await this.authenticate(this.email, this.apiKey);
      
      console.log('✅ Shiprocket Authentication Successful!');
      console.log(`🔑 Token received: ${token.token ? token.token.substring(0, 20) + '...' : 'N/A'}`);
      
      return token;
    } catch (error) {
      console.error('❌ Shiprocket Initialization Failed:', error.message);
      throw error;
    }
  }

  // Authenticate with Shiprocket using email and API key
  async authenticate(email, password) {
    try {
      console.log('🔄 Calling Shiprocket /auth/login endpoint...');
      
      const response = await axios.post(
        `${SHIPROCKET_API_BASE}/auth/login`,
        { 
          email: email,
          password: password  // API Key is used as password
        },
        { 
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // Extract token from response
      const authToken = response.data.token;
      if (!authToken) {
        throw new Error('No token received from Shiprocket /auth/login');
      }

      // Update client with authenticated token
      this.token = authToken;
      this.client.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      
      console.log('✅ Token stored and client headers updated');
      
      return response.data;
    } catch (error) {
      console.error('❌ Shiprocket Auth Error:');
      console.error('  Status:', error.response?.status);
      console.error('  Message:', error.response?.data?.message || error.message);
      console.error('  Details:', error.response?.data);
      throw error;
    }
  }

  // Get current token (for debugging)
  getToken() {
    return this.token;
  }

  // Check if authenticated
  isAuthenticated() {
    return !!this.token;
  }

  // Create order in Shiprocket
  async createOrder(orderData) {
    let payload; // Declare outside try so catch can use it
    
    try {
      // Log raw input data
      console.log('=== SHIPROCKET ORDER CREATION ===');
      console.log('⚙️ API Configuration:', {
        baseURL: this.client.defaults.baseURL,
        hasAuthHeader: !!this.client.defaults.headers.Authorization,
        endpoint: '/orders/create/adhoc'
      });
      console.log('Raw input from routes:', JSON.stringify(orderData, null, 2));

      // Ensure phone numbers have country code prefix for Shiprocket (India: 91)
      const ensurePhoneWithCountryCode = (phone) => {
        if (!phone) return '';
        const cleaned = phone.toString();
        // If it's 10 digits (without country code), add 91 prefix
        if (cleaned.length === 10 && /^\d{10}$/.test(cleaned)) {
          console.log(`📞 Adding country code to phone: ${cleaned} → 91${cleaned}`);
          return `91${cleaned}`;
        }
        // If it already has 91 prefix, return as is
        if (cleaned.startsWith('91')) {
          return cleaned;
        }
        return cleaned;
      };

      // Build payload for Shiprocket - matching their exact API spec
      payload = {
        order_id: orderData.order_id,
        order_date: orderData.order_date,
        pickup_location: orderData.pickup_location_id || '50403', // Must be numeric or string ID
        billing_customer_name: orderData.billing_customer_name,
        billing_email: orderData.billing_email,
        billing_phone: ensurePhoneWithCountryCode(orderData.billing_phone),
        billing_address: orderData.billing_address,
        billing_address_type: 'home', // Required by Shiprocket
        billing_city: orderData.billing_city,
        billing_state: orderData.billing_state,
        billing_country: orderData.billing_country || 'India',
        billing_pincode: orderData.billing_pincode,
        // Shipping info - MUST be present and valid
        shipping_is_default: true,
        shipping_customer_name: orderData.shipping_customer_name,
        shipping_email: orderData.shipping_email,
        shipping_phone: ensurePhoneWithCountryCode(orderData.shipping_phone),
        shipping_address: orderData.shipping_address,
        shipping_address_type: 'home', // Required by Shiprocket
        shipping_city: orderData.shipping_city,
        shipping_state: orderData.shipping_state,
        shipping_country: orderData.shipping_country || 'India',
        shipping_pincode: orderData.shipping_pincode,
        // Order items and other details
        order_items: orderData.order_items,
        payment_method: 'Prepaid',
        sub_total: parseFloat(orderData.sub_total || 0),
        length: parseInt(orderData.length || 10),
        breadth: parseInt(orderData.breadth || 10),
        height: parseInt(orderData.height || 10),
        weight: parseFloat(orderData.weight || 1)
      };

      // Final validation before sending
      console.log('\n✅ Final Payload Validation:');
      const addressFields = [
        'billing_customer_name', 'billing_address', 'billing_city', 'billing_state', 'billing_pincode',
        'shipping_customer_name', 'shipping_address', 'shipping_city', 'shipping_state', 'shipping_pincode'
      ];
      
      const fieldStatus = addressFields.map(field => ({
        field,
        value: payload[field],
        type: typeof payload[field],
        isEmpty: !payload[field] || payload[field] === ''
      }));
      
      console.log('Field Details:');
      fieldStatus.forEach(({field, value, type, isEmpty}) => {
        const status = isEmpty ? '❌ EMPTY' : '✅ OK';
        console.log(`  ${status} ${field}: "${value}" (type: ${type})`);
      });

      const emptyCount = fieldStatus.filter(f => f.isEmpty).length;
      if (emptyCount > 0) {
        console.error(`\n⚠️  ALERT: ${emptyCount} required fields are empty or undefined!`);
        fieldStatus.filter(f => f.isEmpty).forEach(({field}) => {
          console.error(`   - ${field}`);
        });
      } else {
        console.log('\n✅ All required address fields present and non-empty!');
      }

      console.log('\n📤 Sending to Shiprocket API...');
      console.log('Full Payload:', JSON.stringify(payload, null, 2));

      const response = await this.client.post('/orders/create/adhoc', payload);
      console.log('\n✅ SUCCESS! Shiprocket Order Created:');
      console.log(JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('\n❌ SHIPROCKET API FAILED');
      console.error('Error Type:', error.constructor.name);
      console.error('Error Message:', error.message);
      
      if (error.response) {
        console.error('\n📋 Shiprocket Response:');
        console.error('Status Code:', error.response.status);
        console.error('Status Text:', error.response.statusText);
        console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error('\n❌ No response received from Shiprocket:');
        console.error('Request was sent but no response came back');
        console.error('Check:');
        console.error('  1. SHIPROCKET_API_KEY is valid');
        console.error('  2. Network connection is working');
        console.error('  3. Shiprocket API is online');
      } else {
        console.error('\nError during request setup:', error.message);
      }
      
      console.error('\n📤 ACTUAL PAYLOAD SENT TO SHIPROCKET API:');
      console.error(JSON.stringify(payload, null, 2));
      throw error;
    }
  }

  // Create shipment
  async createShipment(shipmentData) {
    try {
      const response = await this.client.post('/shipments/create/adhoc', {
        shipments: [shipmentData]
      });
      return response.data;
    } catch (error) {
      console.error('Shiprocket Shipment Creation Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get shipment details
  async getShipmentDetails(shipmentId) {
    try {
      const response = await this.client.get(`/shipments/${shipmentId}`);
      return response.data;
    } catch (error) {
      console.error('Shiprocket Shipment Details Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get tracking details
  async getTrackingDetails(trackingNumber) {
    try {
      const response = await this.client.get(`/courier/track`, {
        params: { tracking_number: trackingNumber }
      });
      return response.data;
    } catch (error) {
      console.error('Shiprocket Tracking Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get order tracking
  async getOrderTracking(orderId) {
    try {
      const response = await this.client.get(`/orders/${orderId}/track`);
      return response.data;
    } catch (error) {
      console.error('Shiprocket Order Tracking Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // List all shipments
  async listShipments(filters = {}) {
    try {
      const response = await this.client.get('/shipments', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Shiprocket List Shipments Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Cancel shipment
  async cancelShipment(shipmentId) {
    try {
      const response = await this.client.post(`/shipments/${shipmentId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Shiprocket Cancel Shipment Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get available couriers
  async getAvailableCouriers(shipmentData) {
    try {
      const response = await this.client.post('/courier/assign/courierPartnerSuggestion', {
        shipment_id: shipmentData.shipment_id,
        weight: shipmentData.weight,
        cod: shipmentData.cod || 0,
        destination_city_id: shipmentData.destination_city_id,
        origin_city_id: shipmentData.origin_city_id || 50403 // Default warehouse
      });
      return response.data;
    } catch (error) {
      console.error('Shiprocket Couriers Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Assign courier
  async assignCourier(courierData) {
    try {
      const response = await this.client.post('/courier/assign/assign-courier', {
        shipment_id: courierData.shipment_id,
        courier_id: courierData.courier_id
      });
      return response.data;
    } catch (error) {
      console.error('Shiprocket Assign Courier Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Generate label (shipping label)
  async generateLabel(shipmentIds) {
    try {
      const response = await this.client.post('/orders/generate/label', {
        shipment_id: shipmentIds
      });
      return response.data;
    } catch (error) {
      console.error('Shiprocket Generate Label Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get label data
  async getLabelData(shipmentId) {
    try {
      const response = await this.client.get(`/orders/generate/label/${shipmentId}`);
      return response.data;
    } catch (error) {
      console.error('Shiprocket Get Label Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get manifest
  async getManifest(shipmentIds) {
    try {
      const response = await this.client.post('/orders/generate/manifest', {
        shipment_id: shipmentIds
      });
      return response.data;
    } catch (error) {
      console.error('Shiprocket Get Manifest Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get courier partner list
  async getCourierList() {
    try {
      const response = await this.client.get('/courier/courierListV2');
      return response.data;
    } catch (error) {
      console.error('Shiprocket Courier List Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Verify courier serviceability
  async verifyServiceability(pickupPincode, deliveryPincode, weight, cod = 0) {
    try {
      const response = await this.client.get('/courier/serviceability', {
        params: {
          pickup_postcode: pickupPincode,
          delivery_postcode: deliveryPincode,
          weight,
          cod
        }
      });
      return response.data;
    } catch (error) {
      console.error('Shiprocket Serviceability Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Generate RTO label
  async generateRTOLabel(shipmentIds) {
    try {
      const response = await this.client.post('/orders/generate/rto-label', {
        shipment_id: shipmentIds
      });
      return response.data;
    } catch (error) {
      console.error('Shiprocket RTO Label Error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = ShiprocketClient;
