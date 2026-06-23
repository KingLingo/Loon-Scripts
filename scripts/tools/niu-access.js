/**
 * 小牛 NIU - AccessToken 捕获(请求头观察脚本)
 *
 * 命中: https://app-api.niu.com/**  (所有业务接口)
 * 作用: App 每个业务请求都带 `token:` 头(即 access_token),这里被动读取并保存。
 *       refresh_token 只在登录/刷新响应里出现,需等 App 自动刷新;access_token 则即时可得。
 *       做了去重,避免同一 token 反复弹通知。
 */

const headers = $request.headers || {};

// header 名大小写不固定,做兼容查找。
function pick(h, name) {
  const lower = name.toLowerCase();
  for (const k in h) {
    if (k.toLowerCase() === lower) return h[k];
  }
  return "";
}

const token = pick(headers, "token");

if (token) {
  const notified = $persistentStore.read("niu_access_token_notified");
  $persistentStore.write(token, "niu_access_token");
  if (notified !== token) {
    $persistentStore.write(token, "niu_access_token_notified");
    $persistentStore.write(new Date().toLocaleString(), "niu_access_captured_at");
    $notification.post("🔑 NIU access_token 已捕获", "来自业务请求头", token);
    console.log("[NIU] access_token = " + token);
  }
}

// 只观察,不改写请求。
$done({});
