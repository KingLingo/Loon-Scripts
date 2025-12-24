// 参数化TX短信转发脚本 - Loon通知版
// 支持gotify和条件匹配转发

// 配置参数
const CONFIG = {
    gotifyUrl: 'https://gotify.cn/message',
    gotifyToken: '', // 需要填入你的gotify token
    conditionalUrl: 'http://127.0.0.1:8000/hsh?z5',
    // 正则匹配模式 - 匹配包含"权益超市"或"和生活"的内容
    matchPattern: /(权益超市|和生活)/i, // 添加了i标志，忽略大小写
    timeout: 10000,
    // 通知设置
    enableDetailedNotifications: true, // 是否启用详细通知
    enableDebugNotifications: false    // 是否启用调试通知
};

// 通知管理函数
function notify(type, title, message, subtitle = '') {
    const notifications = {
        success: { title: '✅ ' + title, subtitle },
        error: { title: '❌ ' + title, subtitle },
        info: { title: 'ℹ️ ' + title, subtitle },
        debug: { title: '🔍 ' + title, subtitle },
        warning: { title: '⚠️ ' + title, subtitle }
    };

    // 总是记录日志
    console.log(`[${type.toUpperCase()}] ${title}: ${message}`);

    // 根据配置决定是否发送通知
    if (type === 'debug' && !CONFIG.enableDebugNotifications) {
        return;
    }

    if (!CONFIG.enableDetailedNotifications && (type === 'info' || type === 'debug')) {
        return;
    }

    const notifyConfig = notifications[type] || notifications.info;
    $notification.post(notifyConfig.title, notifyConfig.subtitle, message);
}

// 验证配置
function validateConfig() {
    if (!CONFIG.gotifyToken) {
        notify('error', '配置错误', '必须提供gotify token');
        return false;
    }

    notify('info', '配置验证', '配置验证通过，脚本启动成功');
    notify('debug', '配置详情', `Gotify: ${CONFIG.gotifyUrl}\n条件URL: ${CONFIG.conditionalUrl}\n匹配模式: ${CONFIG.matchPattern}`);
    return true;
}

// 主函数
function main() {
    notify('info', '短信转发启动', '开始处理短信转发请求');

    if (!validateConfig()) {
        return;
    }

    let smsData;

    try {
        // 获取并解析请求体
        const txreqbody = $request.body;
        console.log("获取到的请求体:", txreqbody);

        smsData = JSON.parse(txreqbody);
        console.log("解析后的数据:", JSON.stringify(smsData, null, 2));

        notify('debug', '数据解析', '短信数据解析成功');

    } catch (error) {
        notify('error', '数据解析失败', `无法解析短信数据: ${error.toString()}`);
        return;
    }

    // 提取短信信息
    const smsInfo = extractSmsInfo(smsData);
    if (!smsInfo) {
        return;
    }

    // 构造完整消息
    const fullMessage = formatMessage(smsInfo);

    // 检查是否匹配条件
    const shouldForwardToConditional = checkMatchCondition(smsInfo.content);

    // 执行转发
    performForwarding(fullMessage, smsInfo.sender, shouldForwardToConditional);
}

// 提取短信信息
function extractSmsInfo(smsData) {
    try {
        const sender = smsData?.query?.sender ?? '未知号码';
        const content = smsData?.query?.message?.text ?? '获取短信内容失败';

        console.log(`发送号码: ${sender}`);
        console.log(`短信内容: ${content}`);

        if (content === '获取短信内容失败') {
            notify('error', '内容提取失败', '无法获取短信内容');
            return null;
        }

        notify('info', '短信信息', `来自: ${sender}\n内容: ${content.length > 50 ? content.substring(0, 50) + '...' : content}`);

        return { sender, content };

    } catch (error) {
        notify('error', '信息提取失败', `提取短信信息时出错: ${error.toString()}`);
        return null;
    }
}

// 格式化消息内容
function formatMessage({ sender, content }) {
    const currentTime = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Shanghai'
    });

    return `👤 发信人: ${sender}\n📅 时间: ${currentTime}\n📜 内容: ${content}`;
}

// 检查匹配条件
function checkMatchCondition(content) {
    const isMatch = CONFIG.matchPattern.test(content);

    console.log(`正则匹配检查:`);
    console.log(`   模式: ${CONFIG.matchPattern}`);
    console.log(`   内容: ${content}`);
    console.log(`   结果: ${isMatch ? '匹配' : '不匹配'}`);

    // 额外的调试信息 - 显示具体匹配的内容
    if (isMatch) {
        const matches = content.match(CONFIG.matchPattern);
        const matchedKeyword = matches ? matches[0] : '未知';
        console.log(`   匹配到的关键词: ${matchedKeyword}`);

        notify('success', '条件匹配', `检测到关键词"${matchedKeyword}"，将执行条件转发`);
    } else {
        notify('info', '条件检查', '短信内容不匹配设定条件，仅执行常规转发');
    }

    return isMatch;
}

// 执行转发操作
function performForwarding(message, sender, shouldForwardToConditional) {
    notify('info', '开始转发', '正在执行短信转发操作...');

    // 总是转发到Gotify
    forwardToGotify(message, sender);

    // 条件转发
    if (shouldForwardToConditional) {
        notify('info', '条件转发', '条件匹配成功，同时转发至条件URL');
        forwardToConditionalUrl(message);
    } else {
        notify('info', '转发完成', '已转发至Gotify，条件不匹配无条件转发');
    }
}

// 转发到Gotify
function forwardToGotify(message, sender) {
    const fullGotifyUrl = `${CONFIG.gotifyUrl}?token=${CONFIG.gotifyToken}`;

    const reqParams = {
        url: fullGotifyUrl,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0',
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({
            "title": `iPhone 🆕💬`,
            "message": message,
            "priority": 5
        }),
        timeout: CONFIG.timeout
    };

    console.log("发送请求到Gotify...");

    $httpClient.post(reqParams, (error, response, data) => {
        if (error) {
            notify('error', 'Gotify转发失败', `转发到Gotify时出错: ${error.toString()}`);
        } else {
            notify('success', 'Gotify转发成功', `状态码: ${response.status}，短信已推送至Gotify`);
            console.log("Gotify服务器响应:", data);
        }
    });
}

// 转发到条件URL
function forwardToConditionalUrl(message) {
    const reqParams = {
        url: CONFIG.conditionalUrl,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0',
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({
            "msg": message
        }),
        timeout: CONFIG.timeout
    };

    console.log("发送请求到条件URL...");

    $httpClient.post(reqParams, (error, response, data) => {
        if (error) {
            notify('error', '条件转发失败', `转发到条件URL时出错: ${error.toString()}`);
        } else {
            notify('success', '全部转发完成', `所有转发操作已完成\n状态: 条件匹配转发成功\n状态码: ${response.status}`);
            console.log("条件URL服务器响应:", data);
        }
    });
}

// 执行主函数
try {
    main();
} catch (error) {
    notify('error', '脚本执行错误', `脚本运行过程中出现未捕获的错误: ${error.toString()}`);
} finally {
    $done();
}