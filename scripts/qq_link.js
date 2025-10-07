/*
QQ 跳转解码模块
适用：Surge / Loon / Quantumult X
功能：自动提取 c.pc.qq.com、pingtas.qq.com、connect.qq.com 等跳转真实目标链接
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
    if (pfMatch && pfMatch[1]) {
        return deepDecode(pfMatch[1]);
    }

    const inner = decoded.match(/url=([^&]+)/i);
    if (inner && inner[1]) {
        const innerDecoded = deepDecode(inner[1]);
        const pfMatch2 = innerDecoded.match(/[?&]pfurl=([^&]+)/i);
        if (pfMatch2 && pfMatch2[1]) {
            return deepDecode(pfMatch2[1]);
        }
    }

    const argMatch = decoded.match(/arg=([^&]+)/i);
    if (argMatch && argMatch[1]) {
        const innerArg = deepDecode(argMatch[1]);
        const pfMatch3 = innerArg.match(/[?&]pfurl=([^&]+)/i);
        if (pfMatch3 && pfMatch3[1]) {
            return deepDecode(pfMatch3[1]);
        }
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

    // const safariUrl = "x-safari://open?url=" + encodeURIComponent(finalUrl);

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
        .btn:hover {
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>🚀 即将跳转到浏览器</h2>
        <p>该页面将在QQ外部打开</p>
        <div class="url">${finalUrl}</div>
        <div style="margin: 20px 0;">
            <span class="loading"></span>正在跳转...
        </div>
        <div>
            <button class="btn" onclick="openInBrowser()">立即打开</button>
            <button class="btn" onclick="copyUrl()">复制链接</button>
        </div>
    </div>

    <script>
        // 自动跳转
        setTimeout(() => {
            openInBrowser();
        }, 2000);

        function openInBrowser() {
            // 尝试多种方式打开外部浏览器
            const urls = [
                'googlechrome://' + '${finalUrl}',
                'firefox://open-url?url=' + encodeURIComponent('${finalUrl}'),
                'opera-http://' + '${finalUrl}',
                'edgemobile://' + '${finalUrl}',
                '${finalUrl}'
            ];
            
            let opened = false;
            for (let i = 0; i < urls.length - 1; i++) {
                const link = document.createElement('a');
                link.href = urls[i];
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                opened = true;
                break;
            }
            
            // 如果特定浏览器方案都失败，使用最后的后备方案（直接链接）
            if (!opened) {
                window.location.href = urls[urls.length - 1];
            }
        }

        function copyUrl() {
            const textarea = document.createElement('textarea');
            textarea.value = '${finalUrl}';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            alert('链接已复制到剪贴板');
        }
    </script>
</body>
</html>`;

    $done({
        response: {
            status: 200,
            headers: {
                "Content-Type": "text/html; charset=utf-8"
            },
            body: html
        }
    });
} else {
    $done({});
}
