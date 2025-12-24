/**
 * 新能充电 - 响应修改脚本
 * 修改用户余额显示
 */

let body = $response.body;
if (body) {
    let obj = JSON.parse(body);
    // 检查顶层或嵌套 obj 下的 readyaccountmoney
    if (obj && obj.readyaccountmoney !== undefined) {
        obj.readyaccountmoney = 999999;
    } else if (obj.obj && obj.obj.readyaccountmoney !== undefined) {
        obj.obj.readyaccountmoney = 999999;
    }
    $done({ body: JSON.stringify(obj) });
} else {
    $done({});
}
