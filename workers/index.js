/**
 * Welcome to Cloudflare Workers!
 *
 * This is the main script for your Worker, serving as the API backend for Mao Nav.
 * It's designed to be a single, self-contained file with zero npm dependencies.
 *
 * You can deploy this code directly by copying and pasting it into the Cloudflare
 * Worker editor in the web dashboard.
 *
 * @see https://developers.cloudflare.com/workers/
 */

// --- Configuration ---
// These values should be configured in your Worker's environment variables.
// - DB: The D1 Database binding.
// - JWT_SECRET: A long, random string used for signing JWTs.

// --- Utility Functions ---

/**
 * Creates a standardized JSON response.
 * @param {any} data - The payload to send.
 * @param {number} [status=200] - The HTTP status code.
 * @param {string|null} [message=null] - An optional message.
 * @returns {Response}
 */
const jsonResponse = (data, status = 200, message = null) => {
  const body = JSON.stringify({
    code: status === 200 ? 0 : status,
    message: message || (status === 200 ? 'success' : 'error'),
    data,
  });
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // Adjust for production
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};

/**
 * Handles CORS preflight requests.
 * @returns {Response}
 */
const handleOptions = () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*', // Adjust for production
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
};


// --- JWT and Crypto Functions (using Web Crypto API) ---

/**
 * Imports the JWT secret key for signing/verification.
 * @param {string} secret - The JWT secret from environment variables.
 * @returns {Promise<CryptoKey>}
 */
const importJwtKey = (secret) => {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
};

/**
 * Creates a JWT token.
 * @param {object} payload - The data to include in the token.
 * @param {string} secret - The JWT secret.
 * @returns {Promise<string>} The JWT token.
 */
async function createJwt(payload, secret) {
  const key = await importJwtKey(secret);
  const header = { alg: 'HS256', typ: 'JWT' };
  
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const data = `${encodedHeader}.${encodedPayload}`;
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(data)
  );
  
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  return `${data}.${encodedSignature}`;
}

/**
 * Verifies a JWT token and returns its payload.
 * @param {string} token - The JWT token.
 * @param {string} secret - The JWT secret.
 * @returns {Promise<object|null>} The payload if valid, otherwise null.
 */
async function verifyJwt(token, secret) {
  try {
    const key = await importJwtKey(secret);
    const [header, payload, signature] = token.split('.');
    
    const data = `${header}.${payload}`;
    const signatureArrayBuffer = Uint8Array.from(atob(signature.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureArrayBuffer,
      new TextEncoder().encode(data)
    );

    if (!isValid) return null;

    const decodedPayload = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    
    // Check expiration
    if (decodedPayload.exp && Date.now() / 1000 > decodedPayload.exp) {
      return null;
    }
    
    return decodedPayload;
  } catch (e) {
    return null;
  }
}

/**
 * Hashes a password using HMAC-SHA256.
 * NOTE: This is a simplified alternative to bcrypt for no-dependency environments.
 * It's secure but lacks the cost factor of bcrypt.
 * @param {string} password - The password to hash.
 * @param {string} secret - A secret key (can be the JWT_SECRET).
 * @returns {Promise<string>} The hashed password.
 */
async function hashPassword(password, secret) {
    const key = await crypto.subtle.importKey(
        'raw', 
        new TextEncoder().encode(secret), 
        { name: 'HMAC', hash: 'SHA-256' }, 
        false, 
        ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(password));
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * Verifies a password against a hash.
 * @param {string} password - The password to verify.
 * @param {string} hash - The stored hash.
 * @param {string} secret - The secret key used for hashing.
 * @returns {Promise<boolean>}
 */
async function verifyPassword(password, hash, secret) {
    const newHash = await hashPassword(password, secret);
    return newHash === hash;
}


// --- Middleware ---

/**
 * Authentication middleware. Verifies the JWT from the Authorization header.
 * @param {Request} request - The incoming request.
 * @param {object} env - The Worker environment.
 * @returns {Promise<object|Response>} The user payload or an error Response.
 */
async function authMiddleware(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7);
  const payload = await verifyJwt(token, env.JWT_SECRET);

  if (!payload) {
    return jsonResponse({ error: 'Invalid or expired token' }, 401);
  }
  
  // Check if the session is valid in the database
  const session = await env.DB.prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")')
    .bind(token)
    .first();
    
  if (!session) {
      return jsonResponse({ error: 'Session not found or expired' }, 401);
  }

  return { user: { id: payload.sub, username: payload.username } };
}


// --- API Route Handlers ---

const handlePublicRoutes = async (request, env, pathname) => {
  if (pathname === '/api/public/categories') {
    // Get all categories and their sites
    const categoriesStmt = env.DB.prepare('SELECT * FROM categories ORDER BY order_index');
    const sitesStmt = env.DB.prepare('SELECT * FROM sites ORDER BY category_id, order_index');
    const settingsStmt = env.DB.prepare("SELECT key, value FROM settings WHERE key IN ('site_title', 'default_search_engine')");

    const [categoriesResult, sitesResult, settingsResult] = await Promise.all([
        categoriesStmt.all(),
        sitesStmt.all(),
        settingsStmt.all()
    ]);

    const sitesByCategoryId = sitesResult.results.reduce((acc, site) => {
        if (!acc[site.category_id]) acc[site.category_id] = [];
        acc[site.category_id].push(site);
        return acc;
    }, {});

    const categories = categoriesResult.results.map(cat => ({
        ...cat,
        sites: sitesByCategoryId[cat.id] || []
    }));
    
    const settings = settingsResult.results.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
    }, {});

    return jsonResponse({
        categories,
        title: settings.site_title || 'Mao Nav',
        search: settings.default_search_engine || 'bing',
    });
  }
  
  if (pathname === '/api/public/settings') {
      const settingsResult = await env.DB.prepare("SELECT key, value FROM settings WHERE key IN ('site_title', 'default_search_engine', 'enable_lock')").all();
      const settings = settingsResult.results.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
    }, {});
    return jsonResponse(settings);
  }

  return jsonResponse({ error: 'Public route not found' }, 404);
};

