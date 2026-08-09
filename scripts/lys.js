const headers = $request.headers;
const url = $request.url;

// ========== 检测视频m3u8请求 ==========
if (url.includes('/api/app/vid/m3u8/') && url.includes('.m3u8')) {

    console.log('检测到视频请求: ' + url);

    // 支持：
    // xxx.00po.shop
    // xxx.uzrclb-lys.shop
    let directUrl = url.replace(
        /\/\/[^\/]+\.(00po|uzrclb-lys)\.shop\//,
        '//oihqwlma.00po.shop/'
    );

    // 去掉秒数限制
    directUrl = directUrl.replace(/&seconds=\d+/, '');
    directUrl = directUrl.replace(/\?seconds=\d+&?/, '?');
    directUrl = directUrl.replace(/\?$/, '');

    // 清理重复参数
    let urlObj = new URL(directUrl);
    let params = new URLSearchParams(urlObj.search);
    let cleanParams = new URLSearchParams();

    // 保留重要参数，去除seconds
    for (let [key, value] of params) {
        if (key !== 'seconds' && key !== '') {
            cleanParams.append(key, value);
        }
    }

    let baseUrl = directUrl.split('?')[0];
    let cleanUrl = baseUrl + 
        (cleanParams.toString() ? '?' + cleanParams.toString() : '');

    console.log('转换后的视频链接: ' + cleanUrl);


    // 通知
    const title = '视频链接捕获成功';
    const subtitle = '>_ 点击此通知可跳转观看';


    if (typeof $task !== 'undefined') {
        // Quantumult X
        $notify(title, subtitle, '', {
            'open-url': cleanUrl
        });

    } else if (typeof $httpClient !== 'undefined') {
        // Shadowrocket
        $notification.post(title, subtitle, '', {
            'url': cleanUrl
        });

    } else if (typeof $loon !== 'undefined') {
        // Loon
        $notification.post(title, subtitle, '', {
            'openUrl': cleanUrl
        });
    }
}


// 返回原请求头
$done({
    response: {
        headers: headers
    }
});
