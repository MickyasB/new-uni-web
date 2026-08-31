// js/state.js
const initialState = {
  user: null,           // { id, email, fullName, country, role }
  isAuthenticated: false,
  currentRoute: '/',
  scholarships: [],     // cached scholarship list
  applications: [],     // user's applications
  notifications: [],    // live notifications
  filters: {            // scholarship filters
    level: 'all',
    faculty: 'all',
    nationality: 'all',
    amount: 'all',
    deadline: 'all'
  },
  applicationDraft: null, // current application draft
  adminData: {          // admin dashboard data
    totalApplications: 0,
    totalFunds: 0,
    pendingReviews: 0,
    kanbanColumns: {}
  },
  ui: {
    mobileMenuOpen: false,
    activeModal: null,
    toasts: [],
    loading: false
  }
};

class StateStore {
  constructor() {
    this.state = { ...initialState };
    this.listeners = {};
    this.loadPersistedState();
  }

  loadPersistedState() {
    try {
      const user = localStorage.getItem('user');
      const draft = localStorage.getItem('applicationDraft');
      
      if (user) {
        const parsed = JSON.parse(user);
        if (parsed && typeof parsed === 'object' && (parsed.email || parsed.id)) {
          this.state.user = parsed;
          this.state.isAuthenticated = true;
        } else {
          this.state.user = null;
          this.state.isAuthenticated = false;
          localStorage.removeItem('user');
        }
      }
      if (draft) {
        this.state.applicationDraft = JSON.parse(draft);
      }
    } catch (e) {
      console.error('Failed to load persisted state', e);
    }
  }

  getState() {
    return this.state;
  }

  setState(partialState) {
    const oldState = { ...this.state };

    // Explicitly handle user object assignment and persistence
    if ('user' in partialState) {
      if (partialState.user && typeof partialState.user === 'object') {
        this.state.user = { ...partialState.user };
        this.state.isAuthenticated = !!(this.state.user.email || this.state.user.id);
        localStorage.setItem('user', JSON.stringify(this.state.user));
      } else {
        this.state.user = null;
        this.state.isAuthenticated = false;
        localStorage.removeItem('user');
      }
    }

    this.state = this.deepMerge(this.state, partialState);
    
    // Persist draft
    if ('applicationDraft' in partialState) {
      if (partialState.applicationDraft) {
        localStorage.setItem('applicationDraft', JSON.stringify(this.state.applicationDraft));
      } else {
        localStorage.removeItem('applicationDraft');
      }
    }

    this.notifyListeners(oldState);
  }

  subscribe(key, callback) {
    if (!this.listeners[key]) {
      this.listeners[key] = [];
    }
    this.listeners[key].push(callback);
    
    return () => {
      this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
    };
  }

  notifyListeners(oldState) {
    Object.keys(this.listeners).forEach(key => {
      this.listeners[key].forEach(cb => cb(this.state, oldState));
    });
  }

  deepMerge(target, source) {
    if (!this.isObject(target)) {
      return this.isObject(source) ? { ...source } : source;
    }
    const output = Object.assign({}, target);
    if (this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!target[key] || !this.isObject(target[key])) {
            output[key] = { ...source[key] };
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          output[key] = source[key];
        }
      });
    }
    return output;
  }

  isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }
}

export const state = new StateStore();

// Proxy wrapper so pages can access state.user, state.applications etc. directly
const stateProxy = new Proxy(state, {
  get(target, prop) {
    if (prop in target) return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
    return target.getState()[prop];
  },
  set(target, prop, value) {
    target.setState({ [prop]: value });
    return true;
  }
});

export default stateProxy;
