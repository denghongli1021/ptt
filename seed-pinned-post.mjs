import { drizzle } from 'drizzle-orm/mysql2';
import { posts, boards } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function seedPinnedPost() {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  try {
    const connection = await mysql.createConnection(DATABASE_URL);
    const db = drizzle(connection);

    // 尋找或建立 "公告" 看板
    const announcementBoard = await db.select().from(boards).where(eq(boards.name, 'announce')).limit(1);
    
    let boardId;
    if (announcementBoard.length === 0) {
      // 建立公告看板
      const result = await db.insert(boards).values({
        name: 'announce',
        displayName: '公告',
        category: '系統',
        description: '系統公告和使用說明',
        popularity: 0,
      });
      boardId = result.insertId;
    } else {
      boardId = announcementBoard[0].id;
    }

    // 檢查是否已有置頂說明貼文
    const existingPost = await db.select().from(posts)
      .where(eq(posts.title, '【使用說明】歡迎來到 PTT Clone'))
      .limit(1);

    if (existingPost.length === 0) {
      // 建立置頂說明貼文
      await db.insert(posts).values({
        boardId: boardId,
        title: '【使用說明】歡迎來到 PTT Clone',
        content: `歡迎使用 PTT Clone 論壇！

【基本功能】
1. 看板列表：首頁顯示所有可用看板，點擊進入查看貼文
2. 發表貼文：登入後可在各看板發表新貼文
3. 推文回覆：可以對貼文進行推（讚）、噓（踩）或中立回覆
4. 編輯刪除：可編輯或刪除自己發表的貼文和推文
5. 收藏功能：登入後可收藏喜歡的貼文，在「我的收藏」查看

【操作說明】
- 登入：點擊右上角「登入」使用 Manus OAuth 帳號登入
- 登出：登入後點擊右上角「登出」退出帳號
- 發文：進入看板後點擊「發文」按鈕發表新貼文
- 推文：在貼文詳情頁下方輸入推文內容，選擇推/噓/→類型後提交
- 排序：在貼文詳情頁可選擇推文排序方式（最新、最舊、最多推）

【社群規則】
- 尊重他人意見，禁止人身攻擊
- 不得發表違法或不當內容
- 管理員有權刪除違規貼文和推文

祝您使用愉快！`,
        authorId: 1,
        isPinned: 1,
      });
      console.log('✓ 置頂說明貼文已建立');
    } else {
      console.log('✓ 說明貼文已存在');
    }

    await connection.end();
    console.log('✓ 種子資料完成');
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedPinnedPost();
