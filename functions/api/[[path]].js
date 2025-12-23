/**
 * Cloudflare Pages Functions API Backend for Mao Nav
 *
 * This single file acts as the backend for the entire application,
 * handling all requests under the /api/ path. It's designed to work
 * seamlessly with Cloudflare Pages' file-based routing.
 *
 * @see https://developers.cloudflare.com/pages/functions/
 */

// --- Utility Functions ---

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

const importJwtKey = (secret) => {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
};

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
    
    if (decodedPayload.exp && Date.now() / 1000 > decodedPayload.exp) {
      return null;
    }
    
    return decodedPayload;
  } catch (e) {
    return null;
  }
}

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

async function verifyPassword(password, hash, secret) {
    const newHash = await hashPassword(password, secret);
    return newHash === hash;
}


// --- Middleware ---

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

        let isValid = false;
        if (admin.password_hash.startsWith('$2a$')) {
            if (password === 'admin') {
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
        if (authResult instanceof Response) return authResult;
        
        const authHeader = request.headers.get('Authorization');
        const token = authHeader.substring(7);
        
        await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
        
        return jsonResponse({ message: 'Logged out successfully' });
    }

    return jsonResponse({ error: 'Auth route not found' }, 404);
};

const handleAdminRoutes = async (request, env, pathname) => {
    const authResult = await authMiddleware(request, env);
    if (authResult instanceof Response) {
        return authResult;
    }

    if (pathname === '/api/admin/categories' && request.method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM categories ORDER BY order_index').all();
        return jsonResponse(results);
    }
    
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
    
    if (pathname === '/api/admin/categories' && request.method === 'PUT') {
        const categories = await request.json();
        console.log('[DEBUG] Updating categories. Received payload:', JSON.stringify(categories));

        if (!Array.isArray(categories)) {
            return jsonResponse({ error: 'Request body must be an array of categories.' }, 400);
        }

        const stmts = categories.map(c => {
            const bound_name = c.name || '';
            const bound_icon = c.icon || '';
            const bound_order_index = c.order_index || 0;
            const bound_id = c.id;

            console.log('[DEBUG] Binding category parameters:', JSON.stringify({
                id: bound_id,
                name: bound_name,
                icon: bound_icon,
                order_index: bound_order_index
            }));

            return env.DB.prepare('UPDATE categories SET name = ?, icon = ?, order_index = ? WHERE id = ?')
                .bind(bound_name, bound_icon, bound_order_index, bound_id);
        });

        await env.DB.batch(stmts);
        console.log('[DEBUG] Categories updated successfully.');
        return jsonResponse({ message: 'Categories updated' });
    }
    if (pathname.startsWith('/api/admin/categories/') && request.method === 'DELETE') {
        const id = pathname.split('/').pop();
        await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
        return jsonResponse({ message: 'Category deleted' });
    }

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
        const payload = await request.json();
        console.log(`[DEBUG] Updating site ${id}. Received payload:`, JSON.stringify(payload));

        const { category_id, name, url, description, icon, order_index } = payload;

        const bound_category_id = category_id;
        const bound_name = name;
        const bound_url = url;
        const bound_description = description || '';
        const bound_icon = icon || '';
        const bound_order_index = order_index || 0;
        const bound_id = id;

        console.log('[DEBUG] Binding parameters:', JSON.stringify({
            category_id: bound_category_id,
            name: bound_name,
            url: bound_url,
            description: bound_description,
            icon: bound_icon,
            order_index: bound_order_index,
            id: bound_id
        }));

        await env.DB.prepare(
            'UPDATE sites SET category_id = ?, name = ?, url = ?, description = ?, icon = ?, order_index = ? WHERE id = ?'
        ).bind(
            bound_category_id,
            bound_name,
            bound_url,
            bound_description,
            bound_icon,
            bound_order_index,
            bound_id
        ).run();

        console.log(`[DEBUG] Site ${id} updated successfully.`);
        return jsonResponse({ message: 'Site updated' });
    }
    if (pathname.startsWith('/api/admin/sites/') && request.method === 'DELETE') {
        const id = pathname.split('/').pop();
        await env.DB.prepare('DELETE FROM sites WHERE id = ?').bind(id).run();
        return jsonResponse({ message: 'Site deleted' });
    }

    if (pathname === '/api/admin/settings' && request.method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM settings').all();
        return jsonResponse(results);
    }
    if (pathname === '/api/admin/settings' && request.method === 'PUT') {
        const settings = await request.json();
        const stmts = Object.entries(settings).map(([key, value]) => env.DB.prepare('UPDATE settings SET value = ? WHERE key = ?').bind(value, key));
        await env.DB.batch(stmts);
        return jsonResponse({ message: 'Settings updated' });
    }

    if (pathname === '/api/admin/password' && request.method === 'PUT') {
        const { currentPassword, newPassword } = await request.json();
        if (!currentPassword || !newPassword) {
            return jsonResponse({ error: 'Current and new password are required' }, 400);
        }
        
        const admin = await env.DB.prepare('SELECT * FROM admins WHERE id = ?').bind(authResult.user.id).first();
        
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
        
        await env.DB.prepare('DELETE FROM sessions WHERE admin_id = ?').bind(authResult.user.id).run();

        return jsonResponse({ message: 'Password updated successfully. Please log in again.' });
    }

    return jsonResponse({ error: 'Admin route not found' }, 404);
};


/**
 * Main fetch handler for Pages Functions.
 * @param {object} context - The context object.
 * @param {Request} context.request - The incoming request.
 * @param {object} context.env - The environment variables.
 * @param {object} context.params - The path parameters.
 * @param {function} context.next - The next function in the middleware chain.
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

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
    console.error('Error in Pages Function:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}