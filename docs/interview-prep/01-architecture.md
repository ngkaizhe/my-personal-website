# 面試導向架構導讀 — my-personal-website

> 目標:當面試官問「講講你這個 side project」時,你能在白板上畫出架構、
> 為每個決策辯護、並講出真實踩過的坑。每一節的結構:**架構 → 為什麼
> (含被捨棄的方案)→ 戰爭故事 → 面試官可能追問**。

## 0. 一句話介紹(電梯版)

「多使用者的工作日誌 + 履歷產生器:使用者每天用 AI 快速記錄工作成果,
系統累積成公開時間軸,一鍵產生雙語履歷 PDF,並支援綁定自己的網域。
Next.js 16 全端、PostgreSQL、部署在 Vercel serverless。」

30 秒版加一句:「架構上最有趣的是自訂網域系統——一個 DB-free 的
edge proxy 做 host 分流,把路由決策下放到 RSC 層,讓每個使用者可以
自訂哪個路徑顯示哪個頁面。」

---

## 1. 技術棧與整體架構

```
瀏覽器
  │
  ▼
Vercel Edge ──► src/proxy.ts(host 分流 + x-pathname,無 session 邏輯)
  │
  ▼
Next.js 16 App Router(RSC 為主)
  ├── 公開頁  /u/[username]/*(timeline/resume/skills/year/entry)
  ├── 網域頁  /d/[domain]/[[...slug]](catch-all,查 DB 決定 view)
  ├── 後台    /dashboard/*(Server Actions 做 CRUD)
  └── API     /api/*(AI 端點、resume.json、llms.txt)
  │
  ▼
Prisma 7 ──► PostgreSQL          Anthropic API(Claude Haiku)
```

- **RSC 優先**:頁面預設 Server Component,只有互動處(表單、modal、
  切換器)是 client。資料存取都在 server 側,client 沒有 API 瀑布。
- **Server Actions 而非 REST**:dashboard CRUD 全走 server actions。
  好處:型別端到端、無需維護 API 層;代價:非瀏覽器客戶端不能重用
  (所以機器可讀的輸出走獨立 route handlers)。

**面試官可能追問**
- 為什麼不前後端分離?→ 單人專案,RSC 消滅了 API 層的重複勞動;
  真需要對外 API 時再抽(JSON Resume endpoint 就是例子)。
- Server Action 的安全模型?→ 每個 action 進場先 `getCurrentUserId()`
  (無 session 直接 throw),mutation 一律 `updateMany({id, userId})`
  ——就算拿到別人的資源 id 也改不動。

## 2. 認證(NextAuth v5)

**架構**:三個 provider——Google OAuth、Credentials(email + bcrypt)、
demo(一鍵試用帳號)。Session 用 **JWT strategy**(不是 DB session)。

**為什麼 JWT 而非 DB session**:Vercel serverless 每個請求都是冷函式,
DB session 意味著每個請求多一次 session 查詢;JWT 把身分放進 cookie,
驗簽即可。代價:(1) 無法即時撤銷單一 session;(2) JWT 內的資料會過期。

**戰爭故事(必講)**:使用者在 /setup 改了 username,但 JWT 裡還是舊
值,`useSession().update()` 在 Credentials session 下不生效——最後改成
**session() callback 每次從 DB 重讀 username**,用一次輕查詢換資料一致
性。這是「JWT 資料過期」的教科書案例。

**edge 限制的架構影響**:`auth.config.ts` 拆成 adapter-free 切片(providers
+ callbacks,無 Prisma),`auth.ts` 才組完整版。middleware 曾因 bundle
超過 edge 1MB 限制改跑 **Node runtime**(Next 16 的 proxy.ts 慣例預設就
是 Node);2026-08 重構後 proxy 完全不碰 session——**auth gate 移到
`dashboard/layout.tsx`**(redirect + callbackUrl,路徑由 proxy 蓋的
`x-pathname` header 提供),真正的安全邊界一直是資料層的
`getCurrentUserId()`。這是「縱深防禦下,外圈只做 UX」的例子。

**面試官可能追問**
- JWT 被偷怎麼辦?→ httpOnly + secure cookie、短效期;真要撤銷就得
  加 token 版本號進 DB(目前 YAGNI)。
- bcrypt 為什麼不是 md5/sha?→ 慢雜湊 + salt,抗彩虹表與暴力破解。

