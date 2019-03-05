const _proggers = require('cli-progress'),
      _colors = require('colors'),
      _fs = require('fs'),
      _$ = require('cheerio'),
      _url = require('url'),
      _https = require('https');

const stringit = () => {
    console.log(_colors.bgBlue('  FORMAT COMMAND  '));
    console.log('node app.js <URL ZIPPYSHARE '+_colors.bgMagenta(' ex:xxx.zippyshare.com/d/xxxx/xxxx/xxxx ')+'>')
}

const clacSize = (a,b) => {
    if(0==a)return "0 Bytes";
    var c=1024,
        d=b||2,
        e=["Bytes","KB","MB","GB","TB","PB","EB","ZB","YB"],
        f=Math.floor(Math.log(a)/Math.log(c));
    return parseFloat((a/Math.pow(c,f)).toFixed(d))+" "+e[f]
}
const isURL = (a) => {
    var urlRegex = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
    var url = new RegExp(urlRegex, 'i');
    return a.length < 2083 && url.test(a);
}

const DLfunc = (u) => {
    const req = _https.get(u);

    console.log('⏳  '+_colors.yellow('Waiting Server Response...'));
    req.on('response', (res) => {
        console.log('✅  '+_colors.green('Server Response'));
        
        let size = parseInt(res.headers['content-length'], 10),
           currentSize = 0,
           filename = decodeURIComponent(res.headers['content-disposition'].match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/)[1]);

        console.log('☕  '+_colors.yellow('Start Downloading File : '+filename));

        const file = _fs.createWriteStream(filename);
        res.pipe(file)

        const loadbar = new _proggers.Bar({
            format: 'Downloading '+ _colors.green('{bar}') +' {percentage}% | {current}/{size} | ETA: {eta}s | Speed: {speed}'
        }, _proggers.Presets.shades_classic);
        loadbar.start(size, 0, {
            size: clacSize(size, 3),
            current: clacSize(currentSize, 3)
        });

        res.on('data', (c) => {
            currentSize += c.length;
            loadbar.increment(c.length, {
                speed: clacSize(c.length, 3),
                current: clacSize(currentSize, 3)
            });
        });
        res.on('end', () => {
            loadbar.stop();
            file.close();
            console.log('✅  '+_colors.green('Success Download File : '+filename));
        });
        res.on('error', () => {
            _fs.unlink(filename);
        })
    })
}

const arg = process.argv[2];

if(arg === undefined){
    stringit()
} else if (arg.length && !isURL(arg)) {
    console.log(_colors.bgYellow.black('  Please Insert Valid URL  '));
    stringit()
} else if (arg.length && isURL(arg)) {
    console.log('⏳  '+_colors.yellow('Get Download Page...'));
    const zippy = _https.get(arg);

    zippy.on('response', (res) => {
        console.log('👌  '+_colors.green('Done'));
        console.log('⏳  '+_colors.yellow('Fetch Link Download...'));
        res.setEncoding('utf8');
        let body = '';
        res.on('data', (c) => {
            body += c;
        });
        res.on('end', () => {
            let $ = _$.load(body),
                url = _url.parse($('#video').attr('poster'), true),
                urlori = _url.parse(arg),
                key = url.query['key'],
                time = parseInt(url.query['time']),
                dlurl = urlori.protocol+'//'+urlori.hostname+'/d/'+key+'/'+(Math.floor(time/3) + time)+'/DOWNLOAD';

            console.log('👌  '+_colors.green('Done'));
            console.log('🎁  '+_colors.yellow('Start Download From URL : '+dlurl));
            DLfunc(dlurl);
        });
    });
}