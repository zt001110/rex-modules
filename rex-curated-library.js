// Rex 自定义片单模块：手工维护分类和片目，TMDB 自动补全详情。
// 把 tmdbId 改成真实 TMDB ID；电影用 movie.xxx，剧集用 tv.xxx。

const LIBRARY = [
  {
    id: "must-watch",
    title: "必看电影",
    items: [
      { id: "movie.550", title: "搏击俱乐部", mediaType: "movie" },
      { id: "movie.238", title: "教父", mediaType: "movie" }
    ]
  },
  {
    id: "series",
    title: "精选剧集",
    items: [
      { id: "tv.1399", title: "权力的游戏", mediaType: "tv" }
    ]
  }
];

var WidgetMetadata = {
  id: "com.example.rex.curated-library",
  title: "我的私人片单",
  description: "自定义分类、命名和排序的电影与剧集片单",
  author: "你的名字",
  site: "https://www.themoviedb.org",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  detailCacheDuration: 86400,
  modules: [
    {
      id: "loadCategory",
      title: "片单分类",
      functionName: "loadCategory",
      sectionMode: true,
      cacheDuration: 86400,
      params: [
        {
          name: "category",
          title: "分类",
          type: "enumeration",
          value: "must-watch",
          enumOptions: LIBRARY.map(group => ({
            title: group.title,
            value: group.id
          }))
        }
      ]
    }
  ]
};

async function loadCategory(params = {}) {
  const category = params.category || LIBRARY[0].id;
  const group = LIBRARY.find(item => item.id === category) || LIBRARY[0];

  return group.items.map(item => ({
    // 对 tmdb 类型，Rex 会用这个 ID 自动补全海报、简介、演员、评分和剧集详情。
    id: item.id,
    type: "tmdb",
    title: item.title,
    mediaType: item.mediaType
  }));
}

