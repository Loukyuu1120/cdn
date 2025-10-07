/*
QQ 跳转解码模块
适用：Surge / Loon / Quantumult X
功能：自动提取 c.pc.qq.com、pingtas.qq.com、connect.qq.com 等跳转真实目标链接
*/

function deepDecode(url, maxDepth = 5) {
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

const requestUrl = $request.url;
const urlMatch = requestUrl.match(/[?&]pfurl=([^&]+)/i);

if (urlMatch && urlMatch[1]) {
    let rawUrl = urlMatch[1];
    let decodedUrl = deepDecode(rawUrl).trim();

    if (!/^https?:\/\//i.test(decodedUrl)) {
        decodedUrl = "https://" + decodedUrl.replace(/^\/+/, "");
    }

    decodedUrl = decodedUrl.replace(/(%2f|\/)+$/gi, '');

    const safariUrl = "x-safari://open?url=" + encodeURIComponent(decodedUrl);

    $done({
        response: {
            status: 302,
            headers: { Location: safariUrl }
        }
    });
} else {
    $done({});
}
