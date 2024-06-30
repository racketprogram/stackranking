# Staking Points System 文檔
1. 系統概述

    Staking Points System 是一個基於 Node.js 的後端系統，用於管理用戶的資產 staking 和計分。系統使用 PostgreSQL 作為紀錄用戶名稱的數據庫，Redis 作為紀錄資產數量及計分系統。

    主要功能：

    - 用戶註冊
    - 資產 staking（蘋果、香蕉、奇異果）
    - 資產提取
    - 查詢用戶資產
    - 查看排行榜
    - 自動更新用戶分數

2. 系統架構
    
    系統主要由以下組件組成：

    - Express.js 服務器
    - PostgreSQL 數據庫
    - Redis 資產和計分系統
    - Lua 腳本（用於 Redis 中的複雜操作）
    - 定時任務（使用 node-cron）

3. 數據模型
   
    PostgreSQL：
    ```sql
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );  
    ```

    Redis：
    - user_scores: Sorted Set，用於存儲用戶分數和排名
    - user_scores:data: Hash，用於存儲用戶詳細資產數據

4. API 文檔

    參考 swagger.yml

5. 計分邏輯
    
    計分邏輯在 Lua 腳本中實現，主要公式如下：
    ```lua
    local function calculateScore(apple, banana, kiwi, timeDiff)
        return apple * 100 * timeDiff + banana * 20 * timeDiff + kiwi * 10 * timeDiff
    end
    ```
    這個公式考慮了每種資產的數量和持有時間（timeDiff）。

6. 自動更新機制
    
    系統使用 node-cron 每分鐘執行一次更新操作，更新所有用戶的分數。這確保了即使用戶不進行操作，其分數也會隨時間增長。
    
    更新機制的工作原理如下：


    > 系統會遍歷整個 sorted set，該 set 包含了所有用戶的ID和當前分數。
    對於每個用戶，系統會：
    
    > 從相應的 hash 中獲取該用戶的詳細資產數據（蘋果、香蕉、奇異果的數量）。
    計算自上次更新以來的時間差（timeDiff）。
    使用上述公式計算新的分數增量。
    將新的分數增量加到用戶的當前分數上。
    更新 sorted set 中該用戶的分數。
    更新 hash 中該用戶的最後更新時間。

    這個過程確保了即使用戶不進行任何操作，他們的分數也會隨著時間的推移而增加，反映了持續持有資產的價值。
    由於這個操作是在 Redis 中通過 Lua 腳本執行的，因此它是原子的和高效的，能夠處理大量用戶的同時更新。

7. 部署

    系統使用 Docker Compose 進行部署，包含 PostgreSQL 和 Redis 服務。

8. 測試

    系統包含一組全面的 API 測試，使用 Mocha 和 Chai 框架實現。測試涵蓋了註冊、staking、提取、查詢資產和排行榜等主要功能。


結論

Staking Points System 提供了一個靈活且高效的方式來管理用戶資產和計算分數。通過結合 PostgreSQL 和 Redis，系統能夠處理大量用戶和頻繁的計分更新。Lua 腳本的使用進一步優化了 Redis 操作的效率。"