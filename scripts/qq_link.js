/*
QQ 跳转解码模块（增强版）
适用：Surge / Loon / Quantumult X
功能：自动提取 c.pc.qq.com、pingtas.qq.com、connect.qq.com 等跳转真实目标链接
特性：自动识别并优先在默认浏览器打开，兼容 Chrome / Firefox / Edge / Opera，支持 iOS scheme
*/

function deepDecode(url, maxDepth = 10) {
    let prev = url, i = 0;
    while (i < maxDepth) {
        try {
            const decoded = decodeURIComponent(prev);
            if (decoded === prev) break;
            prev = decoded;
            i++;
        } catch {
            break;
        }
    }
    return prev;
}

function extractTargetUrl(rawUrl) {
    let decoded = deepDecode(rawUrl);

    const pfMatch = decoded.match(/[?&]pfurl=([^&]+)/i);
    if (pfMatch && pfMatch[1]) return deepDecode(pfMatch[1]);

    const inner = decoded.match(/url=([^&]+)/i);
    if (inner && inner[1]) {
        const innerDecoded = deepDecode(inner[1]);
        const pfMatch2 = innerDecoded.match(/[?&]pfurl=([^&]+)/i);
        if (pfMatch2 && pfMatch2[1]) return deepDecode(pfMatch2[1]);
    }

    const argMatch = decoded.match(/arg=([^&]+)/i);
    if (argMatch && argMatch[1]) {
        const innerArg = deepDecode(argMatch[1]);
        const pfMatch3 = innerArg.match(/[?&]pfurl=([^&]+)/i);
        if (pfMatch3 && pfMatch3[1]) return deepDecode(pfMatch3[1]);
    }

    return null;
}

const requestUrl = $request.url;
const target = extractTargetUrl(requestUrl);

if (target) {
    let finalUrl = target.trim();

    if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = "https://" + finalUrl.replace(/^\/+/, "");
    }
    finalUrl = finalUrl.replace(/(%2f|\/)+$/gi, '');

    // 提取协议与无协议部分
    const isHttps = /^https:/i.test(finalUrl);
    const stripped = finalUrl.replace(/^https?:\/\//i, "");

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>跳转到浏览器</title>
<style>
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    margin: 0;
    padding: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    color: white;
}
.container {
    text-align: center;
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(10px);
    padding: 40px 30px;
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    max-width: 90%;
    width: 400px;
}
.loading {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255,255,255,.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 1s ease-in-out infinite;
    margin-right: 10px;
}
@keyframes spin {
    to { transform: rotate(360deg); }
}
.url {
    background: rgba(0,0,0,0.2);
    padding: 10px;
    border-radius: 8px;
    margin: 20px 0;
    word-break: break-all;
    font-size: 14px;
    text-align: left;
}
.btn {
    background: white;
    color: #667eea;
    border: none;
    padding: 12px 30px;
    border-radius: 25px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    margin: 10px 5px;
    transition: transform 0.2s;
}
.btn:hover { transform: translateY(-2px); }
.disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>
</head>
<body>
<div class="container">
    <h2>🚀 即将跳转到浏览器</h2>
    <p>该页面将在QQ外部打开</p>
    <div class="url">${finalUrl}</div>
    <div style="margin: 20px 0;">
        <span class="loading"></span><span id="status">正在跳转...</span>
    </div>
    <div>
        <button id="openBtn" class="btn" onclick="openInBrowser()">立即打开</button>
        <button class="btn" onclick="copyUrl()">复制链接</button>
    </div>
</div>

<script>
const finalUrl = ${JSON.stringify(finalUrl)};
const stripped = ${JSON.stringify(stripped)};
const isHttps = ${isHttps};

let alreadyOpened = false;

setTimeout(() => openInBrowser(), 1200);

function tryOpenHref(url) {
    const a = document.createElement('a');
    a.href = url;
    a.rel = 'noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function openInBrowser() {
    if (alreadyOpened) return;
    alreadyOpened = true;

    const openBtn = document.getElementById('openBtn');
    const status = document.getElementById('status');
    if (openBtn) {
        openBtn.classList.add('disabled');
        openBtn.textContent = '已尝试打开';
    }
    if (status) status.textContent = '已尝试在外部浏览器打开';

    // 默认优先：直接打开系统浏览器
    tryOpenHref(finalUrl);

    // 延迟再尝试特定浏览器 scheme
    setTimeout(() => {
        const schemes = [
            isHttps ? 'googlechromes://' + stripped : 'googlechrome://' + stripped,
            'firefox://open-url?url=' + encodeURIComponent(finalUrl),
            'microsoft-edge-' + finalUrl,
            'edgemobile://' + stripped,
            'opera-http://' + stripped,
            finalUrl
        ];

        let idx = 0;
        function attemptNext() {
            if (idx >= schemes.length) return;
            tryOpenHref(schemes[idx++]);
            setTimeout(attemptNext, 300);
        }
        attemptNext();
    }, 500);
}

function copyUrl() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(finalUrl)
            .then(() => alert('✅ 链接已复制到剪贴板'))
            .catch(fallbackCopy);
    } else {
        fallbackCopy();
    }

    function fallbackCopy() {
        const textarea = document.createElement('textarea');
        textarea.value = finalUrl;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            alert('✅ 链接已复制到剪贴板');
        } catch {
            alert('❌ 复制失败，请手动复制：\\n' + finalUrl);
        }
        document.body.removeChild(textarea);
    }
}
</script>
</body>
</html>`;

    $done({
        response: {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
            body: html
        }
    });
} else {
    $done({});
}
