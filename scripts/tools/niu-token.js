/**
 * 小牛 NIU - RefreshToken 捕获(响应观察脚本)
 *
 * 命中: https://account.niu.com/v3/api/oauth2/token
 * 作用: 在 App 登录 / 自动刷新时,被动读取下发的 refresh_token 与 access_token,
 *       本地保存(persistentStore)并推送通知。不修改响应,不影响 App 会话。
 *
 * 响应包络(逆向确认):
 *   { status:0, data:{ token:{ access_token, refresh_token,
 *                              token_expires_in, refresh_token_expires_in },
 *                      user:{ user_id, mobile, nick_name } } }
 *   token_expires_in / refresh_token_expires_in 为绝对时间戳(秒)。
 */

const body = $response.body;

function ts(sec) {
  const n = Number(sec);
  if (!n) return String(sec || "");
  try {
    return new Date(n * 1000).toLocaleString();
  } catch (e) {
    return String(sec);
  }
}

if (body) {
  try {
    const obj = JSON.parse(body);
    const tk = obj && obj.data && obj.data.token;
    if (tk && (tk.refresh_token || tk.access_token)) {
      const access = tk.access_token || "";
      const refresh = tk.refresh_token || "";
      const accessExp = ts(tk.token_expires_in);
      const refreshExp = ts(tk.refresh_token_expires_in);
      const u = (obj.data.user || {});
      const who = u.mobile || u.nick_name || u.user_id || "";

      $persistentStore.write(refresh, "niu_refresh_token");
      $persistentStore.write(access, "niu_access_token");
      $persistentStore.write(new Date().toLocaleString(), "niu_token_captured_at");

      const title = "✅ NIU Token 已捕获";
      const sub = who ? ("账号 " + who) : "登录/刷新成功";
      // 完整 refresh_token 放进通知正文,长按可复制
      const content =
        "refresh_token:\n" + refresh +
        "\n\naccess_token 有效期至 " + accessExp +
        "\nrefresh_token 有效期至 " + refreshExp;

      $notification.post(title, sub, content);
      console.log("[NIU] refresh_token = " + refresh);
      console.log("[NIU] access_token  = " + access);
      console.log("[NIU] access_exp=" + accessExp + " refresh_exp=" + refreshExp);
    } else {
      console.log("[NIU] 响应无 token 字段(status=" + (obj && obj.status) + ")");
    }
  } catch (e) {
    console.log("[NIU] 解析失败: " + e);
  }
}

// 只观察,不改写响应。
$done({});
