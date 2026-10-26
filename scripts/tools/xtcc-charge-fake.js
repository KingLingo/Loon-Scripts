/**
 * Loon http-response 脚本 — 「小兔充充」充值入口解锁
 * 功能:
 *   1) wallet/index/balance 响应余额改成 <500 (绕过 chooseMoney 的 walletMoney>=500 阻断)
 *   2) user/user_device/list 注入设备 2412530491 为常用绑定设备
 * 仅响应伪造(UI显示), 不改服务端数据
 */

var url=$request.url||"";
var body=$response.body||"";
var data={};
try{data=JSON.parse(body);}catch(e){}

// ---- 余额改低 (解锁充值入口) ----
if(url.indexOf("wallet/index/balance")>=0){
  if(data.status===200 && data.data){
    data.data.money="10.00";    // 总余额 <500
    data.data.self="10.00";     // 自有余额
    data.data.present="0.00";
    console.log("[XTCC] balance 余额改 10.00 (原: "+(body.substring(0,150))+")");
  }
  $done({body:JSON.stringify(data)});
}

// ---- 注入设备 ----
else if(url.indexOf("user_device/list")>=0){
  var dev={
    id: 9999999, did: 9999999,
    name: "测试桩-0491", no: "2412530491", dno: "2412530491",
    type: 4, port: 10, freePort: 10, offline: 2,
    promotionAble: -1, enable: 1,
    uid: (data.data&&data.data[0]&&data.data[0].uid)||1
  };
  if(data.status===200){
    if(!Array.isArray(data.data))data.data=[];
    data.data.push(dev);
    console.log("[XTCC] 注入设备 2412530491 到 user_device/list");
  }else{
    data={status:200,message:"请求成功",data:[dev]};
  }
  $done({body:JSON.stringify(data)});
}
else{$done({});}
