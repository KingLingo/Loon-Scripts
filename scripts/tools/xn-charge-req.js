/**
 * 新能充电 - 请求修改脚本
 * 统一处理 /wxn/* 下的 POST 请求
 * - 所有接口：openId 前加日期前缀
 * - 对于 /wxn/beginCharge，额外设置充电参数
 */

function getTodayString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}${m}${d}`;
}

if ($request.method === "POST" && $request.url.match(/^http:\/\/www\.szlzxn\.cn\/wxn\/.*$/)) {
    let body = $request.body || "";
    let params = body.split("&").reduce((o, pair) => {
        let [k, v] = pair.split("=");
        o[k] = v ? decodeURIComponent(v) : "";
        return o;
    }, {});

    // 给 openId 前面加日期前缀
    if (params.openId !== undefined) {
        params.openId = getTodayString() + params.openId;
    }

    // 针对 beginCharge 接口，覆盖充电参数
    if ($request.url.match(/\/wxn\/beginCharge$/)) {
        params.beforemoney = "999999";
        params.fullStop = "1";
        params.safeCharge = "9";
        params.safeOpen = "1";
        params.payType = "1";
        params.edtType = "1";
        params.yuannTime = "960";
    }

    // 重组成 urlencoded body
    let newBody = Object.keys(params)
        .map(k => `${k}=${encodeURIComponent(params[k])}`)
        .join("&");

    $done({ body: newBody });
} else {
    $done({});
}
