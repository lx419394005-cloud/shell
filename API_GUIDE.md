# API 链接指南

本文档记录了项目中 AI 聊天（Chat）和绘画（Image Generation）API 的技术细节。基础配置和项目结构请参考 [CLAUDE.md](CLAUDE.md)。

## 1. 基础配置

- **认证令牌 (Authorization)**: `Bearer QC-3832b621c6e6ef01e7e65bd6811a875e-ce9870a4261b87deeec35f4bad62f57f`
- **内容类型 (Content-Type)**: `application/json`

---

## 2. 聊天 API (Chat API)

为了支持移动端在脱离本地服务器的情况下依然可以访问，Chat API 采用**直连模式**。

- **URL**: `https://www.aiping.cn/api/v1/chat/completions`
- **请求方式**: `POST`
- **请求体格式 (Standard OpenAI)**:
  ```json
  {
    "model": "gpt-4o", // 或其他可用模型
    "messages": [
      { "role": "system", "content": "你是一个助手..." },
      { "role": "user", "content": "你好" }
    ],
    "stream": true
  }
  ```
- **特性**: 
  - 允许跨域直连（CORS Allowed）。
  - 支持流式输出（SSE）。

---

## 3. 绘画 API (Image Generation API)

由于绘画 API 存在严格的跨域限制（CORS）或需要特定的模型处理，绘画 API 采用**云函数转发模式**。

- **URL**: `https://ax0rcpp85w.sealosbja.site/generate-image`
- **请求方式**: `POST`
- **请求体格式**:
  ```json
  {
    "model": "Doubao-Seedream-4.5",
    "input": {
      "prompt": "提示词 (aspect ratio: 16:9)", // 必须在 prompt 末尾注入比例
      "negative_prompt": "负面提示词" // 负面提示词放在 input 中
    },
    "extra_body": {
      "size": "2K", // 或 "4K"
      "scale": 1, // 引导系数
      "watermark": false,
      "sequential_image_generation": "auto",
      "sequential_image_generation_options": {
        "max_images": 4
      },
      "provider": {
        "only": [],
        "order": [],
        "sort": null,
        "output_price_range": [],
        "latency_range": []
      }
    }
  }
  ```
- **核心注意事项**:
  1. **比例注入**: 不再通过 `width` 和 `height` 传递尺寸，必须在 `prompt` 字符串最后添加 ` (aspect ratio: W:H)` 格式的比例信息。
  2. **参数位置**: 除了 `prompt` 和 `negative_prompt` 在 `input` 中，其他所有绘图控制参数（`size`, `scale` 等）必须放在 `extra_body` 中。
  3. **分辨率映射**: 
     - 2K 基础尺寸（以 1:1 为例）为 2048x2048。
     - 4K 尺寸是 2K 对应比例下的 **2倍**（例如 4K 16:9 为 5404x3040）。
  4. **组图模式**: 默认启用 `sequential_image_generation: "auto"`，并通过 `max_images: 4` 限制最大张数。

- **响应格式**:
  ```json
  {
    "data": [
      { "url": "https://generated-image-url.com/xxx.png" }
    ]
  }
  ```
- **特性**:
  - 通过 Sealos/Laf 云函数中转。
  - 规避了浏览器直接请求 `aiping.cn` 时的跨域错误。

---

## 4. 核心逻辑总结 (开发者必读)

1. **统一使用 `fetch`**: 项目已从 `axios` 切换为原生的 `fetch` API，以保证流式输出和更好的兼容性。
2. **错误处理**: 所有的 API 请求都应包含详细的错误捕获逻辑，并能够从 `response.json()` 中解析后端返回的具体错误信息。
3. **环境隔离**: 
   - `LOCAL_API_URL` 现在被定义为 `https://www.aiping.cn/api/v1`（直连）。
   - `LAF_APP_URL` 被定义为云函数地址。
