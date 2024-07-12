# code review

## redis issue
   
redis 支援 transaction 但不支援 rollback，所以我們的操作如果跑到一半斷電即可能發生資料不一致

為了資料正確性還是得用 rdbms
```
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    apple,
    banana,
    kiwi,
    score INDEX,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

而且沒辦法每分鐘更新完所有的用戶分數
並且 leaderboard 有可能因為分區問題短暫不正確

## code logic issue

time now 應該用 redis 內部時間避免 nodejs cluster 時間不一致

redis lua 錯誤處理不夠完整


## Redis sharding issue

# 分布式排名系統設計

## Sharding 分配 (上次提交的 sharding 分支已經完成)

- 初始時，按照 user id hash 將用戶均勻分配到多個分片 
- 每個分片獨立維護其用戶的排名信息 
- 不需要每天重新分配用戶，除非出現嚴重的倾斜 

## 個人排名查詢 (上次未完成的部分，後來想到的解法，其實很簡單)
1. 在用戶所在 sharding 中獲取該用戶的分數和排名
2. 並行查詢其他 sharind 中比該用戶分數高的用戶數量
3. 計算總排名 = 當前排名 + 其他分片中更高分數的總數

## 獲取總排行前一百名 (上次提交的 sharding 分支已經完成)

1. 並行從每個分片獲取前100名用戶及其分數
2. 在中央服務器合併所有分片的數據（假設10個分片，最多1000個用戶）
3. 對合併後的數據進行排序
4. 選取排序後的前100名用戶
5. 返回這100名用戶的信息（ID、分數、總排名）

上述的時間複雜度都分析過，最慢的就是重新排序前一百名時的 O(nlogn)