## 3. 自訂網域系統(最有講頭,準備最熟)

**需求**:使用者把 `ngkaizhe.com` 綁到自己的公開頁,並自訂哪個路徑
顯示時間軸、哪個顯示履歷(例:履歷放根路徑、時間軸放 /timeline)。

**架構決策鏈**(面試的黃金素材,按這個順序講):

1. **Proxy 保持 DB-free**。host 分流在 proxy 層做,但 proxy 每個請求
   都執行——查 DB 會給所有流量加延遲和連線壓力。所以 proxy 只做字串
   判斷:「不是主站 host?整條路徑 rewrite 進 `/d/<host>/<path>`」。
2. **路由決策下放到 RSC**。`/d/[domain]/[[...slug]]` catch-all 查一次
   DB(React `cache()` 去重),依使用者設定的 mapping 決定 render 哪個
   view。判斷順序:使用者 mapping → 固定子頁(/skills、/year/N、
   /entry/id)→ bounce 回主站。
3. **兩欄表示整個 mapping**:`rootView`(enum)+ `altPath`(字串),
   靠「恰有一個 path 是 /」的不變量做到無損表示——比存兩條 path 少一
   種非法狀態。alt path 有保留字清單(dashboard、api、skills…)防止
   遮蔽系統路由。
4. **連結 host-aware**:公開頁的內部連結經過 `getPublicLinks()`——在
   自訂網域上用 domain 的路徑空間,在主站用 `/u/user/...`。沒有它,
   訪客點一下連結就會漏回主站(真實踩過的 bug)。
5. **綁定自助化**:站內呼叫 Vercel Domains API 掛網域、輪詢 DNS 驗證
   狀態,使用者全程不碰 Vercel 後台。

**戰爭故事集**(挑 2 個熟講):
- **Vercel proxy 重入**:Vercel 對 rewrite 後的請求會再跑一次 proxy,
  且 Host 是內部值 → 改寫變成可見的 307。解法:優先讀
  `x-forwarded-host` + 跳過已在 `/d/` 內的路徑(proxy 唯一的 rewrite
  目標)。
- **%40 編碼與 @ 慣例退役**:`/@user` vanity URL 曾被外部連結處理器編
  成 `/%40user` 導致 404;更根本的發現是 Next router **無法**把 `@` 開
  頭的 URL segment 交給動態路由(與 parallel-route slot 語法衝突),
  vanity URL 永遠得靠 proxy rewrite 撐著。2026-08 乾脆退役:canonical
  改 `/u/user`,舊連結由 `next.config.js` `redirects()` 宣告式 308
  (`/@x` 與 `/%40x` 都涵蓋)。「刪掉一個慣例比維護它便宜」的案例。
- **NEXT_PUBLIC_ 是 build-time 燒入**:env 改了沒 redeploy 就是舊值;
  以及使用者把值填成帶 https:// 的完整網址 → 程式碼改成 scheme-tolerant。

**面試官可能追問**
- 為什麼不用 wildcard subdomain(`*.myapp.com`)?→ 需求是使用者
  「自己的」網域,不是子網域;技術上 Vercel Domains API 對兩者都通。
- mapping 查詢會不會成為熱點?→ React cache() 同請求去重 + 之後可加
  LRU/KV;目前流量下單查詢 <5ms 不是瓶頸。

## 4. 雙語資料模型(i18n)

**架構**:語言中立欄位放本體(`Entry.date/color/techStack/featured`),
可翻譯欄位放 `EntryTranslation`/`ExperienceTranslation`(每 locale 一列,
`(entryId, locale)` 唯一)。

**為什麼是 translation 表**,而不是:
- ~~雙欄(titleEn/titleZh)~~:欄位爆炸、加語言要 migration、查詢醜;
- ~~JSON column~~:失去索引與約束、無法只 select 一種語言。
- 例外:`User.resumeSummaryEn/Zh` 用了雙欄——單一使用者、兩個小欄位,
  開一張表是過度設計(能講出「同問題不同規模選不同解」是加分)。

**sourceHash 髒檢查**:AI 翻譯寫入時記下來源內容的 hash;來源再被編輯
→ hash 不符 → UI 標示「翻譯已過期」。人工翻譯 sourceHash = NULL,
永不被 AI 覆寫。這是「機器產物與人工編輯共存」的簡潔解。

