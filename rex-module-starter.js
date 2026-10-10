// Rex / ForwardWidget 模块最小模板
// 把这个文件复制一份，再替换下面的站点请求和解析逻辑。

var WidgetMetadata = {
  id: "com.example.rex.demo",
  title: "我的 Rex 模块",
  description: "示例：从一个站点加载影视列表",
  author: "你的名字",
  site: "https://example.com",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  detailCacheDuration: 3600,
  modules: [
    {
      id: "loadList",
      title: "影片列表",
      functionName: "loadList",
      cacheDuration: 3600,
      params: [
        {
          name: "keyword",
          title: "关键词",
          type: "input",
          value: "",
          description: "留空时加载默认列表"
        },
        {
          name: "page",
          title: "页码",
          type: "page",
          value: 1
        }
      ]
    }
  ],
  search: {
    title: "搜索",
    functionName: "search",
    params: [
      { name: "keyword", title: "关键词", type: "input" },
      { name: "page", title: "页码", type: "page", value: 1 }
    ]
  }
};

async function loadList(params = {}) {
  const keyword = String(params.keyword || "").trim();
  const page = Number(params.page || 1);
  // TODO: 替换为目标站点的真实 API 或网页地址。
  const url = `https://example.com/api/videos?keyword=${encodeURIComponent(keyword)}&page=${page}`;
  const response = await Widget.http.get(url, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  const data = typeof response.data === "string" ? JSON.parse(response.data) : response.data;

  // TODO: 按目标站点字段修改 data.items 的映射。
  return (data.items || []).map(item => ({
    id: String(item.id),
    type: "url",
    title: item.title,
    mediaType: item.mediaType === "tv" ? "tv" : "movie",
    coverUrl: item.cover,
    link: item.detailUrl
  }));
}

async function search(params = {}) {
  return loadList(params);
}

// 只有 type 为 url 的列表项才需要这个函数；它用于补充详情和播放地址。
async function loadDetail(link) {
  // TODO: 请求详情页/API，并返回与 VideoItem 结构一致的对象。
  return {
    id: String(link),
    type: "url",
    title: "待替换标题",
    mediaType: "movie",
    link,
    videoUrl: link
  };
}

