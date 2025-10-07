/*
QQ 跳转解码模块
适用：Surge / Loon / Quantumult X
功能：自动提取 c.pc.qq.com、pingtas.qq.com、connect.qq.com 等跳转真实目标链接
*/

const rules = [
    /https:\/\/c\.pc\.qq\.com\/middlem\.html\?pfurl=(http[^&]+)&pfuin=/,
    /https:\/\/c\.pc\.qq\.com\/middlect\.html\?(?:iscontinue=.*&)?pfurl=(http[^&]+)&pfuin=/,
    /https:\/\/c\.pc\.qq\.com\/middlect\.html\?pfuin=.*&pfurl=(http[^&]+)&/,
    /https:\/\/c\.pc\.qq\.com\/index\.html\?pfurl=(http[^&]+)&pfuin=/,
    /https:\/\/pingtas\.qq\.com\/webview\/pingd.*url=.*pfurl%3d(http[^%]+)%26pfuin/,
    /https:\/\/cgi\.connect\.qq\.com\/qqconnectopen\/get_urlinfoForQQV2\?url=(http[^&]+)/,
    /https:\/\/c\.pc\.qq\.com\/ios\.html\?.*url=(http[^&]+)/
];

const requestUrl = $request.url;

function deepDecode(url, maxDepth = 5) {
    let prev = url, i = 0;
    while (i < maxDepth) {
        const decoded = decodeURIComponent(prev);
        if (decoded === prev) break;
        prev = decoded;
        i++;
    }
    return prev;
}

for (let re of rules) {
    const match = requestUrl.match(re);
    if (match && match[1]) {
        let decodedUrl = deepDecode(match[1]).trim();

        decodedUrl = decodedUrl.replace(/(%2f|\/)+$/gi, '');

        console.log(`[QQ跳转解码] 捕获链接 → ${decodedUrl}`);

        $done({
            response: {
                status: 302,
                headers: { Location: decodedUrl }
            }
        });
        return;
    }
}

console.log('[QQ跳转解码] 未匹配规则');
$done({});