const handleAuthRoutes = async (request, env, pathname) => {
    if (pathname === '/api/auth/login' && request.method === 'POST') {
        const { username, password } = await request.json();
        if (!username || !password) {
            return jsonResponse({ error: 'Username and password are required' }, 400);
        }

        const admin = await env.DB.prepare('SELECT * FROM admins WHERE username = ?').bind(username).first();
        if (!admin) {
            return jsonResponse({ error: 'Invalid credentials' }, 401);
        }

        // In a real app, you'd use bcrypt.compare. Here we use our HMAC-based verification.
        // The initial password hash in schema.sql must be generated with the same method.
        // For the first login, we might need a special case if the hash is a bcrypt hash.
        let isValid = false;
        if (admin.password_hash.startsWith('$2a$')) {
            // This is a bcrypt hash. We can't verify it without a library.
            // For the migration, we assume the user will reset the password.
            // As a fallback for the initial setup, we can check against a known plain password.
            // THIS IS INSECURE AND FOR INITIAL SETUP ONLY.
            if (password === 'admin') { // Fallback for initial admin
                 isValid = true;
            } else {
                 return jsonResponse({ error: 'Cannot verify password. Please reset password via database.' }, 500);
            }
        } else {
             isValid = await verifyPassword(password, admin.password_hash, env.JWT_SECRET);
        }

        if (!isValid) {
            return jsonResponse({ error: 'Invalid credentials' }, 401);
        }

        const expires = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours
        const token = await createJwt({ sub: admin.id, username: admin.username, exp: expires }, env.JWT_SECRET);
        
        const sessionId = crypto.randomUUID();
        const expiresAt = new Date(expires * 1000).toISOString().replace('T', ' ').substring(0, 19);

        await env.DB.prepare('INSERT INTO sessions (id, admin_id, token, expires_at) VALUES (?, ?, ?, ?)')
            .bind(sessionId, admin.id, token, expiresAt)
            .run();

        return jsonResponse({ token, expires_at: expiresAt });
    }
    
    if (pathname === '/api/auth/logout' && request.method === 'POST') {
        const authResult = await authMiddleware(request, env);
        if (authResult instanceof Response) return authResult; // Not authenticated
        
        const authHeader = request.headers.get('Authorization');
        const token = authHeader.substring(7);
        
        await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
        
        return jsonResponse({ message: 'Logged out successfully' });
    }

    return jsonResponse({ error: 'Auth route not found' }, 404);
};

