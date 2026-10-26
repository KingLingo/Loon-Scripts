/**
 * Loon 脚本 — 「小兔充充」登录劫持 + 余额伪造
 * 
 * 功能：
 * 1. 拦截 user/base/login 响应 → 注入 uid=4 + 伪造 openId/session_key
 * 2. 拦截 wallet/index/balance 响应 → 返回 money=500
 * 3. 拦截 user/user_device/list → 返回绑定设备列表
 * 4. 拦截 order/chargeRecord → 返回订单历史
 * 
 * 使用：
 * 1. Loon 配置 → 重写 → 添加插件
 * 2. 开启 MITM 抓包 mapi.xiaotucc.com
 * 3. 微信打开「小兔充充」小程序 → 自动登录 uid=4
 */

// ==================== 配置 ====================
const TARGET_UID = 4;           // 劫持的 uid（已充值 500）
const TARGET_PHONE = "15555555556"; // 目标手机号（展示用）
const FAKE_OPENID = "oX_fake_15555555556"; // 伪造 openId
const FAKE_UNIONID = "uX_fake_15555555556"; // 伪造 unionId
const FAKE_SESSION_KEY = "fake_session_key_15555555556"; // 伪造 session_key
const FAKE_NICKNAME = "测试用户1555"; // 伪造昵称

// ==================== 工具函数 ====================
function jsonResp(data) {
    return {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    };
}

function intercept(request, response) {
    const url = request.url;
    const body = response.body || "";
    let data = {};
    
    try { data = JSON.parse(body); } catch(e) {}
    
    // ---- 登录劫持 ----
    if (url.includes("user/base/login")) {
        return jsonResp({
            status: 200,
            message: "登录成功",
            data: {
                uid: TARGET_UID,
                openId: FAKE_OPENID,
                unionId: FAKE_UNIONID,
                session_key: FAKE_SESSION_KEY,
                phone: TARGET_PHONE,
                nickname: FAKE_NICKNAME,
                avatar: "https://i.xiaotucc.com/default_avatar.png",
                isLogin: true,
                token: "fake_token_" + Date.now(),
                wechatAppId: "wxa3dde54e66082a1b"
            }
        });
    }
    
    // ---- 钱包余额伪造 ----
    if (url.includes("wallet/index/balance")) {
        return jsonResp({
            status: 200,
            message: "获取成功",
            data: {
                money: "500.00",
                self: "500.00",
                present: "0.00",
                uid: TARGET_UID,
                phone: TARGET_PHONE
            }
        });
    }
    
    // ---- 充电金/赠送金额 ----
    if (url.includes("wallet/index/gold")) {
        return jsonResp({
            status: 200,
            message: "获取成功",
            data: {
                gold: "0.00",
                rLimit: "0.00",
                uid: TARGET_UID
            }
        });
    }
    
    // ---- 绑定设备列表 ----
    if (url.includes("user/user_device/list")) {
        return jsonResp({
            status: 200,
            message: "请求成功",
            data: [
                {
                    id: 1478341,
                    did: 26743,
                    name: "西丽楼小区-0507",
                    no: "2104300507",
                    type: 4,
                    port: 10,
                    offline: 2,
                    freePort: 10,
                    promotionAble: -1,
                    uid: TARGET_UID
                }
            ]
        });
    }
    
    // ---- 订单历史 ----
    if (url.includes("order/chargeRecord")) {
        return jsonResp({
            status: 200,
            message: "请求成功",
            data: [
                {
                    date: "2026年10月26日",
                    list: [
                        {
                            id: 59073519,
                            no: "E202610265189469861",
                            name: "充值订单",
                            startTime: "08:00:00",
                            status: 2,
                            balanceMoney: "500.00",
                            long: "00:00:00",
                            statusValue: "已支付",
                            createTime: "08:00"
                        }
                    ]
                }
            ]
        });
    }
    
    // ---- VIP 信息 ----
    if (url.includes("user/vip/info")) {
        return jsonResp({
            status: 200,
            message: "获取成功",
            data: {
                vip: 0,
                vipName: "普通用户",
                day: 0,
                uid: TARGET_UID
            }
        });
    }
    
    // ---- 优惠券 ----
    if (url.includes("user/coupon/discountList")) {
        return jsonResp({
            status: 200,
            message: "获取成功",
            data: []
        });
    }
    
    // ---- 用户信息 ----
    if (url.includes("user/base/getUserInfo") || url.includes("user/base/info")) {
        return jsonResp({
            status: 200,
            message: "获取成功",
            data: {
                uid: TARGET_UID,
                phone: TARGET_PHONE,
                nickname: FAKE_NICKNAME,
                avatar: "https://i.xiaotucc.com/default_avatar.png",
                openId: FAKE_OPENID,
                unionId: FAKE_UNIONID
            }
        });
    }
    
    // ---- 默认放行 ----
    return null;
}

// ==================== 主入口 ====================
// Loon 脚本格式
if (typeof $request !== 'undefined' && typeof $response !== 'undefined') {
    const result = intercept($request, $response);
    if (result) {
        $done({ response: result });
    } else {
        $done({});
    }
} else if (typeof $task !== 'undefined') {
    // Quantumult X 兼容
    $done({});
} else {
    // 直接导出（用于测试）
    console.log("Loon script loaded — 小兔充充劫持模块");
}
