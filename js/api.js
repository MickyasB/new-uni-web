// js/api.js
import { state } from './state.js';

const BASE_URL = 'http://localhost:3001/api';
const WS_URL = 'ws://localhost:3001';

class ApiClient {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
  }

  // --- REST CLIENT ---
  
  async request(endpoint, options = {}) {
    state.setState({ ui: { loading: true } });
    try {
      const token = state.getState().user?.token;
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('API Request failed (operating in client mode):', error.message);
      throw error;
    } finally {
      state.setState({ ui: { loading: false } });
    }
  }

  get(path) { return this.request(path, { method: 'GET' }); }
  post(path, data) { return this.request(path, { method: 'POST', body: JSON.stringify(data) }); }
  put(path, data) { return this.request(path, { method: 'PUT', body: JSON.stringify(data) }); }
  delete(path) { return this.request(path, { method: 'DELETE' }); }

  // API Endpoints
  getScholarships(filters = {}) { return this.get('/scholarships' + this.buildQuery(filters)); }
  getScholarship(id) { return this.get(`/scholarships/${id}`); }
  
  getApplications() { return this.get('/applications'); }
  getApplication(id) { return this.get(`/applications/${id}`); }
  createApplication(data) { return this.post('/applications', data); }
  updateApplication(id, data) { return this.put(`/applications/${id}`, data); }
  submitApplication(id) { return this.post(`/applications/${id}/submit`); }

  login(email, password) { return this.post('/auth/login', { email, password }); }
  register(data) { return this.post('/auth/register', data); }
  getProfile() { return this.get('/auth/profile'); }

  getAdminStats() { return this.get('/admin/stats'); }
  getKanbanData() { return this.get('/admin/kanban'); }
  updateApplicationStatus(id, status) { return this.put(`/admin/applications/${id}/status`, { status }); }
  submitReview(applicationId, reviewData) { return this.post(`/admin/applications/${applicationId}/reviews`, reviewData); }

  uploadDocument(file) {
    const formData = new FormData();
    formData.append('document', file);
    
    state.setState({ ui: { loading: true } });
    const token = state.getState().user?.token;
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    return fetch(`${BASE_URL}/documents`, {
      method: 'POST',
      headers,
      body: formData
    })
    .then(res => res.json())
    .finally(() => state.setState({ ui: { loading: false } }));
  }
  
  deleteDocument(id) { return this.delete(`/documents/${id}`); }

  buildQuery(params) {
    const query = new URLSearchParams();
    for (const key in params) {
      if (params[key] && params[key] !== 'all') {
        query.append(key, params[key]);
      }
    }
    const str = query.toString();
    return str ? `?${str}` : '';
  }

  showToast(message, type = 'info') {
    const currentToasts = state.getState().ui.toasts;
    const newToast = { id: Date.now(), message, type };
    state.setState({ ui: { toasts: [...currentToasts, newToast] } });
    
    setTimeout(() => {
      const toasts = state.getState().ui.toasts.filter(t => t.id !== newToast.id);
      state.setState({ ui: { toasts } });
    }, 3000);
  }

  // --- WEBSOCKET MANAGER ---
  
  connect() {
    if (this.ws || !state.getState().isAuthenticated) return;
    
    try {
      this.ws = new WebSocket(WS_URL);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.authenticateWs();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWsMessage(data);
        } catch (e) {
          console.error('Failed to parse WS message', e);
        }
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.ws = null;
        this.attemptReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (e) {
      console.error('WebSocket connection failed:', e);
      this.attemptReconnect();
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(type, payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  authenticateWs() {
    const token = state.getState().user?.token;
    if (token) {
      this.send('auth', { token });
    }
  }

  handleWsMessage(message) {
    const { type, payload } = message;
    switch (type) {
      case 'statusUpdate':
        this.onStatusUpdate(payload);
        break;
      case 'notification':
        this.onNotification(payload);
        break;
      case 'documentRequest':
        this.onDocumentRequest(payload);
        break;
      default:
        console.log('Unknown WS message type:', type);
    }
  }

  attemptReconnect() {
    if (!state.getState().isAuthenticated) return;
    
    const timeout = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    
    setTimeout(() => {
      console.log(`Attempting to reconnect WS (Attempt ${this.reconnectAttempts})...`);
      this.connect();
    }, timeout);
  }

  onStatusUpdate(data) {
    this.showToast(`Application status updated: ${data.status}`, 'info');
  }

  onNotification(data) {
    const notifs = state.getState().notifications;
    state.setState({ notifications: [data, ...notifs] });
    this.showToast(`New Notification: ${data.message}`, 'info');
  }

  onDocumentRequest(data) {
    this.showToast(`Document request: ${data.documentType}`, 'warning');
  }
  
  getConnectionStatus() {
    if (!this.ws) return 'disconnected';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'disconnecting';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }
}

export const api = new ApiClient();
export default api;
