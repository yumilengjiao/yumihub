const gameData = {
  absPath: "/home/yumi/gals/Air/Air.exe",
  // 模拟来自 Bangumi 的数据 (通常信息最全)
  bangumi: {
    total: 1,
    limit: 1,
    offset: 0,
    data: [
      {
        id: 33140,
        name: "STEINS;GATE",
        name_cn: "命运石之门",
        type: 4,
        date: new Date("2009-10-15"),
        platform: "PC / PS3 / Xbox 360",
        summary: "本作是5pb.与Nitroplus继《Chaos;Head》之后合作推出的“科学冒险系列”第二作。故事起始于2010年7月28日，自称狂气科学家的冈部伦太郎在秋叶原的广播会馆偶然见到了由于不明原因死在血泊中的天才少女牧濑红莉栖...",
        images: {
          small: "https://lain.bgm.tv/pic/cover/s/60/7d/33140_79p5I.jpg",
          grid: "https://lain.bgm.tv/pic/cover/g/60/7d/33140_79p5I.jpg",
          medium: "https://lain.bgm.tv/pic/cover/m/60/7d/33140_79p5I.jpg",
          common: "https://lain.bgm.tv/pic/cover/c/60/7d/33140_79p5I.jpg",
          large: "https://lain.bgm.tv/pic/cover/l/60/7d/33140_79p5I.jpg", // 展开后的高清大封面
        },
        image: "https://lain.bgm.tv/pic/cover/l/60/7d/33140_79p5I.jpg",
        nsfw: false,
        rating: {
          rank: 1,
          total: 8560,
          score: 9.1,
          count: { "10": 3500, "9": 3000 }
        },
        tags: [
          { name: "5pb", count: 1200 },
          { name: "剧情至上", count: 980 }
        ],
        infobox: [
          { key: "开发", value: "5pb. / Nitroplus" }
        ],
        collection: { on_hold: 200, dropped: 50, wish: 1500, collect: 8000, doing: 300 },
        eps: 1,
        total_episodes: 1,
        meta_tags: ["ADV", "科幻"],
        volumes: 0,
        series: false,
        locked: false
      }
    ]
  },

  // 模拟来自 VNDB 的数据 (适合补充评分和原始英文/日文标题)
  vndb: {
    more: false,
    results: [
      {
        id: "v2002",
        title: "Steins;Gate",
        alttitle: "シュタインズ・ゲート",
        average: 8.92,
        description: "Steins;Gate is a Japanese visual novel developed by 5pb. and Nitroplus. It is the second game in the Science Adventure series.",
        image: {
          url: "https://t.vndb.org/cv/19/77819.jpg"
        },
        languages: ["en", "ja", "zh"],
        platforms: ["win", "ps3", "ps4"],
        length: 4, // Long
        olang: "ja",
        titles: [
          { lang: "ja", title: "シュタインズ・ゲート" },
          { lang: "zh-Hans", title: "命运石之门" }
        ]
      }
    ]
  },

  // 月幕数据暂时留空
  ymgal: null
}

// 雷达图数据
const radarData = [{
  "tag": "fruity",
  "chardonay": 102,
},
{
  "tag": "bitter",
  "chardonay": 96,
},
{
  "tag": "heavy",
  "chardonay": 66,
},
{
  "tag": "strong",
  "chardonay": 67,
},
{
  "tag": "sunny",
  "chardonay": 29,
}
]


export { gameData, radarData }