**tagSlug**:顯示名可以每語言不同(Engineering/工程),但 slug 唯一,
讓 badge 顏色、履歷分組、URL 過濾跨語言一致。

**面試官可能追問**
- N+1 問題?→ 查詢一律 `include: { translations: true }` 一次帶出,
  `pickTranslation()` 在記憶體挑 locale + fallback primaryLocale。

## 5. AI 整合

**架構**:三個 route handlers(`parse-entry` 一句話→結構化欄位、
`improve-bullet` 履歷句改寫、`translate-content` 雙語互翻),模型用
Claude Haiku(便宜、低延遲),system prompt 掛 ephemeral cache 省 token。

**防護層順序(必考點)**:`auth → rate limit → env check`。
為什麼是這個順序:匿名流量在第一層就被 401 擋掉,**不消耗限流配額**;
換序的話匿名洪水可以把正常使用者的配額打光。無 API key 時整條功能
graceful degrade(nav 入口消失、端點回 503 說明)。

**Quick Add 的兩輪設計**:輸入太稀疏時模型回追問(限定 id 白名單),
使用者回答後帶上下文重解析——比「一次解析不準就算了」的 UX 好很多。

## 6. 履歷產生管線

**資料流**:`entries(featured 星號策展)→ 篩選(經歷/日期/重點)→
分組(JOB/EDUCATION/…)→ 四種輸出`:
1. **螢幕預覽**(React)
2. **列印 DOM**(`.resume-print-doc`,print-only 的雙欄版面)
3. **Markdown**(純函式生成,可下載)
4. **JSON Resume**(`/resume.json`,標準 schema 給 AI/ATS)

**關鍵決策:專屬列印 DOM**。原本用 print CSS 改造螢幕 DOM(「網頁去
chrome」),結果只是可列印、不是設計過的履歷。改成獨立的 print-only
DOM 後,版面自由度完全解放(側欄底色用 fixed 偽元素讓每頁延伸)。
代價是雙份 DOM,但公開頁本來就是靜態內容,成本可忽略。

**戰爭故事**:`section { break-inside: avoid }` 讓比一頁還長的section
整段跳頁 → 第一頁幾乎全空白。修成「標題 break-after: avoid + 單條
bullet break-inside: avoid」。(分頁控制的細粒度是 print CSS 的核心。)

**AI-readable 三件套**:`/resume.json`(JSON Resume schema)、
`/llms.txt`(給 LLM 爬蟲的網站地圖)、JSON-LD(schema.org Person)。
講這個 = 展示你對「機器也是使用者」的敏感度。

## 7. 基建與交付

- **Vercel serverless** + GitHub Actions CI(lint/tsc/vitest/build)。
- **驗證文化**:每次改動跑 smoke-test checklist(40+ 檢查,Playwright
  自動化),production 部署後用 curl 驗證關鍵路徑。
- **戰爭故事**:Vercel build cache 曾沿用舊的 CSS chunk(HTML 新、
  CSS 舊,print 樣式全失效)→ 用 Vercel API 觸發 forceNew deploy 解決。
  教訓:「build 綠 ≠ 產物對」,要驗證 artifact 本身。

**面試官可能追問**
- 為什麼沒有 staging?→ 單人專案,PR preview deployment(Vercel 自帶)
  就是 staging;團隊化後才值得養獨立環境。
- DB migration 策略?→ dev 用 `db push`,真要上 production schema 變更
  時走 additive-only(nullable 欄位先行,程式碼相容兩版)。

---

## 8. 白板考題(自測,答不出來就回去讀對應節)

1. 畫出「訪客打開 ngkaizhe.com/timeline」的完整請求路徑(§3)
2. 為什麼 proxy 不查 DB?查了會怎樣?(§3)
3. JWT session 的資料過期問題,你怎麼踩到、怎麼解?(§2)
4. Translation 表 vs JSON column vs 雙欄,各自的取捨?(§4)
5. AI 端點三層防護的順序為什麼不能換?(§5)
6. 「必有一個 path 是 /」這個不變量帶來什麼好處?(§3)
7. 列印第一頁空白的 bug,根因和修法?(§6)
8. 如果明天要支援第三種語言,要動哪些地方?(§4:加 locale 常量、
   translation 表天然支援、UI 切換器選項——考驗模型的擴展性)
