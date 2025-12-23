-- 猫猫导航数据迁移脚本
-- 从 src/mock/mock_data.js 生成

-- 清空现有数据 (执行前请确认，以防数据丢失)
DELETE FROM sites;
DELETE FROM categories;

-- 插入分类数据
INSERT INTO categories (id, name, icon, order_index) VALUES ('my-favorites', '我的常用', '💥', 0);
INSERT INTO categories (id, name, icon, order_index) VALUES ('ai-tools', 'AI智能', '🤖', 1);
INSERT INTO categories (id, name, icon, order_index) VALUES ('cloud', '云服务', '☁️', 2);
INSERT INTO categories (id, name, icon, order_index) VALUES ('dev-tools', '开发工具', '🛠️', 3);
INSERT INTO categories (id, name, icon, order_index) VALUES ('community', '社区论坛', '👥', 6);
INSERT INTO categories (id, name, icon, order_index) VALUES ('design', '设计工具', '🎨', 4);
INSERT INTO categories (id, name, icon, order_index) VALUES ('finance', '财经投资', '💰', 5);
INSERT INTO categories (id, name, icon, order_index) VALUES ('learning', '学习资源', '📚', 6);
INSERT INTO categories (id, name, icon, order_index) VALUES ('tools', '在线工具', '⚙️', 7);
INSERT INTO categories (id, name, icon, order_index) VALUES ('entertainment', '娱乐休闲', '🎮', 8);
INSERT INTO categories (id, name, icon, order_index) VALUES ('office', '办公协作', '💼', 9);

-- 插入站点数据
-- 分类: my-favorites
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('site-1752649007053', 'my-favorites', 'BeJson', 'https://www.bejson.com/', '工具大全', '/sitelogo/www.bejson.com.ico', 0);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('linux-do', 'my-favorites', 'Linux.do', 'https://linux.do', 'Linux技术社区，Peace and Love', '/sitelogo/linux.do.ico', 1);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('site-1752857783656', 'my-favorites', 'OpenAI', 'https://chatgpt.com', 'OpenAI,好用👌', '/sitelogo/chatgpt.com.ico', 2);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('github', 'my-favorites', 'GitHub', 'https://github.com', '代码托管平台', '/sitelogo/github.com.ico', 3);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('curlconverter', 'my-favorites', 'curl converter', 'https://curlconverter.com/', 'curl命令转换工具', '/sitelogo/curlconverter.com.ico', 4);

-- 分类: ai-tools
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('chatgpt', 'ai-tools', 'ChatGPT', 'https://chat.openai.com', 'OpenAI对话AI助手', '/sitelogo/chat.openai.com.ico', 0);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('claude', 'ai-tools', 'Claude', 'https://claude.ai', 'Anthropic AI助手', '/sitelogo/claude.ai.ico', 1);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('midjourney', 'ai-tools', 'Midjourney', 'https://www.midjourney.com', 'AI图像生成工具', '/sitelogo/www.midjourney.com.ico', 2);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('copilot', 'ai-tools', 'GitHub Copilot', 'https://github.com/features/copilot', 'AI代码助手', '/sitelogo/github.com.ico', 3);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('cursor', 'ai-tools', 'Cursor', 'https://cursor.sh', 'AI代码编辑器', '/sitelogo/cursor.sh.ico', 4);

-- 分类: cloud
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('cloudflare', 'cloud', 'Cloudflare', 'https://www.cloudflare.com', '全球CDN和网络安全服务', '/sitelogo/www.cloudflare.com.ico', 0);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('vercel', 'cloud', 'Vercel', 'https://vercel.com', '前端部署平台', '/sitelogo/vercel.com.ico', 1);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('aws', 'cloud', 'AWS', 'https://aws.amazon.com', '亚马逊云服务', '/sitelogo/aws.amazon.com.ico', 2);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('aliyun', 'cloud', '阿里云', 'https://www.aliyun.com', '阿里巴巴云计算', '/sitelogo/www.aliyun.com.ico', 3);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('tencent-cloud', 'cloud', '腾讯云', 'https://cloud.tencent.com', '腾讯云计算服务', '/sitelogo/cloud.tencent.com.ico', 4);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('huawei-cloud', 'cloud', '华为云', 'https://www.huaweicloud.com', '华为云计算服务', '/sitelogo/www.huaweicloud.com.ico', 5);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('site-1752644060499', 'cloud', '怕死云', 'https://www.pasyun.com/', 'ipv6机器', '/sitelogo/www.pasyun.com.ico', 6);

-- 分类: dev-tools
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('github-devtools', 'dev-tools', 'GitHub', 'https://github.com', '代码托管平台', '/sitelogo/github.com.ico', 0);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('vscode', 'dev-tools', 'VS Code', 'https://code.visualstudio.com', '代码编辑器', '/sitelogo/code.visualstudio.com.ico', 1);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('webstorm', 'dev-tools', 'WebStorm', 'https://www.jetbrains.com/webstorm/', '专业前端IDE', '/sitelogo/www.jetbrains.com.ico', 2);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('postman', 'dev-tools', 'Postman', 'https://www.postman.com', 'API测试工具', '/sitelogo/www.postman.com.ico', 3);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('android-studio', 'dev-tools', 'Android Studio', 'https://developer.android.com/studio', 'Android官方开发工具', '/sitelogo/developer.android.com.ico', 4);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('oracle-java', 'dev-tools', 'Oracle Java', 'https://www.oracle.com/java/technologies/downloads/', 'Oracle官方Java下载', '/sitelogo/www.oracle.com.ico', 5);

