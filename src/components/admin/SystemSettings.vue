<template>
  <div class="system-settings">
    <div class="settings-header">
      <h2>⚙️ 系统设置</h2>
      <p>管理导航站的系统配置</p>
    </div>


    <!-- 网站设置 -->
    <div class="settings-section">
      <h3>🌐 网站设置</h3>
      <div class="website-settings">
        <!-- 网站标题设置 -->
        <div class="setting-group">
          <label>网站标题:</label>
          <div class="title-input-group">
            <input
              v-model="websiteTitle"
              type="text"
              placeholder="请输入网站标题"
              class="title-input"
              maxlength="50"
            >
            <button
              @click="saveSettings"
              :disabled="titleSaving || !websiteTitle.trim()"
              class="save-title-btn"
            >
              {{ titleSaving ? '保存中...' : '💾 保存设置' }}
            </button>
          </div>
          <p class="setting-description">当前标题: {{ currentTitle || '未设置' }}</p>
        </div>

        <!-- 默认搜索引擎设置 -->
        <div class="setting-group">
          <label>默认搜索引擎:</label>
          <div class="search-engine-input-group">
            <select v-model="searchEngine" class="search-engine-select">
              <option
                v-for="option in searchEngineOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
            <button
              @click="saveSettings"
              :disabled="searchEngineSaving || searchEngine === currentSearchEngine"
              class="save-search-engine-btn"
            >
              {{ searchEngineSaving ? '保存中...' : '💾 保存设置' }}
            </button>
          </div>
          <p class="setting-description">当前搜索引擎: {{ searchEngineOptions.find(opt => opt.value === currentSearchEngine)?.label || '未设置' }}</p>
        </div>

      </div>
    </div>


    <!-- 安全设置 -->
    <div class="settings-section">
      <h3>🔒 安全设置</h3>
      <div class="security-settings">
        <div class="setting-group">
          <label>修改管理员密码:</label>
          <div class="password-form">
            <input
              v-model="passwordForm.currentPassword"
              type="password"
              placeholder="当前密码"
              class="form-input"
            >
            <input
              v-model="passwordForm.newPassword"
              type="password"
              placeholder="新密码"
              class="form-input"
            >
            <input
              v-model="passwordForm.confirmPassword"
              type="password"
              placeholder="确认新密码"
              class="form-input"
            >
            <button
              @click="handleChangePassword"
              :disabled="passwordSaving"
              class="save-password-btn"
            >
              {{ passwordSaving ? '更新中...' : '🔑 更新密码' }}
            </button>
          </div>
          <p class="setting-description">为了您的账户安全，建议定期修改密码。</p>
        </div>
      </div>
    </div>

    <!-- 系统信息 -->
    <div class="settings-section">
      <h3>ℹ️ 系统信息</h3>
      <div class="system-info">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Vue 版本:</span>
            <span class="info-value">{{ systemInfo.vueVersion }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">构建工具:</span>
            <span class="info-value">Vite</span>
          </div>
          <div class="info-item">
            <span class="info-label">部署时间:</span>
            <span class="info-value">{{ systemInfo.buildTime }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">浏览器:</span>
            <span class="info-value">{{ systemInfo.userAgent }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 自定义弹框 -->
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
import { ref, onMounted } from 'vue'
import CustomDialog from './CustomDialog.vue'
import { useD1API } from '../../apis/useD1API.js'

const { changePassword } = useD1API()

// 密码修改
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordSaving = ref(false)

// 环境变量配置
const envConfig = ref({
  adminPassword: '',
  githubToken: '',
  githubOwner: '',
  githubRepo: '',
  githubBranch: ''
})

// 系统信息
const systemInfo = ref({
  vueVersion: '',
  buildTime: '',
  userAgent: ''
})

// 网站设置
const websiteTitle = ref('')
const currentTitle = ref('')
const titleSaving = ref(false)

// 搜索引擎设置
const searchEngine = ref('bing')
const currentSearchEngine = ref('bing')
const searchEngineSaving = ref(false)

// 搜索引擎选项
const searchEngineOptions = [
  { value: 'google', label: 'Google' },
  { value: 'baidu', label: '百度' },
  { value: 'bing', label: 'Bing' },
  { value: 'duckduckgo', label: 'DuckDuckGo' }
]


// 自定义弹框状态
const dialogVisible = ref(false)
const dialogType = ref('success')
const dialogTitle = ref('')
const dialogMessage = ref('')
const dialogDetails = ref([])

// 显示弹框
const showDialog = (type, title, message, details = []) => {
  dialogType.value = type
  dialogTitle.value = title
  dialogMessage.value = message
  dialogDetails.value = details
  dialogVisible.value = true
}

// 关闭弹框
const closeDialog = () => {
  dialogVisible.value = false
}


// 检查环境变量配置
const checkEnvConfig = () => {
  envConfig.value = {
    adminPassword: import.meta.env.VITE_ADMIN_PASSWORD ? '***' : '',
    githubToken: import.meta.env.VITE_GITHUB_TOKEN ? '***' : '',
    githubOwner: import.meta.env.VITE_GITHUB_OWNER || '',
    githubRepo: import.meta.env.VITE_GITHUB_REPO || '',
    githubBranch: import.meta.env.VITE_GITHUB_BRANCH || ''
  }
}

// 获取系统信息
const getSystemInfo = () => {
  systemInfo.value = {
    vueVersion: '3.x',
    buildTime: new Date().toLocaleString('zh-CN'),
    userAgent: navigator.userAgent
  }
}

// 加载当前网站设置
const loadWebsiteSettings = async () => {
  try {
    const data = await loadCategoriesFromGitHub()
    currentTitle.value = data.title || '猫猫导航'
    websiteTitle.value = currentTitle.value

    // 加载搜索引擎设置
    currentSearchEngine.value = data.search || 'bing'
    searchEngine.value = currentSearchEngine.value
  } catch (error) {
    console.error('加载网站设置失败:', error)
    currentTitle.value = '猫猫导航'
    websiteTitle.value = '猫猫导航'
    currentSearchEngine.value = 'bing'
    searchEngine.value = 'bing'
  }
}

// 保存设置
const saveSettings = async () => {
  // This function is now a placeholder.
  // In a real scenario, it would call an API to update settings in the D1 database.
  showDialog(
    'success',
    '🎉 操作成功',
    '设置已在本地更新。请注意，此更改需要通过API与后端同步才能持久化。',
    []
  )
}



const handleChangePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    showDialog('error', '❌ 密码不匹配', '您输入的两次新密码不一致，请重新输入。')
    return
  }
  if (!passwordForm.value.currentPassword || !passwordForm.value.newPassword) {
    showDialog('error', '❌ 输入不完整', '请输入当前密码和新密码。')
    return
  }

  passwordSaving.value = true
  try {
    await changePassword(passwordForm.value.currentPassword, passwordForm.value.newPassword)
    showDialog(
      'success',
      '🎉 密码更新成功',
      '您的密码已成功更新。请在下次登录时使用新密码。',
      []
    )
    // 清空表单
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  } catch (error) {
    showDialog(
      'error',
      '❌ 更新失败',
      '密码更新过程中发生错误，请重试。',
      [`• 错误详情: ${error.message}`]
    )
  } finally {
    passwordSaving.value = false
  }
}

// 组件挂载时执行
onMounted(() => {
  checkEnvConfig()
  getSystemInfo()
})
</script>

<style scoped>
.system-settings {
  padding: 20px 0;
}

.settings-header {
  margin-bottom: 40px;
}

.settings-header h2 {
  color: #2c3e50;
  margin: 0 0 10px 0;
  font-size: 24px;
}

.settings-header p {
  color: #7f8c8d;
  margin: 0;
  font-size: 16px;
}

.settings-section {
  margin-bottom: 40px;
  padding: 25px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.settings-section h3 {
  color: #2c3e50;
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
}

/* GitHub状态样式 */
.github-status {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.github-status.connected {
  border-color: #27ae60;
  background: #f8fff9;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e74c3c;
  display: inline-block;
}

.status-dot.active {
  background: #27ae60;
}

.status-text {
  font-weight: 500;
  color: #2c3e50;
}

.repo-info p {
  margin: 5px 0;
  color: #7f8c8d;
  font-size: 14px;
}

.permission-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.permission-badge.success {
  background: #d4edda;
  color: #155724;
}

.permission-badge.warning {
  background: #fff3cd;
  color: #856404;
}

.error-info p {
  color: #e74c3c;
  font-size: 14px;
  margin: 5px 0;
}

.test-btn {
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.test-btn:hover:not(:disabled) {
  background: #2980b9;
}

.test-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

/* 环境变量配置样式 */
.env-config {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.config-item label {
  font-weight: 500;
  color: #2c3e50;
  flex: 1;
}

.config-value {
  display: flex;
  align-items: center;
  gap: 10px;
}

.value-set {
  color: #27ae60;
  font-weight: 500;
}

.value-missing {
  color: #e74c3c;
  font-weight: 500;
}

.value-display {
  color: #7f8c8d;
  font-family: monospace;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
}

/* 配置说明样式 */
.config-guide {
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.guide-step {
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
}

.guide-step:last-child {
  border-bottom: none;
}

.guide-step h4 {
  color: #2c3e50;
  margin: 0 0 15px 0;
  font-size: 16px;
}

.guide-step ol, .guide-step ul {
  margin: 10px 0 0 20px;
  color: #555;
}

.guide-step ol li, .guide-step ul li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.guide-step p {
  color: #555;
  line-height: 1.6;
  margin: 10px 0;
}

.guide-step a {
  color: #3498db;
  text-decoration: none;
}

.guide-step a:hover {
  text-decoration: underline;
}

.guide-step code {
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', monospace;
  color: #e74c3c;
  font-size: 13px;
}

.code-block {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 15px;
  margin: 15px 0;
  overflow-x: auto;
}

.code-block pre {
  margin: 0;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.4;
  color: #2c3e50;
}

/* 系统信息样式 */
.system-info {
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  padding: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.info-label {
  font-weight: 500;
  color: #2c3e50;
}

.info-value {
  color: #7f8c8d;
  font-family: monospace;
  font-size: 13px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 网站设置样式 */
.website-settings {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.setting-group label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 16px;
}

.setting-description {
  color: #7f8c8d;
  font-size: 13px;
  margin: 5px 0 0 0;
}

/* 标题设置样式 */
.title-input-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.title-input {
  flex: 1;
  padding: 10px 15px;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.title-input:focus {
  outline: none;
  border-color: #3498db;
}

.save-title-btn {
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.save-title-btn:hover:not(:disabled) {
  background: #2980b9;
}

.save-title-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

/* 搜索引擎设置样式 */
.search-engine-input-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-engine-select {
  flex: 1;
  padding: 10px 15px;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  background: white;
  cursor: pointer;
}

.search-engine-select:focus {
  outline: none;
  border-color: #3498db;
}

.save-search-engine-btn {
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.save-search-engine-btn:hover:not(:disabled) {
  background: #2980b9;
}

.save-search-engine-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

/* Logo设置样式 */
.logo-upload-area {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.logo-preview {
  width: 128px;
  height: 128px;
  border: 2px dashed #e9ecef;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  overflow: hidden;
}

.logo-preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.logo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #7f8c8d;
  text-align: center;
}

.logo-placeholder span {
  font-size: 32px;
  margin-bottom: 8px;
}

.logo-placeholder p {
  margin: 0;
  font-size: 13px;
}

.logo-upload-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.select-logo-btn, .save-logo-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.select-logo-btn {
  background: #95a5a6;
  color: white;
}

.select-logo-btn:hover {
  background: #7f8c8d;
}

.save-logo-btn {
  background: #27ae60;
  color: white;
}

.save-logo-btn:hover:not(:disabled) {
  background: #219a52;
}

.save-logo-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-width: 400px;
}

.form-input {
  padding: 10px 15px;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #3498db;
}

.save-password-btn {
  padding: 10px 20px;
  background: #e67e22;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  align-self: flex-start;
}

.save-password-btn:hover:not(:disabled) {
  background: #d35400;
}

.save-password-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .github-status {
    flex-direction: column;
    gap: 15px;
  }

  .config-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .info-value {
    max-width: none;
    word-break: break-all;
  }

  .title-input-group {
    flex-direction: column;
    align-items: stretch;
  }

  .search-engine-input-group {
    flex-direction: column;
    align-items: stretch;
  }

  .logo-upload-area {
    flex-direction: column;
    align-items: center;
  }

  .logo-upload-controls {
    align-items: center;
  }
}
</style>
