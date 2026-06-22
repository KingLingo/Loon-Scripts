/**
 * 号易号卡 (com.jwhk.self) - 提现免身份证 响应修改脚本
 *
 * 绕过「佣金提现-身份证照片提交」前端校验：
 *   - account/get_withdrawal      : 顶层(及 data 下) is_upload -> 0
 *   - account/get_contract_upload : 把会要求上传的 code 归一为 2(=无需上传)
 *
 * 原理：提现页 do_distribution() 仅在 is_upload==1 时强制上传身份证人像面/国徽面，
 *       该标记由服务端下发、客户端全信任。置 0 后 App 自身流程即跳过照片校验，
 *       且提交工单(withdrawal/cash_advance)时 body 自动带 is_upload=0、照片为空。
 *
 * 仅供安全研究 / 学习使用。
 */

const url = $request.url || "";
let body = $response.body;

if (!body) {
    $done({});
} else {
    try {
        let obj = JSON.parse(body);
        let changed = false;

        if (url.indexOf("get_withdrawal") !== -1) {
            // is_upload: 1 / "1" -> 0（顶层）
            if (obj && obj.is_upload == 1) {
                obj.is_upload = 0;
                changed = true;
            }
            // 兼容个别版本把字段放在 data 下
            if (obj && obj.data && obj.data.is_upload == 1) {
                obj.data.is_upload = 0;
                changed = true;
            }
        } else if (url.indexOf("get_contract_upload") !== -1) {
            // 客户端逻辑：code∈{2,-2}=>is_upload=0；code==0=>报错；其它=>is_upload=1
            // 仅当当前 code 会触发"要求上传"(非 0/ -2/ 2)时，改为 2(无需上传)，保留其它字段
            if (obj && obj.code !== undefined) {
                const c = String(obj.code);
                if (c !== "0" && c !== "-2" && c !== "2") {
                    obj.code = 2;
                    changed = true;
                }
            }
        }

        if (changed) {
            console.log("[号易号卡] 已置 is_upload=0，绕过身份证照片校验 @ " + url);
            $done({ body: JSON.stringify(obj) });
        } else {
            $done({});
        }
    } catch (e) {
        console.log("[号易号卡] 响应解析失败: " + e);
        $done({});
    }
}
