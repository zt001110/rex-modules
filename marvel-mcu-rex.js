// Rex 模块：漫威电影宇宙（MCU）系列
// 基于 TMDB 的 Marvel Studios 公司筛选（ID: 420），自动获取 MCU 电影。

WidgetMetadata = {
    id: "com.example.rex.marvel-mcu",
    title: "漫威电影",
    author: "桃子🍑",
    description: "漫威电影合集，支持 MCU 系列分类、上映时间和评分排序",
    version: "1.0.2",
    requiredVersion: "0.0.1",
    site: "https://www.themoviedb.org/company/420-marvel-studios",
    globalParams: [],

    modules: [
        {
            title: "漫威电影",
            functionName: "loadMCU",
            type: "video",
            cacheDuration: 86400,
            params: [
                {
                    name: "series",
                    title: "选择系列",
                    type: "enumeration",
                    value: "all",
                    enumOptions: [
                        { title: "🌌 MCU 全部系列", value: "all" },
                        { title: "🦸 复仇者联盟", value: "avengers" },
                        { title: "🦾 钢铁侠", value: "ironman" },
                        { title: "🛡️ 美国队长", value: "captain-america" },
                        { title: "⚡ 雷神", value: "thor" },
                        { title: "🌌 银河护卫队", value: "guardians" },
                        { title: "🐜 蚁人", value: "antman" },
                        { title: "🕷️ 蜘蛛侠（MCU）", value: "spiderman" },
                        { title: "🌀 奇异博士", value: "doctor-strange" },
                        { title: "🐆 黑豹", value: "black-panther" },
                        { title: "⭐ 惊奇队长", value: "captain-marvel" },
                        { title: "✨ 其他 MCU 电影", value: "other" }
                    ]
                },
                {
                    name: "phase",
                    title: "选择分类",
                    type: "enumeration",
                    value: "all",
                    enumOptions: [
                        { title: "🦸 MCU 全部电影", value: "all" },
                        { title: "1️⃣ 早期作品（2008–2012）", value: "phase1" },
                        { title: "2️⃣ 中期作品（2013–2015）", value: "phase2" },
                        { title: "3️⃣ 无限传奇后期（2016–2019）", value: "phase3" },
                        { title: "4️⃣ 多元宇宙前期（2021–2022）", value: "phase4" },
                        { title: "5️⃣ 多元宇宙后期（2023–2025）", value: "phase5" }
                    ]
                },
                {
                    name: "sortOrder",
                    title: "观看顺序",
                    type: "enumeration",
                    value: "asc",
                    enumOptions: [
                        { title: "上映时间（正序 1 → N）", value: "asc" },
                        { title: "上映时间（倒序 N → 1）", value: "desc" },
                        { title: "评分（高 → 低）", value: "rating" }
                    ]
                }
            ]
        }
    ]
};

const PHASE_RANGES = {
    phase1: [2008, 2012],
    phase2: [2013, 2015],
    phase3: [2016, 2019],
    phase4: [2021, 2022],
    phase5: [2023, 2025]
};

const SERIES_RULES = {
    avengers: ["avengers", "复仇者联盟"],
    ironman: ["iron man", "钢铁侠"],
    "captain-america": ["captain america", "美国队长"],
    thor: ["thor", "雷神"],
    guardians: ["guardians of the galaxy", "银河护卫队"],
    antman: ["ant-man", "ant man", "蚁人"],
    spiderman: ["spider-man", "spider man", "蜘蛛侠"],
    "doctor-strange": ["doctor strange", "奇异博士"],
    "black-panther": ["black panther", "黑豹"],
    "captain-marvel": ["captain marvel", "the marvels", "惊奇队长"]
};

function matchesSeries(item, series) {
    if (series === "all") return true;
    const text = `${item.title || ""} ${item.original_title || ""}`.toLowerCase();
    const rule = SERIES_RULES[series];
    if (series === "other") {
        return !Object.values(SERIES_RULES).flat().some(keyword =>
            text.includes(keyword.toLowerCase())
        );
    }
    return Boolean(rule && rule.some(keyword => text.includes(keyword.toLowerCase())));
}

async function loadMCU(params = {}) {
    const phase = params.phase || "all";
    const series = params.series || "all";
    const sortOrder = params.sortOrder || "asc";

    try {
        // 86311 实际是“复仇者联盟”合集，并不包含完整 MCU。
        // Marvel Studios 的 TMDB 公司 ID 是 420，使用 discover 才能取得完整电影列表。
        const pages = await Promise.all([1, 2, 3].map(page =>
            Widget.tmdb.get("/discover/movie", {
                params: {
                    language: "zh-CN",
                    with_companies: "420",
                    include_adult: false,
                    include_video: false,
                    page
                }
            })
        ));

        const seen = {};
        let movies = pages.flatMap(data => Array.isArray(data?.results) ? data.results : [])
            .filter(item => {
                if (!item?.id || seen[item.id]) return false;
                seen[item.id] = true;
                return true;
            });
        const range = PHASE_RANGES[phase];

        if (range) {
            movies = movies.filter(item => {
                const year = Number(String(item.release_date || "").slice(0, 4));
                return year >= range[0] && year <= range[1];
            });
        }

        movies = movies.filter(item => matchesSeries(item, series));

        movies.sort((a, b) => {
            if (sortOrder === "rating") {
                return Number(b.vote_average || 0) - Number(a.vote_average || 0);
            }
            const dateA = a.release_date || "9999-12-31";
            const dateB = b.release_date || "9999-12-31";
            return sortOrder === "desc"
                ? dateB.localeCompare(dateA)
                : dateA.localeCompare(dateB);
        });

        if (!movies.length) {
            return [{
                id: "mcu-empty",
                type: "text",
                title: "这个分类暂时没有影片"
            }];
        }

        return movies.map((item, index) => {
            const date = item.release_date || "未知日期";
            const rating = Number(item.vote_average || 0).toFixed(1);
            const title = item.title || item.original_title || "未命名影片";

            return {
                id: String(item.id),
                tmdbId: Number(item.id),
                type: "tmdb",
                mediaType: "movie",
                title: `${index + 1}. ${title}`,
                description: `${date} · ⭐ ${rating}`,
                releaseDate: date,
                rating: Number(rating),
                posterPath: item.poster_path
                    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                    : "",
                backdropPath: item.backdrop_path
                    ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
                    : ""
            };
        });
    } catch (error) {
        return [{
            id: "mcu-error",
            type: "text",
            title: "MCU 数据加载失败",
            description: error?.message || String(error)
        }];
    }
}