-- 分类: community
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('stackoverflow', 'community', 'Stack Overflow', 'https://stackoverflow.com', '程序员问答社区', '/sitelogo/stackoverflow.com.ico', 0);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('linuxdo', 'community', 'Linux.do', 'https://linux.do', 'Linux与开源技术社区', '/sitelogo/linux.do.ico', 1);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('nodeseek', 'community', 'NodeSeek', 'https://www.nodeseek.com', '极客技术社区', '/sitelogo/www.nodeseek.com.ico', 2);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('v2ex', 'community', 'V2EX', 'https://www.v2ex.com', '创意工作者社区', '/sitelogo/www.v2ex.com.ico', 3);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('52pojie', 'community', '吾爱破解', 'https://www.52pojie.cn/', '软件安全与破解技术论坛', '/sitelogo/www.52pojie.cn.ico', 4);

-- 分类: design
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('figma', 'design', 'Figma', 'https://figma.com', 'UI设计工具', '/sitelogo/figma.com.ico', 0);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('sketch', 'design', 'Sketch', 'https://www.sketch.com', '界面设计工具', '/sitelogo/www.sketch.com.ico', 1);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('canva', 'design', 'Canva', 'https://www.canva.com', '在线设计平台', '/sitelogo/www.canva.com.ico', 2);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('adobe-xd', 'design', 'Adobe XD', 'https://www.adobe.com/products/xd.html', '用户体验设计工具', '/sitelogo/www.adobe.com.ico', 3);

-- 分类: finance
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('binance', 'finance', '币安', 'https://www.binance.com', '加密货币交易平台', '/sitelogo/www.binance.com.ico', 0);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('okx', 'finance', 'OKX', 'https://www.okx.com', '数字资产交易服务平台', '/sitelogo/www.okx.com.ico', 1);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('bitget', 'finance', 'Bitget', 'https://www.bitget.com', '全球化数字资产交易服务商', '/sitelogo/www.bitget.com.ico', 2);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('tradingview', 'finance', 'TradingView', 'https://cn.tradingview.com', '专业金融图表和交易平台', '/sitelogo/cn.tradingview.com.ico', 3);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('tonghuashun', 'finance', '同花顺', 'https://www.10jqka.com.cn', '专业股票软件及金融信息服务', '/sitelogo/www.10jqka.com.cn.ico', 4);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('xueqiu', 'finance', '雪球', 'https://xueqiu.com', '聪明的投资者都在这里', '/sitelogo/xueqiu.com.ico', 5);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('coinbase', 'finance', 'Coinbase', 'https://www.coinbase.com', '美国合规加密货币交易平台', '/sitelogo/www.coinbase.com.ico', 6);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('futu', 'finance', '富途牛牛', 'https://www.futunn.com', '港美股交易软件', '/sitelogo/www.futunn.com.ico', 7);

-- 分类: learning
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('mdn', 'learning', 'MDN Web Docs', 'https://developer.mozilla.org', 'Web开发权威文档', '/sitelogo/developer.mozilla.org.ico', 0);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('w3school', 'learning', 'W3Schools', 'https://www.w3schools.com', 'Web技术教程', '/sitelogo/www.w3schools.com.ico', 1);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('runoob', 'learning', '菜鸟教程', 'https://www.runoob.com', '编程技术教程', '/sitelogo/www.runoob.com.ico', 2);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('coursera', 'learning', 'Coursera', 'https://www.coursera.org', '在线课程平台', '/sitelogo/www.coursera.org.ico', 3);

-- 分类: tools
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('json-formatter', 'tools', 'JSON Formatter', 'https://jsonformatter.org', 'JSON格式化工具', '/sitelogo/jsonformatter.org.ico', 0);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('regex101', 'tools', 'Regex101', 'https://regex101.com', '正则表达式测试', '/sitelogo/regex101.com.ico', 1);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('caniuse', 'tools', 'Can I Use', 'https://caniuse.com', '浏览器兼容性查询', '/sitelogo/caniuse.com.ico', 2);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('tinypng', 'tools', 'TinyPNG', 'https://tinypng.com', '图片压缩工具', '/sitelogo/tinypng.com.ico', 3);

-- 分类: entertainment
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('bilibili', 'entertainment', '哔哩哔哩', 'https://www.bilibili.com', '弹幕视频网站', '/sitelogo/www.bilibili.com.ico', 0);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('youtube', 'entertainment', 'YouTube', 'https://www.youtube.com', '视频分享平台', '/sitelogo/www.youtube.com.ico', 1);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('douban', 'entertainment', '豆瓣', 'https://www.douban.com', '文艺生活社区', '/sitelogo/www.douban.com.ico', 2);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('zhihu', 'entertainment', '知乎', 'https://www.zhihu.com', '知识问答社区', 'data:image/svg+xml,%3Csvg xmlns=''http://www.w3.org/2000/svg'' viewBox=''0 0 16 16'' fill=''black''%3E%3Cpath d=''M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.11 0 0 .67-.21 2.2.82A7.65 7.65 0 018 4.58c.68.003 1.36.092 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.91.08 2.11.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z''/%3E%3C/svg%3E', 3);

-- 分类: office
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('notion', 'office', 'Notion', 'https://www.notion.so', '全能工作空间', '/sitelogo/www.notion.so.ico', 0);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('slack', 'office', 'Slack', 'https://slack.com', '团队协作工具', '/sitelogo/slack.com.ico', 1);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('trello', 'office', 'Trello', 'https://trello.com', '项目管理工具', '/sitelogo/trello.com.ico', 2);
INSERT INTO sites (id, category_id, name, url, description, icon, order_index) VALUES ('feishu', 'office', '飞书', 'https://www.feishu.cn', '企业协作平台', '/sitelogo/www.feishu.cn.ico', 3);

-- 更新网站标题
UPDATE settings SET value = '猫猫导航🐱' WHERE key = 'site_title';