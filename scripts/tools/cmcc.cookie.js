/**
 * Capture appTokenLogin body. Loon http-request / QX script-request-body.
 */
const KEY_TOKEN = "cmcc.app_token";
const KEY_META = "cmcc.app_meta";

function env() {
  const isQX = typeof $task !== "undefined";
  return {
    isQX,
    write(val, key) {
      if (isQX) return $prefs.setValueForKey(val, key);
      return $persistentStore.write(val, key);
    },
    notify(title, sub, body) {
      if (isQX) $notify(title, sub || "", body || "");
      else $notification.post(title, sub || "", body || "");
    },
  };
}

function parseBody(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_) {}
  try {
    const o = {};
    String(raw)
      .split("&")
      .forEach((kv) => {
        const i = kv.indexOf("=");
        if (i > 0) o[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1));
      });
    return o;
  } catch (_) {
    return null;
  }
}

function hexToPhone(hex) {
  if (!hex) return "";
  try {
    const n = parseInt(String(hex), 16);
    const s = String(n);
    return /^1\d{10}$/.test(s) ? s : "";
  } catch (_) {
    return "";
  }
}

const $ = env();
try {
  const body = parseBody($request && $request.body);
  const token = body && (body.token || body.app_token);
  if (token) {
    $.write(token, KEY_TOKEN);
    const phone = hexToPhone(body.userCheckId);
    $.write(
      JSON.stringify({
        provinceCode: body.provinceCode || "",
        cityCode: body.cityCode || "",
        phone: phone,
        ts: Date.now(),
      }),
      KEY_META
    );
    $.notify("CMCC", "凭证已更新", phone ? "可跑定时签到" : "已保存 token");
  }
} catch (e) {
  $.notify("CMCC", "抓凭证失败", String(e));
}
$done({});
