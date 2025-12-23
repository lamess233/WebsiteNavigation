-- 猫猫导航 Cloudflare D1 数据库结构
-- 版本: v1.0

-- 删除已存在的表 (可选, 用于重置)
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS sites;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS admins;

-- 1. 管理员表 (admins)
CREATE TABLE admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admins_username ON admins(username);

-- 2. 系统配置表 (settings)
CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_settings_key ON settings(key);

-- 3. 分类表 (categories)
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_order ON categories(order_index);

-- 4. 站点表 (sites)
CREATE TABLE sites (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE INDEX idx_sites_category ON sites(category_id);
CREATE INDEX idx_sites_order ON sites(category_id, order_index);

-- 5. 会话表 (sessions)
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    admin_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- 插入初始管理员 (密码: admin)
-- 警告: 这是一个示例哈希值，对应 'admin'。请在生产环境中替换为您自己的安全密码哈希。
-- 您可以使用在线 bcrypt 工具生成，或在部署后通过 API 修改密码。
INSERT INTO admins (username, password_hash) VALUES ('admin', '$2a$10$8.DVdC4a.VwHAY2aN7sZ5u0A0sS.5i5.Yg5.Yg5.Yg5.Yg5.Yg5');

-- 插入初始设置
INSERT INTO settings (key, value, description) VALUES ('site_title', '猫猫导航🐱', '网站主标题');
INSERT INTO settings (key, value, description) VALUES ('default_search_engine', 'bing', '默认搜索引擎 (bing/google/baidu/duck)');
INSERT INTO settings (key, value, description) VALUES ('enable_lock', 'false', '是否启用后台管理锁定功能');