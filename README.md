# 2026 名古屋亞運 LoL 四人旅行控制台

這是一個可部署到 GitHub Pages 的靜態前端專案。頁面本身用 HTML/CSS/JavaScript，四人代墊資料透過 Firebase Firestore 即時同步，離線時先用 localStorage 暫存。

## 檔案結構

```text
index.html
sw.js
assets/
  css/styles.css
  js/app.js
  js/config.js
  js/firebase-sync.js
  js/settlement.js
  js/storage.js
```

舊版單檔 `nagoya-asian-games-2026.html` 保留作為備份，不是新版入口。

## 上傳 GitHub Pages

1. 將整個資料夾內容上傳到 GitHub repository。
2. GitHub Pages 設定來源為 repository root。
3. 入口檔是 `index.html`。

## Firebase 設定

已在 `assets/js/config.js` 放入 Firebase Web config。Firebase Console 需要保持：

- Authentication：Anonymous 已啟用。
- Firestore Database：已建立。
- Firestore Rules：只允許 `ASIA-GAME-2026` 旅程路徑。

建議規則：

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() {
      return request.auth != null;
    }

    function validTripId(tripId) {
      return tripId == "ASIA-GAME-2026";
    }

    match /trips/{tripId} {
      allow read, create, update: if signedIn() && validTripId(tripId);
      allow delete: if false;

      match /expenses/{expenseId} {
        allow read, create, update, delete: if signedIn() && validTripId(tripId);
      }

      match /pendingSync/{itemId} {
        allow read, create, update, delete: if signedIn() && validTripId(tripId);
      }

      match /settings/{settingId} {
        allow read, create, update: if signedIn() && validTripId(tripId);
        allow delete: if false;
      }

      match /members/{memberId} {
        allow read, create, update: if signedIn() && validTripId(tripId);
        allow delete: if false;
      }
    }
  }
}
```

## 已實作功能

- 亮/暗模式切換，偏好存在 localStorage。
- Google Maps 地點與每日路線連結。
- 日幣/台幣換算器。
- 四人預算估算器。
- Firebase 同步代墊結算器。
- 離線時先本地暫存，網路恢復後同步。
- 最少轉帳清單。
- 出國 checklist 與完成進度。
- 四人分工。
- 日文小抄。
- 緊急資訊卡。
- JSON 匯出/匯入備份。
- Service worker 快取主要檔案。

## 本地測試

可以用任何靜態伺服器開啟，例如：

```powershell
python -m http.server 8080
```

然後開：

```text
http://localhost:8080/
```

注意：Firebase 與 Service Worker 在 GitHub Pages HTTPS 環境會比較接近正式狀態；直接用 `file://` 開啟時，Service Worker 不會啟用。
