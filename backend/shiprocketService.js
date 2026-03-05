const axios = require('axios');

// Shiprocket API Base URL
const SHIPROCKET_API_BASE = 'https://apiv2.shiprocket.in/v1/external';

// Initialize Shiprocket client
class ShiprocketClient {
  constructor(apiKey = process.env.SHIPROCKET_API_KEY) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: SHIPROCKET_API_BASE,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
  }

  // Authenticate and get token (if using credentials-based auth)
  async authenticate(email, password) {
    try {
      const response = await axios.post(
        `${SHIPROCKET_API_BASE}/auth/login`,
        { email, password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return response.data;
    } catch (error) {
      console.error('Shiprocket Auth Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Create order in Shiprocket
  async createOrder(orderData) {
    try {
      const payload = {
        order_id: orderData.order_id,
        order_date: orderData.order_date,
        pickup_location: orderData.pickup_location_id || '50403', // Default warehouse
        billing_customer_name: orderData.billing_customer_name,
        billing_email: orderData.billing_email,
        billing_phone: orderData.billing_phone,
        billing_address: orderData.billing_address,
        billing_city: orderData.billing_city,
        billing_state: orderData.billing_state,
        billing_country: orderData.billing_country || 'India',
        billing_pincode: orderData.billing_pincode,
        shipping_is_default: true,
        shipping_customer_name: orderData.shipping_customer_name,
        shipping_email: orderData.shipping_email,
        shipping_phone: orderData.shipping_phone,
        shipping_address: orderData.shipping_address,
        shipping_city: orderData.shipping_city,
        shipping_state: orderData.shipping_state,
        shipping_country: orderData.shipping_country || 'India',
        shipping_pincode: orderData.shipping_pincode,
        order_items: orderData.order_items,
        payment_method: 'Prepaid',
        sub_total: orderData.sub_total,
        length: orderData.length || 10,
        breadth: orderData.breadth || 10,
        height: orderData.height || 10,
        weight: orderData.weight || 1
      };

      const response = await this.client.post('/orders/create/adhoc', payload);
      return response.data;
    } catch (error) {
      console.error('Shiprocket Order Creation Error:', error.response?.data || error.message);
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
