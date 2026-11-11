# UNIT-01 生日特別篇

通用的 EVA 標題卡風格生日網站模板。繁體粗宋字形、初號機紫色與螢光綠、深圳夜景、倒數、煙花與未來來信。

進入放映後，年齡粒子會在數個位置依序成形，再匯聚成目前連結設定的收件人姓名，停留後向外消散，短暫停頓後自動重播整段粒子動畫。音樂與歌詞會繼續播放，不隨動畫循環重新開始。手機與全螢幕會使用對應的留白區域，切換尺寸時重新排布。

開場和放映後都保留「第貳拾年／生／日、快樂」的同一組字形，避免播放後切換成一般網頁標題。

## 製作專屬祝福

點右上角「製作一份祝福」，填寫姓名與年齡。姓名只存在 URL 的 `#` 片段中，由瀏覽器讀取，不會寫入本倉庫。

姓名透過 `textContent` 顯示，最多 24 字；年齡支援 1 到 120。預設顯示「親愛的你」。輸入的姓名會以 OpenCC 轉為繁體；匯入的歌曲和歌詞保留原文。

## 音樂與歌詞

點「音樂與歌詞」：

1. 匯入 MP3、M4A 等瀏覽器可播放的音訊，或填入 HTTPS 音訊直鏈。
2. 匯入帶時間軸的 LRC 即可同步顯示，支援多重時間標記、毫秒和 offset。
3. 只有普通歌詞時，每句一行貼入文字框，點「從頭打點」。歌曲播放到每句開頭時點「記錄下一句」。打點後可回放驗證，或下載 LRC。
4. 放映時顯示上一句、目前句、下一句，暫停和拖動播放進度時都會同步更新。

音訊直鏈必須指向實際音檔，不是音樂平台的分享頁。歌詞直鏈需允許瀏覽器跨站讀取；無法讀取時可改用 LRC 檔案或貼入歌詞。

### 保留開場進入按鈕

頁面停留在開場標題卡，保留「啟動生日特別篇」按鈕；點擊後才進入倒數和放映。開啟頁面時會嘗試播放已設定的音樂。Chrome、Safari 等瀏覽器可能攔截未經互動的有聲自動播放；這時由訪客點「啟動生日特別篇」，同時啟動音樂與放映。網站不繞過瀏覽器的聲音設定。

通用模板沒有內建歌曲，也不使用合成音冒充匯入的音樂。

### 把完整歌曲裝進分享版本

本機選檔僅供目前頁面試聽，不會自動上傳或跟著連結送給朋友。

點「匯出含音樂的分享包」會產生 `birthday-share.zip`，包含網站、音檔、歌詞和 `media.json`。解壓後直接發布整個資料夾，朋友不需要再選檔。

只有你匯出的分享包會包含匯入歌曲。本通用倉庫不自動接收歌曲、歌詞或收件人資料。重新整理前，請先匯出分享包或下載 LRC 保存；本機選檔不會持久化。

若音訊直鏈允許播放但禁止跨站下載，分享包無法讀取該音檔，請改匯入本機音檔再匯出。

## 專屬背影照片

`media.json` 可指定 `photo`，例如 `assets/portrait.jpg`。專屬照片只放在發布包，不需提交通用倉庫。照片以 cover 鋪滿整個放映視口，不再分成深色文字區與圖片區。標題、歌詞與粒子直接疊在同一張照片上，只用輕微暗角與文字陰影維持可讀性；手機另行安排裁切位置，粒子限制在背影上方的天空。匯出分享包會保留已載入的專屬照片。未設定照片時沿用預設深圳背景。

## 全螢幕

點右上角全螢幕按鈕，或在非輸入狀態按 F。Esc 或按鈕退出。瀏覽器不支援 Fullscreen API 時切換為滿版視口，頁面會明確提示，不冒充原生全螢幕。

## 部署

靜態檔案全部在 `docs/`，無建置步驟。第三方字庫轉換與 ZIP 元件都已本地化。

GitHub Pages 可以選模板分支的 `/docs`；也可以直接把 `docs/` 的內容發布至其他靜態托管服務。使用自己的中性網址或其他托管服務，可避免網址顯示 GitHub 帳號名。

`media.json` 支援：

```json
{"audio":"assets/soundtrack.mp3","lyrics":"assets/soundtrack.lrc","title":"你的曲名"}
```

空值表示不預載。`#name=收件人&age=20&music=HTTPS音訊直鏈&lyrics=HTTPS歌詞直鏈&title=曲名` 可覆寫相應設定。連結持有人可以讀到片段中的姓名與媒體網址。

本地預覽可在 `docs/` 執行 `python -m http.server 8080`。

## 創意與素材

互動概念參考 [ayusharma/birthday](https://github.com/ayusharma/birthday) 的分步揭曉與 [Martarion-Code 倒數煙花](https://github.com/Martarion-Code/Countdown-Birthday-and-Fireworks-Animation)，沒有複製其程式碼。

城市照片：Sparktour，*Civic Center, Shenzhen Lianhuashan Park (2018.9) Night*，[原圖](https://commons.wikimedia.org/wiki/File:Civic_Center,_Shenzhen_Lianhuashan_Park_(2018.9)_Night.jpg)，[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)。圖片未改動，僅在 CSS 顯示時調色。

Noto Serif TC Heavy 字體與衍生 SVG 輪廓：SIL OFL 1.1，見 `docs/assets/FONT-LICENSE.txt`。

OpenCC-JS 1.0.5：MIT，見 `docs/vendor/OPENCC-LICENSE.txt`。JSZip 3.10.1：MIT/GPLv3 雙重授權，本模板以 MIT 授權使用，見 `docs/vendor/JSZIP-LICENSE.txt`。

原創程式碼採 MIT 授權。照片、字體與第三方元件各保留原授權。同人視覺模板，與相關動畫權利人無隸屬關係。
