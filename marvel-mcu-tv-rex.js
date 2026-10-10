// Rex 模块：漫威宇宙（MCU）电视剧
// 基于 TMDB 的 Marvel Studios 公司筛选（ID: 420），自动获取 MCU 剧集。

WidgetMetadata = {
    id: "com.example.rex.marvel-mcu-tv",
    title: "漫威宇宙电视剧（MCU）",
    author: "zt001110",
    description: "按 MCU 电视剧系列和年份浏览，支持上映时间和评分排序",
    version: "1.0.0",
    requiredVersion: "0.0.1",
    site: "https://www.themoviedb.org/company/420-marvel-studios",
    globalParams: [],

    modules: [
        {
            title: "漫威宇宙电视剧",
            functionName: "loadMCUTV",
            type: "video",
            cacheDuration: 86400,
            params: [
                {
                    name: "series",
                    title: "选择系列",
                    type: "enumeration",
                    value: "all",
                    enumOptions: [
                        { title: "🌌 MCU 全部电视剧", value: "all" },
                        { title: "🦸 复仇者相关", value: "avengers" },
                        { title: "🦾 钢铁侠相关", value: "ironman" },
                        { title: "🛡️ 美国队长相关", value: "captain-america" },
                        { title: "⚡ 雷神相关", value: "thor" },
                        { title: "🕷️ 蜘蛛侠相关", value: "spiderman" },
                        { title: "✨ 其他 MCU 电视剧", value: "other" }
                    ]
                },
                {
                    name: "sortOrder",
                    title: "观看顺序",
                    type: "enumeration",
                    value: "asc",
                    enumOptions: [
                        { title: "首播时间（正序 1 → N）", value: "asc" },
                        { title: "首播时间（倒序 N → 1）", value: "desc" },
                        { title: "评分（高 → 低）", value: "rating" }
                    ]
                }
            ]
        }
    ]
};

const SERIES_RULES = {
    avengers: ["avengers", "复仇者联盟"],
    ironman: ["iron man", "钢铁侠"],
    "captain-america": ["captain america", "美国队长"],
    thor: ["thor", "雷神"],
    spiderman: ["spider-man", "spider man", "蜘蛛侠"]
};

function matchesSeries(item, series) {
    if (series === "all") return true;
    const text = `${item.name || ""} ${item.original_name || ""}`.toLowerCase();
    const rule = SERIES_RULES[series];
    if (series === "other") {
        return !Object.values(SERIES_RULES).flat().some(keyword => text.includes(keyword.toLowerCase()));
    }
    return Boolean(rule && rule.some(keyword => text.includes(keyword.toLowerCase())));
}

async function loadMCUTV(params = {}) {
    const series = params.series || "all";
    const sortOrder = params.sortOrder || "asc";

    try {
        const pages = await Promise.all([1, 2].map(page =>
            Widget.tmdb.get("/discover/tv", {
                params: {
                    language: "zh-CN",
                    with_companies: "420",
                    include_adult: false,
                    include_null_first_air_dates: false,
                    page
                }
            })
        ));

        const seen = {};
        let shows = pages.flatMap(data => Array.isArray(data?.results) ? data.results : [])
            .filter(item => {
                if (!item?.id || seen[item.id]) return false;
                seen[item.id] = true;
                return true;
            })
            .filter(item => matchesSeries(item, series));

        shows.sort((a, b) => {
            if (sortOrder === "rating") return Number(b.vote_average || 0) - Number(a.vote_average || 0);
            const dateA = a.first_air_date || "9999-12-31";
            const dateB = b.first_air_date || "9999-12-31";
            return sortOrder === "desc" ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
        });

        if (!shows.length) return [{ id: "mcu-tv-empty", type: "text", title: "这个分类暂时没有电视剧" }];

        return shows.map((item, index) => {
            const date = item.first_air_date || "未知日期";
            const rating = Number(item.vote_average || 0).toFixed(1);
            const title = item.name || item.original_name || "未命名剧集";
            return {
                id: String(item.id),
                tmdbId: Number(item.id),
                type: "tmdb",
                mediaType: "tv",
                title: `${index + 1}. ${title}`,
                description: `${date} · ⭐ ${rating}`,
                releaseDate: date,
                rating: Number(rating),
                posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
                backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : ""
            };
        });
    } catch (error) {
        return [{ id: "mcu-tv-error", type: "text", title: "MCU 电视剧数据加载失败", description: error?.message || String(error) }];
    }
}
