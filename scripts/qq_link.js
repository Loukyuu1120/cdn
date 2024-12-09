const rules = [
    { regex: /^https:\/\/c\.pc\.qq\.com\/middlem\.html\?pfurl=(http.*)&pfuin=.*/, url: '$1' },
    { regex: /^https:\/\/c\.pc\.qq\.com\/middlect\.html\?iscontinue=.*pfurl=(http.*)&pfuin=.*/, url: '$1' },
    { regex: /^https:\/\/c\.pc\.qq\.com\/middlect\.html\?pfuin=.*&pfurl=(http.*)&gjsublevel=.*/, url: '$1' },
    { regex: /^https:\/\/c\.pc\.qq\.com\/index\.html\?pfurl=(http.*)&pfuin=.*/, url: '$1' },
    { regex: /^https:\/\/pingtas\.qq\.com\/webview\/pingd\?dm=c\.pc\.qq\.com&pvi=\d+&si=s\d+&url=\/middlem\.html\?pfurl%3d(http.*)%26pfuin%3d.*%26pfuin%3d.*/, url: '$1' },
    { regex: /^https:\/\/cgi\.connect\.qq\.com\/qqconnectopen\/get_urlinfoForQQV2\?url=(http.*)/, url: '$1' },
    { regex: /^https:\/\/c\.pc\.qq\.com\/ios\.html\?.*url=(http.*)&(sub)?level=.*/,url: (match, url) => url.replace(/%2f$/, '') }
];

const requestUrl = $request.url;

for (let rule of rules) {
    if (rule.regex.test(requestUrl)) {
        const match = requestUrl.match(rule.regex);
        if (match && match[1]) {
            const decodedUrl = decodeURIComponent(match[1]);
            $done({ response: { status: 302, headers: { Location: decodedUrl } } });
        }
    }
}
$done({});
