#!/usr/bin/env node

const _proggers = require('cli-progress'),
      _commander = require('commander'),
      _colors = require('colors'),
      _fs = require('fs'),
      _$ = require('cheerio'),
      _url = require('url'),
      _https = require('https'),
      _async = require('async'),
      _version = '2.0.1';

const clacSize = (a,b) => {
    if(0==a)return "0 Bytes";
    var c=1024,
        d=b||2,
        e=["Bytes","KB","MB","GB","TB","PB","EB","ZB","YB"],
        f=Math.floor(Math.log(a)/Math.log(c));
    return parseFloat((a/Math.pow(c,f)).toFixed(d))+" "+e[f]
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
            DLfunc(dlurl, cb, u);
        });
    });
}

const DLfunc = (u, cb, o) => {
    const req = _https.get(u);

    console.log('⏳  '+_colors.yellow('Waiting Server Response...'));
    req.on('response', (res) => {

        if(!res.headers['content-disposition']){
            console.log('🔁  '+_colors.yellow('Server Download Error, Try To Get New Link...'));
            GetLinkFunc(o, cb)
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

_commander.version(`🔨  Version: ${_version}`, '-v, --version').usage('[options] <args>')
_commander.option('-d, --download <URL>', 'Download From URL, Can Be Multiple URL With Comma (https://zippy...,https://zippy)', (a) => {

    a = a.split(',')

    if(a.length > 1){
        _async.eachSeries(a,
            (a,b) => {
                console.log('⏳  '+_colors.yellow(`Get Page From : ${a}`))
                GetLinkFunc(a.trim(), b)
            },
            (err, res) => {
                console.log(`Batch Download Done`)
        })
    } else {
        console.log('⏳  '+_colors.yellow(`Get Page From : ${a[0]}`))
        GetLinkFunc(a[0], () => {})
    }
})
_commander.option('-b, --batch <FILE>', 'Get URL Download From File', (a) => {

    if (!_fs.existsSync(a)) {
        console.log(_colors.bgRed.white(`  File ${a} Not Found  `));
    } else {
        let file = _fs.readFileSync(a, 'utf8')
        file = file.split(/\r\n|\r|\n/)

        _async.eachSeries(file,
            (a,b) => {
                console.log('⏳  '+_colors.yellow(`Get Page From : ${a}`))
                GetLinkFunc(a.trim(), b)
            },
            (err, res) => {
                console.log(`Batch Download Done`)
        })
    }
})

_commander.parse(process.argv)

if (!process.argv.slice(2).length) {
    _commander.outputHelp()
    return;
}