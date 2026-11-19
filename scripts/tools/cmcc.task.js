/**
 * Daily mark31 sign-in + claim. Loon cron / QX task_local.
 */
const KEY_TOKEN = "cmcc.app_token";
const KEY_META = "cmcc.app_meta";
const BASE = "https://wx.10086.cn";
const ACTIVITY_ID = "1021122301";
const CHANNEL_ID = "P00000109876";
const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148/wkwebview leadeon/12.5.2/CMCCIT";

function env() {
  const isQX = typeof $task !== "undefined";
  return {
    isQX,
    read(key) {
      if (isQX) return $prefs.valueForKey(key);
      return $persistentStore.read(key);
    },
    notify(title, sub, body) {
      if (isQX) $notify(title, sub || "", body || "");
      else $notification.post(title, sub || "", body || "");
    },
    fetch(req) {
      const method = (req.method || "GET").toUpperCase();
      if (isQX) {
        req.method = method;
        req.opts = Object.assign({ redirection: false, "auto-cookie": false }, req.opts || {});
        return $task.fetch(req);
      }
      return new Promise((resolve, reject) => {
        const cb = (err, resp, body) => {
          if (err) return reject(new Error(typeof err === "string" ? err : String(err)));
          resolve({
            statusCode: (resp && (resp.status || resp.statusCode)) || 0,
            headers: (resp && resp.headers) || {},
            body: body,
          });
        };
        const payload = { url: req.url, headers: req.headers || {}, body: req.body };
        if (method === "POST") $httpClient.post(payload, cb);
        else $httpClient.get(payload, cb);
      });
    },
  };
}

function ymd() {
  const d = new Date();
  const p = (n) => (n < 10 ? "0" + n : "" + n);
  return "" + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
}

function headerVal(headers, name) {
  if (!headers) return "";
  const lower = name.toLowerCase();
  for (const k of Object.keys(headers)) {
    if (k.toLowerCase() === lower) {
      const v = headers[k];
      return Array.isArray(v) ? v.join("; ") : String(v);
    }
  }
  return "";
}

function mergeSetCookie(jar, setCookie) {
  const map = {};
  String(jar || "")
    .split(";")
    .forEach((p) => {
      const s = p.trim();
      const i = s.indexOf("=");
      if (i > 0) map[s.slice(0, i)] = s.slice(i + 1);
    });
  String(setCookie || "")
    .split(/,(?=\s*[^;=]+?=)/)
    .forEach((part) => {
      const first = part.split(";")[0].trim();
      const i = first.indexOf("=");
      if (i > 0) map[first.slice(0, i)] = first.slice(i + 1);
    });
  return Object.keys(map)
    .map((k) => k + "=" + map[k])
    .join("; ");
}

const $ = env();
const token = $.read(KEY_TOKEN);
if (!token) {
  $.notify("CMCC", "无凭证", "打开中国移动 → 签到领流量，让捕获脚本跑一次");
  $done();
} else {
  let meta = {};
  try {
    meta = JSON.parse($.read(KEY_META) || "{}");
  } catch (_) {}
  const actUrl = `${BASE}/qwhdhub/qwhdmark/${ACTIVITY_ID}?channelId=${CHANNEL_ID}`;
  const today = ymd();

  function fetch(req) {
    req.headers = Object.assign(
      { "user-agent": UA, "accept-language": "zh-CN,zh-Hans;q=0.9" },
      req.headers || {}
    );
    return $.fetch(req);
  }

  (async () => {
    const loginPage = await fetch({
      url: `${BASE}/qwhdsso/login?dlwmh=true&actUrl=${encodeURIComponent(actUrl)}`,
    });
    const m = String(loginPage.body || "").match(/loginPath\s*=\s*'([^']+)'/);
    if (!m) throw new Error("SSO 页无 loginPath，活动入口可能变了");
    const loginUrl = BASE + "/qwhdsso" + m[1];
    const phone = meta.phone || "";
    const userCheckId = phone && /^1\d{10}$/.test(phone) ? Number(phone).toString(16) : "";
    const login = await fetch({
      url: loginUrl,
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        provinceCode: meta.provinceCode || "",
        cityCode: /^\d+$/.test(String(meta.cityCode || "")) ? meta.cityCode : "",
        userCheckId: userCheckId,
        carrierOperator: "002",
        appVersionCode: "12.5.2",
        jwtToken: null,
        token: token,
      }),
    });
    const loginJson = JSON.parse(login.body || "{}");
    if (loginJson.code !== "SUCCESS") {
      throw new Error("appTokenLogin: " + (loginJson.msg || loginJson.code) + " —— 打开 App 签到页热会话");
    }
    const jump = loginJson.data && loginJson.data.url;
    if (!jump || jump.indexOf("wx.10086.cn") === -1) throw new Error("跳转 URL 异常");

    const hub = await fetch({ url: jump });
    let jar = mergeSetCookie("", headerVal(hub.headers, "Set-Cookie"));
    if (!/SESSION_TOKEN/i.test(jar)) throw new Error("未落到活动 SESSION_TOKEN");

    const apiHeaders = {
      cookie: jar,
      origin: BASE,
      referer: jump,
      "content-type": "application/json;charset=UTF-8",
      accept: "*/*",
      "login-check": "1",
      "x-requested-with": "XMLHttpRequest",
    };

    const statusResp = await fetch({
      url: `${BASE}/qwhdhub/api/mark/mark31/markstatus`,
      method: "POST",
      headers: apiHeaders,
      body: "{}",
    });
    const statusJson = JSON.parse(statusResp.body || "{}");
    if (statusJson.code !== "SUCCESS") {
      throw new Error("markstatus: " + (statusJson.msg || statusJson.code));
    }
    const data = statusJson.data || {};
    const acc = (data.userinfo || {}).accumulateTimes;
    const signed = (data.markstatus || []).some(
      (d) => d.date === today && String(d.status) === "1"
    );
    const lines = [];
    if (signed) {
      lines.push("今日已签 累计" + acc);
    } else {
      const done = await fetch({
        url: `${BASE}/qwhdhub/api/mark/mark31/domark`,
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({ date: today }),
      });
      const dj = JSON.parse(done.body || "{}");
      const st = dj.status || "";
      if (dj.code === "SUCCESS" || st === "HAVE_MARKED" || /已签/.test(String(dj.msg || ""))) {
        lines.push(st === "HAVE_MARKED" ? "今日已签(幂等)" : "签到成功 累计" + acc);
      } else {
        throw new Error("domark: " + dj.code + "/" + st + "/" + dj.msg);
      }
    }
    const chances = data.taskAwardChance || [];
    for (const task of chances) {
      if (!task.id) continue;
      const cr = await fetch({
        url: `${BASE}/qwhdhub/api/mark/mark31/taskAward/` + task.id,
        method: "POST",
        headers: apiHeaders,
        body: "{}",
      });
      const cj = JSON.parse(cr.body || "{}");
      const prize = (cj.data && cj.data.prizeName) || cj.msg || cj.code;
      lines.push("领奖" + task.id + ": " + prize);
    }
    if (!chances.length) lines.push("无可领累计奖");
    $.notify("CMCC 签到", "完成", lines.join("\n"));
  })()
    .catch((e) => $.notify("CMCC 签到失败", "", String(e)))
    .finally(() => $done());
}
