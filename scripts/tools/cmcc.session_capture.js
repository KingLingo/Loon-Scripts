/**
 * Persistent native-gateway capture: stores per-account autoLogin material.
 * Observes client.app.coc.10086.cn/biz-orange/LN/* requests and persists
 * xk / cellNum / phone / headers so the Mac executor can mint sessions
 * for every switched account. Loon + QX compatible.
 */
const K_REQS = "cmcc.native_reqs";   // JSON array of {url,headers,body,ts}
const K_SEEN = "cmcc.seen_accounts";

function env() {
  const isQX = typeof $task !== "undefined";
  return {
    read(key) {
      if (isQX) return $prefs.valueForKey(key);
      return $persistentStore.read(key);
    },
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

function interesting(url) {
  return url.indexOf("client.app.coc.10086.cn") !== -1 &&
    /uamonekeylogin|uamrandcodelogin|autoLogin|appTokenLogin|cellNum/i.test(url);
}

const $ = env();
try {
  const req = $request;
  const url = req.url || "";
  const headers = req.headers || {};
  const body = req.body || "";
  if (!interesting(url)) {
    $done({});
  } else {
    const list = JSON.parse($.read(K_REQS) || "[]");
    const entry = {
      url: url,
      method: req.method || "POST",
      headers: {},
      body: body,
      ts: Date.now(),
    };
    for (const k of Object.keys(headers)) {
      entry.headers[k.toLowerCase()] = Array.isArray(headers[k]) ? headers[k][0] : String(headers[k]);
    }
    list.push(entry);
    // keep last 30
    while (list.length > 30) list.shift();
    $.write(JSON.stringify(list), K_REQS);
    $.notify("CMCC", "登录请求已捕获", url.split("10086.cn")[1].slice(0, 60));
  }
} catch (e) {
  $.notify("CMCC", "捕获异常", String(e));
}
$done({});
