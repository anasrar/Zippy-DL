#!/usr/bin/env node

const _proggers = require('cli-progress'),
    _commander = require('commander'),
    _colors = require('colors'),
    _fs = require('fs'),
    _$ = require('cheerio'),
    _url = require('url'),
    _https = require('https'),
    _axios = require('axios'),
    _async = require('async'),
    _version = require('./package.json').version

const clacSize = (a, b) => {
    if (0 == a) return "0 Bytes";
    var c = 1024,
        d = b || 2,
        e = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
        f = Math.floor(Math.log(a) / Math.log(c));
    return parseFloat((a / Math.pow(c, f)).toFixed(d)) + " " + e[f]
}

exports.GetLink = async (u) => {
    console.log('⏳  ' + _colors.yellow(`Get Page From : ${u}`))
    const zippy = await _axios({ method: 'GET', url: u }).then(res => res.data).catch(err => false)
    console.log('✅  ' + _colors.green('Done'))
    console.log('⏳  ' + _colors.yellow('Fetch Link Download...'))
    const $ = _$.load(zippy)
    const url = _url.parse($('.flagen').attr('href'), true)
    const urlori = _url.parse(u)
    const key = url.query['key']
    const time = eval($('#dlbutton').next().html().match(/\(([0-9%+\s]+)\)/m)[0].replace(/\(?\)?/gm, ""))
    const fileName = $('#dlbutton').next().html().match(/.+"\/(.+)";$/m)[0].split(' + "/')[1].replace('";',"")
    const dlurl = urlori.protocol + '//' + urlori.hostname + '/d/' + key + '/' + time + '/' + fileName
    console.log('✅  ' + _colors.green('Done'))
    return dlurl
}

exports.DLFunc = async (u, cb = () => { }) => {
    const url = await exports.GetLink(u)
    const req = await _https.get(url)
    console.log('🎁  ' + _colors.yellow('Start Download From URL : ' + url))
    console.log('⏳  ' + _colors.yellow('Waiting Server Response...'));
    await req.on('response', res => {
        if (!res.headers['content-disposition']) {
            console.log('🔁  ' + _colors.blue('Server Download Error, Try To Get New Link...'))
            exports.DLFunc(u, cb)
        } else {
            console.log('✅  ' + _colors.green('Server Response'))
            const size = parseInt(res.headers['content-length'], 10),
                filename = decodeURIComponent(res.headers['content-disposition'].match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/)[1])
            let currentSize = 0
            console.log('☕  ' + _colors.yellow('Start Downloading File : ' + filename))
            const file = _fs.createWriteStream(filename)
            res.pipe(file)
            const loadbar = new _proggers.Bar({
                format: 'Downloading ' + _colors.green('{bar}') + ' {percentage}% | {current}/{size} | ETA: {eta}s | Speed: {speed}',
                barsize: 25
            }, _proggers.Presets.shades_classic)
            loadbar.start(size, 0, {
                size: clacSize(size, 3),
                current: clacSize(currentSize, 3),
                speed: 0
            })
            res.on('data', c => {
                currentSize += c.length;
                loadbar.increment(c.length, {
                    speed: clacSize(c.length),
                    current: clacSize(currentSize, 3)
                })
            })
            res.on('end', _ => {
                loadbar.stop()
                file.close()
                console.log('✅  ' + _colors.green('Success Download File : ' + filename))
                cb()
            })
            res.on('error', _ => {
                loadbar.stop()
                console.log('❎  ' + _colors.green('Error Download File : ' + filename))
                cb()
            })
        }
    })
}

_commander.option('-d, --download <URL>', 'Download From URL, Can Be Multiple URL With Comma "https://zippy...,https://zippy"', a => {
    a = a.split(',')
    if (a.length > 1) {
        _async.eachSeries(a, (a, b) => { exports.DLFunc(a.trim(), b) }, (err, res) => { console.log(`Batch Download Done`) })
    } else {
        exports.DLFunc(a[0], () => { })
    }
})
_commander.option('-b, --batch <FILE>', 'Get URL Download From File', (a) => {
    if (!_fs.existsSync(a)) {
        console.log(_colors.bgRed.white(`  File ${a} Not Found  `));
    } else {
        let file = _fs.readFileSync(a, 'utf8')
        file = file.split(/\r\n|\r|\n/)
        _async.eachSeries(file, (a, b) => { exports.DLFunc(a.trim(), b) }, (err, res) => { console.log(`Batch Download Done`) })
    }
})
_commander.version(`🔨  Version: ${_version}`, '-v, --version').usage('[options] <args>').name('zippydl')
_commander.parse(process.argv)
if (!process.argv.slice(2).length) {
    _commander.outputHelp()
    return
}