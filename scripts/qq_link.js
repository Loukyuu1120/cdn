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

    $done({
        response: {
            status: 302,
            headers: { Location: finalUrl }
        }
    });
} else {
    $done({});
}
