/*
QQ 跳转解码模块
适用：Surge / Loon / Quantumult X
功能：qq拦截的链接跳转真实目标链接
特性：手动选择在指定浏览器或默认浏览器中打开，兼容 Chrome / Firefox / Edge 等，支持 iOS scheme
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
<title>选择浏览器</title>
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
.url {
    background: rgba(0,0,0,0.2);
    padding: 10px;
    border-radius: 8px;
    margin: 20px 0;
    word-break: break-all;
    font-size: 14px;
    text-align: left;
}
.button-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 25px;
}
.btn {
    background: white;
    color: #667eea;
    border: none;
    padding: 12px 20px;
    border-radius: 25px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, background-color 0.2s;
}
.btn:hover { transform: translateY(-2px); }
.btn.full-width {
    grid-column: 1 / -1;
}
.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: #eee !important;
    color: #888 !important;
}
</style>
</head>
<body>
<div class="container">
    <h2>🔗 选择操作</h2>
    <p>请选择一个浏览器打开下面的链接</p>
    <div class="url">${finalUrl}</div>
    <div class="button-grid">
        <button class="btn" onclick="openSafari(this)">Safari 打开</button>
        <button class="btn" onclick="openChrome(this)">Chrome</button>
        <button class="btn" onclick="openFirefox(this)">Firefox</button>
        <button class="btn" onclick="openEdge(this)">Edge</button>
        <button class="btn full-width" onclick="copyUrl()">复制链接</button>
    </div>
</div>


<script>
const finalUrl = ${JSON.stringify(finalUrl)};
const stripped = ${JSON.stringify(stripped)};
const isHttps = ${isHttps};

function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function tryOpenHref(url) {
    const a = document.createElement('a');
    a.href = url;
    a.rel = 'noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function postOpenAttempt(btn) {
    if (btn) {
        btn.classList.add('disabled');
        btn.textContent = '已尝试打开';
    }
}

// ✅ 自动执行默认打开（会在加载时立即跳转）
window.addEventListener('load', () => {
    try {
        location.href = finalUrl;
    } catch (e) {
        console.log('自动跳转失败', e);
    }
});

// ✅ Safari 打开（用户手动点击时触发）
function openSafari(btn) {
    const scheme = 'x-web-search://?' + finalUrl;
    tryOpenHref(scheme);
    postOpenAttempt(btn);
}

function openChrome(btn) {
    const scheme = isHttps ? 'googlechromes://' + stripped : 'googlechrome://' + stripped;
    tryOpenHref(scheme);
    postOpenAttempt(btn);
}

function openFirefox(btn) {
    const scheme = 'firefox://open-url?url=' + encodeURIComponent(finalUrl);
    tryOpenHref(scheme);
    postOpenAttempt(btn);
}

function openEdge(btn) {
    tryOpenHref('microsoft-edge-' + finalUrl);
    setTimeout(() => tryOpenHref('edgemobile://' + stripped), 200);
    postOpenAttempt(btn);
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
