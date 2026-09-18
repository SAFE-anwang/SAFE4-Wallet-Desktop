// views.ts
export const View_Loading = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  html, body {
    margin: 0;
    height: 100%;
    background: #f5f6f8;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
                 "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    -webkit-font-smoothing: antialiased;
    user-select: none;
    overflow: hidden;
  }
  .container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.35s ease-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .spinner {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 3px solid #e3e6eb;
    border-top-color: #4a6cf7;
    animation: spin 0.85s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .title {
    margin-top: 22px;
    font-size: 15px;
    color: #333;
    letter-spacing: 0.3px;
  }
  .subtitle {
    margin-top: 8px;
    font-size: 12px;
    color: #9aa0a6;
    letter-spacing: 0.2px;
  }
  .dots::after {
    content: "";
    animation: dots 1.4s steps(4, end) infinite;
  }
  @keyframes dots {
    0%   { content: ""; }
    25%  { content: "."; }
    50%  { content: ".."; }
    75%  { content: "..."; }
    100% { content: ""; }
  }
</style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <div class="title">正在加载网页<span class="dots"></span></div>
    <div class="subtitle">请稍候，正在建立安全连接</div>
  </div>
</body>
</html>`;

export const View_Error = (message: string, url: string) => `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  html, body {
    margin: 0; height: 100%;
    background: #f5f6f8;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
                 "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    -webkit-font-smoothing: antialiased;
    user-select: none;
  }
  .container {
    height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center; padding: 0 40px;
  }
  .icon {
    width: 64px; height: 64px;
    border-radius: 50%;
    background: #ffe9e9;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 20px;
  }
  .icon svg { width: 32px; height: 32px; }
  .title {
    font-size: 17px; color: #333; font-weight: 500;
    margin-bottom: 8px;
  }
  .message {
    font-size: 13px; color: #9aa0a6;
    max-width: 420px; line-height: 1.6;
    word-break: break-all;
    margin-bottom: 6px;
  }
  .url {
    font-size: 12px; color: #b0b5ba;
    max-width: 420px; word-break: break-all;
  }
</style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="#e5484d" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    </div>
    <div class="title">无法加载页面</div>
    <div class="message">${message}</div>
    <div class="url">${url}</div>
  </div>
</body>
</html>`;
