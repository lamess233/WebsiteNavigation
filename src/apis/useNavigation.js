import { ref } from 'vue';
import { useD1API } from './useD1API.js';

export function useNavigation() {
  const categories = ref([]);
  const title = ref('');
  const defaultSearchEngine = ref('bing');
  const loading = ref(false);
  const error = ref(null);
  const { getPublicData } = useD1API();

  const fetchCategories = async () => {
    loading.value = true;
    error.value = null;

    try {
      console.log('【D1模式】从API加载数据');
      const data = await getPublicData();
      
      categories.value = data.categories;
      title.value = data.title;
      
      const searchEngines = ['google', 'baidu', 'bing', 'duckduckgo'];
      if (data.search && searchEngines.includes(data.search)) {
        defaultSearchEngine.value = data.search;
      } else {
        defaultSearchEngine.value = 'bing';
      }
      
      document.title = title.value;

    } catch (err) {
      error.value = err.message;
      console.error('加载导航数据失败:', err);
      // 加载失败时可以设置一些提示信息
      title.value = '加载失败';
      categories.value = [];
    } finally {
      loading.value = false;
    }
  };

  return {
    categories,
    title,
    defaultSearchEngine,
    loading,
    error,
    fetchCategories
  };
}
