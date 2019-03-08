#!/usr/bin/env node

const _proggers = require('cli-progress'),
      _colors = require('colors'),
      _fs = require('fs'),
      _$ = require('cheerio'),
      _url = require('url'),
      _https = require('https'),
      _async = require('async');

const stringit = () => {
    console.log(''+_colors.bgBlue('  FORMAT COMMAND  ')+`

`+_colors.bgGreen('  Download  ')+`
    zippydl <URL ZIPPYSHARE `+_colors.bgMagenta(' ex:xxx.zippyshare.com/d/xxxx/xxxx/xxxx ')+`>
`+_colors.bgGreen('  Download Batch  ')+`
    zippydl (-b | --batch) <list url file.txt>
`+_colors.bgGreen('  Check Version  ')+`
    zippydl (-v | --version)`);
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

const GetLinkFunc = (u, cb) => {
    const zippy = _https.get(u);

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
                url = _url.parse($('.flagen').attr('href'), true),
                urlori = _url.parse(u),
                key = url.query['key'],
                time = parseInt(/var a = ([0-9]+);$/gm.exec($('#dlbutton').next().html())[1]),
                dlurl = urlori.protocol+'//'+urlori.hostname+'/d/'+key+'/'+(Math.floor(time/3) + time)+'/DOWNLOAD';

            console.log('👌  '+_colors.green('Done'));
            console.log('🎁  '+_colors.yellow('Start Download From URL : '+dlurl));
            DLfunc(dlurl, cb);
        });
    });
}

const DLfunc = (u, cb) => {
    const req = _https.get(u);

    console.log('⏳  '+_colors.yellow('Waiting Server Response...'));
    req.on('response', (res) => {

        if(!res.headers['content-disposition']){
            console.log('🔁  '+_colors.yellow('Server Download Error, Try To Get New Link...'));
            GetLinkFunc(arg)
        } else {
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
                cb()
            });
            res.on('error', () => {
                _fs.unlink(filename);
                cb()
            })
        }
    })
}

const arg = process.argv[2];

if(arg === undefined){
    stringit()
} else if (arg.length && (arg === '-b' || arg === '--batch')) {
    if(process.argv.length !== 4){
        console.log(_colors.bgRed.white('  Please File Name  '));
    } else if (!_fs.existsSync(process.argv[3])) {
        console.log(_colors.bgRed.white(`  File ${process.argv[3]} Not Found  `));
    } else if (process.argv.length === 4 && _fs.existsSync(process.argv[3])) {
        let from = _fs.readFileSync(process.argv[3], 'utf8');
        from = from.split(/\r\n|\r|\n/);

        _async.eachSeries(from,
            (a,b) => {
                console.log('⏳  '+_colors.yellow(`Get Page From : ${a}`));
                GetLinkFunc(a, b);
            },
            (err, res) => {
                console.log(`Batch Download Done`)
        })
    }
} else if (arg.length && (arg === '-v' || arg === '--version')) {
    console.log(_colors.bgBlue.white('  Version : 1.2.7  '));
} else if (arg.length && !isURL(arg)) {
    console.log(_colors.bgRed.white('  Please Insert Valid URL  '));
    stringit()
} else if (arg.length && isURL(arg)) {
    console.log('⏳  '+_colors.yellow('Get Download Page...'));
    GetLinkFunc(arg, () => {})
}