// js/router.js
export class Router {
  constructor() {
    this.routes = [];
    this.guards = [];
    this.currentRoute = null;
    this.params = {};
    
    window.addEventListener('hashchange', () => this.handleHashChange());
  }

  register(path, handler) {
    this.routes.push({ path, handler });
  }

  addGuard(guardFn) {
    this.guards.push(guardFn);
  }

  navigate(path) {
    window.location.hash = path;
  }

  start() {
    if (!window.location.hash) {
      window.location.hash = '/';
    }
    this.handleHashChange();
  }

  getCurrentRoute() {
    return this.currentRoute;
  }

  getParams() {
    return this.params;
  }

  matchRoute(path) {
    for (const route of this.routes) {
      const paramNames = [];
      const regexPath = route.path.replace(/(:[a-zA-Z0-9]+)/g, (match) => {
        paramNames.push(match.slice(1));
        return '([^\\/]+)';
      });
      const regex = new RegExp(`^${regexPath}$`);
      const match = path.match(regex);

      if (match) {
        const params = {};
        paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });
        return { route, params };
      }
    }
    return null;
  }

  async handleHashChange() {
    const rawPath = window.location.hash.slice(1) || '/';
    const path = rawPath.split('?')[0] || '/';
    this.currentRoute = path;
    
    // Run guards
    for (const guard of this.guards) {
      const allowed = await guard(path);
      if (!allowed) return; // Guard should handle redirect if necessary
    }

    const match = this.matchRoute(path);

    if (match) {
      this.params = match.params;
      await match.route.handler(this.params);
      this.updateActiveLinks(path);
    } else {
      this.render404();
    }
  }

  updateActiveLinks(path) {
    document.querySelectorAll('a[data-link]').forEach(link => {
      if (link.getAttribute('href') === `#${path}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  render404() {
    const container = document.getElementById('page-content');
    if (container) {
      container.innerHTML = `
        <div class="error-404" style="text-align: center; padding: 100px 20px;">
          <h1 style="color: #10263B; font-family: 'Playfair Display', serif;">404</h1>
          <p style="font-family: 'Inter', sans-serif;">Page not found</p>
          <a href="#/" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #10263B; color: white; text-decoration: none; border-radius: 4px; font-family: 'Inter', sans-serif;">Return Home</a>
        </div>
      `;
    }
  }
}
