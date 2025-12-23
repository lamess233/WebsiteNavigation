<template>
  <div class="admin-container">
    <!-- 登录界面 -->
    <div v-if="!isLoggedIn" class="login-container">
      <div class="login-box">
        <h1>🔐 管理员登录</h1>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="username">用户名:</label>
            <input
              id="username"
              type="text"
              v-model="loginForm.username"
              placeholder="请输入用户名"
              required
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="password">密码:</label>
            <input
              id="password"
              type="password"
              v-model="loginForm.password"
              placeholder="请输入密码"
              required
              class="form-input"
            />
          </div>
          <button type="submit" class="login-btn" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </form>
        <div v-if="loginError" class="error-message">
          {{ loginError }}
        </div>
      </div>
    </div>

    <!-- 管理界面 -->
    <div v-else class="admin-dashboard">
      <header class="admin-header">
        <div class="header-content">
          <h1>🛠️ 导航站管理</h1>
          <div class="header-actions">
            <span class="user-info">管理员</span>
            <button @click="handleLogout" class="logout-btn">退出</button>
          </div>
        </div>
      </header>

      <main class="admin-main">
        <div v-if="loading" class="loading-overlay">
          <div class="loading-content">
            <div class="loading-spinner"></div>
            <p>正在加载数据...</p>
          </div>
        </div>

        <div v-else>
          <div class="admin-tabs">
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'categories' }"
              @click="activeTab = 'categories'"
            >
              📁 分类管理
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'sites' }"
              @click="activeTab = 'sites'"
            >
              🌐 站点管理
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'settings' }"
              @click="activeTab = 'settings'"
            >
              ⚙️ 系统设置
            </button>
          </div>

          <div v-if="activeTab === 'categories'" class="tab-content">
            <CategoryManager
              :categories="categories"
              @update="handleCategoriesUpdate"
              @save="saveAllData"
              :loading="saving"
            />
          </div>

          <div v-if="activeTab === 'sites'" class="tab-content">
            <SiteManager
              :categories="categories"
              @update="handleCategoriesUpdate"
              @save="saveAllData"
              :loading="saving"
            />
          </div>

          <div v-if="activeTab === 'settings'" class="tab-content">
            <SystemSettings
              :settings="settings"
              @save="saveAllData"
              :loading="saving"
            />
          </div>
        </div>
      </main>
    </div>

    <CustomDialog
      :visible="dialogVisible"
      :type="dialogType"
      :title="dialogTitle"
      :message="dialogMessage"
      :details="dialogDetails"
      @close="closeDialog"
      @confirm="closeDialog"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import CategoryManager from '../components/admin/CategoryManager.vue';
import SiteManager from '../components/admin/SiteManager.vue';
import SystemSettings from '../components/admin/SystemSettings.vue';
import CustomDialog from '../components/admin/CustomDialog.vue';
import { useD1API } from '../apis/useD1API.js';

const router = useRouter();
const d1api = useD1API();

// --- 状态管理 ---
const isLoggedIn = ref(d1api.isLoggedIn());
const loading = ref(false);
const saving = ref(false);
const activeTab = ref('categories');

// --- 登录 ---
const loginForm = reactive({ username: 'admin', password: '' });
const loginError = ref('');

// --- 数据 ---
const categories = ref([]);
const sites = ref([]);
const settings = ref({});

// --- 弹窗 ---
const dialogVisible = ref(false);
const dialogType = ref('success');
const dialogTitle = ref('');
const dialogMessage = ref('');
const dialogDetails = ref([]);

// --- 方法 ---

const showDialog = (type, title, message, details = []) => {
  dialogType.value = type;
  dialogTitle.value = title;
  dialogMessage.value = message;
  dialogDetails.value = details;
  dialogVisible.value = true;
};

const closeDialog = () => {
  dialogVisible.value = false;
};

const handleLogin = async () => {
  loading.value = true;
  loginError.value = '';
  try {
    await d1api.login(loginForm.username, loginForm.password);
    isLoggedIn.value = true;
    await loadAllData();
  } catch (error) {
    loginError.value = `登录失败: ${error.message}`;
  } finally {
    loading.value = false;
  }
};

const handleLogout = async () => {
  try {
    await d1api.logout();
  } catch (error) {
    console.error('登出失败:', error);
  } finally {
    isLoggedIn.value = false;
    router.push('/');
  }
};

const loadAllData = async () => {
  loading.value = true;
  try {
    const [cats, sts, sets] = await Promise.all([
      d1api.admin.getCategories(),
      d1api.admin.getSites(),
      d1api.admin.getSettings(),
    ]);

    // 将 sites 组合到 categories 中
    const sitesByCatId = sts.reduce((acc, site) => {
      if (!acc[site.category_id]) acc[site.category_id] = [];
      acc[site.category_id].push(site);
      return acc;
    }, {});

    categories.value = cats.map(cat => ({
      ...cat,
      sites: sitesByCatId[cat.id] || [],
    }));
    
    // 将 settings 数组转换为对象
    settings.value = sets.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
    }, {});

  } catch (error) {
    showDialog('error', '数据加载失败', error.message);
  } finally {
    loading.value = false;
  }
};

const handleCategoriesUpdate = (newCategories) => {
  categories.value = newCategories;
};

const saveAllData = async () => {
  saving.value = true;
  try {
    // 从 categories 中分离出 sites
    const updatedSites = categories.value.flatMap(cat => cat.sites);
    const updatedCategories = categories.value.map(({ sites, ...cat }) => cat);

    await Promise.all([
      d1api.admin.updateCategories(updatedCategories),
      // This is not efficient, a batch update would be better.
      // For simplicity, we update one by one.
      ...updatedSites.map(site => d1api.admin.updateSite(site)),
      d1api.admin.updateSettings(settings.value),
    ]);

    showDialog('success', '🎉 保存成功', '所有更改已实时生效！');
    await loadAllData(); // Reload data to confirm
  } catch (error) {
    showDialog('error', '❌ 保存失败', error.message);
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  if (isLoggedIn.value) {
    loadAllData();
  }
});
</script>

<style scoped>
/* 样式与原文件基本保持一致，此处省略以减少篇幅 */
/* The styles are mostly the same as the original file, omitted for brevity. */
.admin-container {
  min-height: 100vh;
  background: #f5f7fa;
}

/* 登录界面样式 */
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

.login-box {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.login-box h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #2c3e50;
  font-size: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e1e1;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #3498db;
}

.login-btn {
  width: 100%;
  padding: 12px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.login-btn:hover:not(:disabled) {
  background: #2980b9;
}

.login-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.error-message {
  margin-top: 15px;
  padding: 10px;
  background: #ffebee;
  color: #c62828;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
}

/* 管理界面样式 */
.admin-dashboard {
  min-height: 100vh;
}

.admin-header {
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.header-content h1 {
  color: #2c3e50;
  margin: 0;
  font-size: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info {
  color: #7f8c8d;
  font-size: 14px;
}

.logout-btn {
  padding: 8px 16px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.logout-btn:hover {
  background: #c0392b;
}

.admin-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.admin-tabs {
  display: flex;
  background: white;
  border-radius: 8px;
  padding: 5px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.tab-btn {
  flex: 1;
  padding: 12px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #7f8c8d;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.tab-btn.active {
  background: #3498db;
  color: white;
}

.tab-btn:hover:not(.active) {
  background: #f8f9fa;
  color: #2c3e50;
}

.tab-content {
  background: white;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}
</style>
