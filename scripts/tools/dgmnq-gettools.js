/**
 * 电改模拟器 - getTools 响应修改脚本
 * 将返回 JSON 中 stat 字段改为 success（仅学习用途）
 */

let body = $response.body;

try {
    let obj = JSON.parse(body);

    if (obj && obj.method === "getTools") {
        obj.stat = "success";
        body = JSON.stringify(obj);
    }
} catch (e) {
    console.log("JSON parse error:", e);
}

$done({ body });