const handleAdminRoutes = async (request, env, pathname) => {
    // All admin routes require authentication
    const authResult = await authMiddleware(request, env);
    if (authResult instanceof Response) {
        return authResult;
    }
    // request.user is now available from the middleware
    // request.user = authResult.user;

    // Example: Get all categories (admin version)
    if (pathname === '/api/admin/categories' && request.method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM categories ORDER BY order_index').all();
        return jsonResponse(results);
    }
    
    // Example: Create a category
    if (pathname === '/api/admin/categories' && request.method === 'POST') {
        const { id, name, icon, order_index } = await request.json();
        if (!id || !name || !icon) {
            return jsonResponse({ error: 'Missing required fields' }, 400);
        }
        await env.DB.prepare('INSERT INTO categories (id, name, icon, order_index) VALUES (?, ?, ?, ?)')
            .bind(id, name, icon, order_index || 0)
            .run();
        return jsonResponse({ id, name, icon, order_index }, 201);
    }
    
    // --- Categories ---
    if (pathname === '/api/admin/categories' && request.method === 'PUT') {
        const categories = await request.json(); // Expects an array of categories
        if (!Array.isArray(categories)) {
            return jsonResponse({ error: 'Request body must be an array of categories.' }, 400);
        }
        const stmts = categories.map(c => env.DB.prepare('UPDATE categories SET name = ?, icon = ?, order_index = ? WHERE id = ?').bind(c.name, c.icon, c.order_index, c.id));
        await env.DB.batch(stmts);
        return jsonResponse({ message: 'Categories updated' });
    }
    if (pathname.startsWith('/api/admin/categories/') && request.method === 'DELETE') {
        const id = pathname.split('/').pop();
        await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
        return jsonResponse({ message: 'Category deleted' });
    }

    // --- Sites ---
    if (pathname === '/api/admin/sites' && request.method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM sites ORDER BY category_id, order_index').all();
        return jsonResponse(results);
    }
    if (pathname === '/api/admin/sites' && request.method === 'POST') {
        const { id, category_id, name, url, description, icon, order_index } = await request.json();
        if (!id || !category_id || !name || !url) {
            return jsonResponse({ error: 'Missing required fields' }, 400);
        }
        await env.DB.prepare('INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .bind(id, category_id, name, url, description || '', icon || '', order_index || 0)
            .run();
        return jsonResponse({ id, category_id, name, url }, 201);
    }
    if (pathname.startsWith('/api/admin/sites/') && request.method === 'PUT') {
        const id = pathname.split('/').pop();
        const { category_id, name, url, description, icon, order_index } = await request.json();
        await env.DB.prepare('UPDATE sites SET category_id = ?, name = ?, url = ?, description = ?, icon = ?, order_index = ? WHERE id = ?')
            .bind(category_id, name, url, description, icon, order_index, id)
            .run();
        return jsonResponse({ message: 'Site updated' });
    }
    if (pathname.startsWith('/api/admin/sites/') && request.method === 'DELETE') {
        const id = pathname.split('/').pop();
        await env.DB.prepare('DELETE FROM sites WHERE id = ?').bind(id).run();
        return jsonResponse({ message: 'Site deleted' });
    }

    // --- Settings ---
    if (pathname === '/api/admin/settings' && request.method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM settings').all();
        return jsonResponse(results);
    }
    if (pathname === '/api/admin/settings' && request.method === 'PUT') {
        const settings = await request.json(); // Expects an object like { key: value, ... }
        const stmts = Object.entries(settings).map(([key, value]) => env.DB.prepare('UPDATE settings SET value = ? WHERE key = ?').bind(value, key));
        await env.DB.batch(stmts);
        return jsonResponse({ message: 'Settings updated' });
    }

    // --- Password Change ---
    if (pathname === '/api/admin/password' && request.method === 'PUT') {
        const { currentPassword, newPassword } = await request.json();
        if (!currentPassword || !newPassword) {
            return jsonResponse({ error: 'Current and new password are required' }, 400);
        }
        
        const admin = await env.DB.prepare('SELECT * FROM admins WHERE id = ?').bind(authResult.user.id).first();
        
        // See login logic for explanation of this insecure fallback
        let isValid = false;
        if (admin.password_hash.startsWith('$2a$')) {
            if (currentPassword === 'admin') isValid = true;
        } else {
            isValid = await verifyPassword(currentPassword, admin.password_hash, env.JWT_SECRET);
        }

        if (!isValid) {
            return jsonResponse({ error: 'Invalid current password' }, 403);
        }

        const newPasswordHash = await hashPassword(newPassword, env.JWT_SECRET);
        await env.DB.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').bind(newPasswordHash, authResult.user.id).run();
        
        // Log out all other sessions
        await env.DB.prepare('DELETE FROM sessions WHERE admin_id = ?').bind(authResult.user.id).run();

        return jsonResponse({ message: 'Password updated successfully. Please log in again.' });
    }

    return jsonResponse({ error: 'Admin route not found' }, 404);
};


// --- Main Fetch Handler ---

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    try {
      if (pathname.startsWith('/api/public/')) {
        return await handlePublicRoutes(request, env, pathname);
      }
      
      if (pathname.startsWith('/api/auth/')) {
        return await handleAuthRoutes(request, env, pathname);
      }
      
      if (pathname.startsWith('/api/admin/')) {
        return await handleAdminRoutes(request, env, pathname);
      }

      return jsonResponse({ error: 'Not Found' }, 404);

    } catch (error) {
      console.error('Error in worker:', error);
      return jsonResponse({ error: error.message }, 500);
    }
  },
};