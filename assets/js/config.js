export const APP_CONFIG = {
  tripId: "ASIA-GAME-2026",
  tripLabel: "Asia Game 2026",
  matchDateIso: "2026-10-02T09:00:00+09:00",
  defaultRate: 0.21,
  members: ["肥肥", "膜膜", "陳信", "代碼A"],
  firebase: {
    apiKey: "AIzaSyAorYytAu9xf3jFvANjwIGxYf9JlIi_9mc",
    authDomain: "nagoya-asian-games-2026.firebaseapp.com",
    projectId: "nagoya-asian-games-2026",
    storageBucket: "nagoya-asian-games-2026.firebasestorage.app",
    messagingSenderId: "384257863004",
    appId: "1:384257863004:web:909c1bfb1e0047943ba599",
    measurementId: "G-546SBEGD01"
  },
  places: {
    nagoyaCastle: {
      label: "名古屋城",
      query: "Nagoya Castle, Nagoya, Japan"
    },
    atsuta: {
      label: "熱田神宮",
      query: "Atsuta Jingu, Nagoya, Japan"
    },
    osu: {
      label: "大須商店街",
      query: "Osu Shopping District, Nagoya, Japan"
    },
    sakae: {
      label: "榮 / Oasis 21",
      query: "Oasis 21, Sakae, Nagoya, Japan"
    },
    nagoyaStation: {
      label: "名古屋站",
      query: "Nagoya Station, Nagoya, Japan"
    },
    centrair: {
      label: "中部國際機場",
      query: "Chubu Centrair International Airport, Japan"
    },
    skyExpo: {
      label: "Aichi Sky Expo",
      query: "Aichi Sky Expo Hall D, Tokoname, Aichi, Japan"
    }
  },
  routes: {
    day1: ["Chubu Centrair International Airport", "Nagoya Station", "Sakae Nagoya"],
    day2: ["Nagoya Station", "Nagoya Castle", "Osu Shopping District", "Oasis 21 Nagoya"],
    day3: ["Nagoya Station", "Chubu Centrair International Airport", "Aichi Sky Expo"],
    lolDay: ["Nagoya Station", "Chubu Centrair International Airport", "Aichi Sky Expo Hall D"],
    day5: ["Nagoya Station", "Chubu Centrair International Airport"]
  },
  itinerary: [
    {
      id: "day1",
      day: "D1",
      title: "抵達名古屋，住進交通核心",
      subtitle: "台北至中部國際機場，名鐵進市區，晚上輕鬆吃名古屋飯",
      activities: [
        ["上午", "飛往 NGO 中部國際機場", "優先選直飛，減少轉機延誤與行李風險。", "plane"],
        ["下午", "名鐵進名古屋站或榮", "住名古屋站最穩，往機場、場館、購物都方便。", "train"],
        ["晚上", "味噌豬排、手羽先、台灣拉麵", "第一晚不排太硬，調整體力與網路。", "utensils"]
      ]
    },
    {
      id: "day2",
      day: "D2",
      title: "名古屋市區日，順便完成補給",
      subtitle: "名古屋城、熱田神宮、大須、榮與觀賽補貨",
      activities: [
        ["09:30", "名古屋城或熱田神宮", "安排一個主要景點即可，避免隔天觀賽疲累。", "landmark"],
        ["14:00", "大須商店街與榮商圈", "買行動電源、雨具、濕紙巾、喉糖。", "shopping-bag"],
        ["晚上", "確認票券、交通、天氣", "把場館地址、電子票、護照影本都離線保存。", "list-checks"]
      ]
    },
    {
      id: "day3",
      day: "D3",
      title: "電競暖身或 Aichi Sky Expo 場勘",
      subtitle: "熟悉名鐵到場館的動線，或看其他電競項目",
      activities: [
        ["上午", "名鐵搭到中部國際機場", "熟悉月台、車種、轉乘時間，隔天就不會慌。", "train"],
        ["中午", "確認 Aichi Sky Expo 入口", "場館與機場相鄰，正式入口仍以現場指示為準。", "map-pin"],
        ["下午", "看其他電競項目或回市區休息", "若隔天是 LoL，這天不要排遠距離行程。", "gamepad-2"]
      ]
    },
    {
      id: "lolDay",
      day: "D4",
      title: "英雄聯盟觀賽日",
      subtitle: "目標場次：2026/10/02 09:00 · ELS12",
      activities: [
        ["06:30", "早餐與出門", "09:00 開賽，建議提前 90 至 120 分鐘抵達。", "alarm-clock"],
        ["08:00", "Aichi Sky Expo Hall D 入場", "準備護照、電子票、行動電源、少量現金。", "ticket"],
        ["09:00", "League of Legends Elimination stage", "拍照錄影規範以現場公告為準。", "trophy"],
        ["賽後", "Centrair 或市區慶功", "若隔天回台，晚上不要排太晚。", "party-popper"]
      ]
    },
    {
      id: "day5",
      day: "D5",
      title: "返台或加碼名古屋近郊",
      subtitle: "視班機時間安排常滑、機場商店或最後採買",
      activities: [
        ["上午", "最後採買", "名古屋站、榮，或直接去 Centrair 免稅店。", "shopping-bag"],
        ["下午", "前往機場", "國際線建議預留 2.5 至 3 小時。", "plane"],
        ["晚上", "返回台灣", "回家整理照片、收據和最終結算。", "home"]
      ]
    }
  ],
  checklist: {
    購票: ["註冊應援 ID", "設定 6/30 16:30 提醒", "準備兩張信用卡", "保存 ELS12 場次資訊"],
    證件: ["護照效期確認", "護照影本離線保存", "訂房資料截圖", "電子票截圖"],
    行李: ["行動電源", "日本插頭/充電線", "摺疊傘或雨衣", "薄外套", "常備藥"],
    網路: ["eSIM 或 SIM", "Google Maps 離線資料", "翻譯 App", "Firebase 頁面先打開一次"],
    金錢: ["海外刷卡開啟", "準備日幣現金", "設定旅費預算", "確認保險電話"],
    觀賽日: ["電子票", "護照", "行動電源滿電", "提前 90 分鐘到場", "大型行李留飯店"],
    四人分工: ["票券：肥肥", "交通地圖：膜膜", "住宿餐廳：陳信", "預算記帳：代碼A"]
  },
  roles: [
    ["肥肥", "票券、行程總控、每日備份"],
    ["膜膜", "交通、地圖、觀賽日集合時間"],
    ["陳信", "住宿、餐廳、景點備案"],
    ["代碼A", "預算、記帳確認、收據提醒"]
  ],
  phrases: [
    ["請問 Aichi Sky Expo 在哪裡？", "Aichi Sky Expo はどこですか？", "Aichi Sky Expo wa doko desu ka?"],
    ["我要去中部國際機場。", "中部国際空港へ行きたいです。", "Chubu kokusai kuko e ikitai desu."],
    ["可以分開結帳嗎？", "別々に会計できますか？", "Betsu betsu ni kaikei dekimasu ka?"],
    ["請問可以刷卡嗎？", "クレジットカードは使えますか？", "Kurejitto kado wa tsukaemasu ka?"],
    ["我迷路了，可以幫忙嗎？", "道に迷いました。助けてもらえますか？", "Michi ni mayoimashita. Tasukete moraemasu ka?"],
    ["我需要去醫院。", "病院に行きたいです。", "Byoin ni ikitai desu."],
    ["請叫救護車。", "救急車を呼んでください。", "Kyukyusha o yonde kudasai."],
    ["我不會說日文。", "日本語が話せません。", "Nihongo ga hanasemasen."],
    ["請再說慢一點。", "もう少しゆっくり話してください。", "Mo sukoshi yukkuri hanashite kudasai."]
  ],
  budgetDefaults: [
    ["機票", 16000],
    ["住宿", 18000],
    ["LoL 門票", 2520],
    ["交通", 4500],
    ["餐費", 9000],
    ["購物", 10000],
    ["保險", 1200],
    ["備用金", 5000]
  ]
};

export function googleMapsSearchUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function googleMapsRouteUrl(stops) {
  const [origin, ...rest] = stops;
  const destination = rest.pop() || origin;
  const waypoints = rest.join("|");
  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: "transit"
  });
  if (waypoints) params.set("waypoints", waypoints);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
