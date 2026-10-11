# Progress
- 2026-10-11：確認需求（Expo App、Supabase 之後接、MVP 四大功能、罰點累積→罰站），建立 Expo SDK 57 專案骨架與 PRD（PRD.md）
- 2026-10-11：完成 MVP v0.1：事件紀錄資料層與本機儲存（src/domain/）、立體 UI 元件（src/components/ui.tsx）、五個分頁（貼紙板、記錄、獎品、時間軸、規則）、罰站倒數（src/app/timeout.tsx）、習慣串連（src/app/routine/[id].tsx）；已在瀏覽器手機尺寸實測給貼紙、三段式→罰站、串連完成、新增小孩
- 2026-10-11：串接 Supabase：建表＋RLS＋即時同步（supabase/schema.sql 已在專案 haobaobaosticky 執行）、Supabase client（src/lib/supabase.ts）、本機優先同步引擎（src/domain/sync.ts）、家庭建立/邀請碼加入畫面（src/app/family.tsx）、.keyrc
- 2026-10-12：雲端同步實測通過：建立家庭、第二裝置用邀請碼加入、貼紙與規則設定雙向即時同步；網頁輸出改為單頁模式（app.json）避免伺服器端渲染讀不到 window
