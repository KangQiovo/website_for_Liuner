# 宝塔面板部署 `backend/server.js` 指南

下述步骤假设你已经在服务器上通过宝塔面板安装了 Node 环境（Node 管理器）并能访问宝塔终端。

## 1. 准备代码目录（以 `/www/wwwroot/liuner.top` 为示例）
1. 宝塔面板中网站根目录是 `/www/wwwroot/liuner.top`，建议在该目录下单独放一个后端文件夹，例如：`/www/wwwroot/liuner.top/backend`。
2. 将本项目的 `backend` 目录全部上传/同步到这个新文件夹内，结构应类似：
   ```
   /www/wwwroot/liuner.top/
   ├─ backend/
   │  ├─ server.js        # 启动文件
   │  └─ messages.json    # 首次运行后自动生成的持久化文件
   └─ (前端站点文件……)
   ```
   > 提示：如需分离站点与接口，也可以将后端单独放在 `/www/wwwroot/message-api`，步骤完全相同，只需把下面提到的路径改成该目录即可。

> 提示：此服务不依赖第三方 npm 包，保持目录干净即可。

## 2. 设置 Node 版本
在宝塔「Node 管理器」里选择与服务器环境兼容的 Node 版本（推荐 18+），并将其设为项目使用版本。

## 3. 创建 PM2 项目
1. 打开宝塔「Node 项目管理」→「添加项目」。
2. 选择 **PM2** 类型。
3. 「项目路径」填写步骤 1 的目录，例如 `/www/wwwroot/liuner.top/backend`（或你自定义的接口目录）。
4. 「启动文件」填写 `server.js`（保持与项目路径在同一层级）。
5. 「运行目录」保持与项目路径一致。
6. 「运行用户」保持默认（一般为 `www`）。
7. 「启动参数」可为空，或自定义端口：`PORT=8787`（默认 8787，可自行调整）。
8. 勾选「开机自启」，保存并启动。

启动后，可在项目详情里看到实时日志，确认出现：
```
Message board backend running on http://localhost:8787/api/messages
```

## 4. 放行端口与反向代理
- 若直接暴露接口：在宝塔安全/防火墙放行 `8787`（或你自定义的端口）。
- 如需通过网站同域访问，推荐在 `liuner.top` 站点添加反向代理：
  - 目标：`http://127.0.0.1:8787`
  - 路径：`/api/messages`
  - 勾选「缓存」关闭，确保 POST 正常透传。

## 5. 数据存储位置
- 留言持久化文件为 `messages.json`，默认与 `server.js` 同目录。
- 如需更换存储路径，可在 `server.js` 中调整：
  ```js
  const DATA_FILE = path.join(__dirname, 'messages.json');
  ```
  改为指向挂载盘/持久化目录后，重启 PM2 项目。

## 6. 健康检查
- GET `http://<你的域名或IP>:8787/api/messages` 应返回 JSON 数组。
- POST `http://<你的域名或IP>:8787/api/messages`，Body：`{"text":"你好"}`，应返回 `{ "ok": true }`。

## 7. 常见问题
- **端口占用**：在面板终端执行 `lsof -i:8787` 检查，或在 PM2 项目改用空闲端口。
- **权限问题**：确保运行用户对 `messages.json` 目录有读写权限（`chown -R www:www /www/wwwroot/message-api`）。
- **跨域**：服务默认允许任意来源（`Access-Control-Allow-Origin: *`），如需收敛来源，可在 `server.js` 中调整。

完成上述配置后，前端可将 API 地址指向 `https://你的域名/api/messages`（若做了反代）或 `http://服务器IP:8787/api/messages` 直接访问。
