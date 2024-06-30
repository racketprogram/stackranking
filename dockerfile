# 使用 Node.js 的官方映像作為基礎映像
FROM node:14

# 設置工作目錄
WORKDIR /app

# 複製 package.json 與 package-lock.json 到工作目錄
COPY package.json package-lock.json ./

# 安裝 Node.js 應用程式依賴
RUN npm install

# 將應用程式源碼複製到工作目錄
COPY . .

# 預設執行的命令，可以根據你的應用程式入口文件進行修改
CMD ["node", "server.js"]
