'use strict'
var async = require('async')
var dns = require('dns')
var dns2 = require('native-dns')
var _ = require('lodash')
var chalk = require('chalk')
var util = require('util')

var log = require('./log')('ns')
var settings = require('../ns_settings.json')

dns.setServers(['8.8.8.8', '8.8.4.4'])

/* https://msdn.microsoft.com/en-us/library/windows/desktop/cc982162(v=vs.85).aspx */
var DNS_TYPE = {
    A:      0x0001,
    NS:     0x0002,
    CNAME:  0x0005,
    SOA:    0x0006,
    PTR:    0x000c,
    MX:     0x000f,
    TEXT:   0x0010,
    AAAA:   0x001c,
    SRV:    0x0021,
    ANY:    0x00ff
}

var _typeStr = _.transform(DNS_TYPE, (res, val, key) => { res[val] = key })

function typeStr(x) {
    return _typeStr[x] || util.format('BAD (%d)', x)
}

var TTL_OFFLINE = 600
var TTL_ONLINE = TTL_OFFLINE * 0.1

var _push = Array.prototype.push

function resolve(x, done) {
    var known
    if (known = settings.known[x.name]) {
        var result = []
        if (x.type === DNS_TYPE.A || x.type === DNS_TYPE.ANY) {
            _push.apply(result, _.toArray(known.A).map(
                a => dns2.A({name: x.name, address: a, ttl: TTL_OFFLINE})))
        }
        return void done(null, result.length? result: null)
    }

    if (x.type === DNS_TYPE.A || x.type === DNS_TYPE.ANY) {
        dns.resolve(x.name, 'A', function (err, res) {
            if (err) {
                dnsError(err)
                return void done(null, null)
            }
            done(null, res.map(
                a => dns2.A({name: x.name, address: a, ttl: TTL_ONLINE})))
        })
    }
    else if (x.type === DNS_TYPE.MX) {
        dns.resolve(x.name, 'MX', function (err, res) {
            if (err) {
                dnsError(err)
                return void done(null, null)
            }
            done(null, res.map(
                a => dns2.MX(_.extend({name: x.name, ttl: TTL_ONLINE}, a))))
        })
    }
    else done(null, null)
}

function onRequest(req, res) {
    log('request: ' + req.question.map(_logRequest))

    async.map(req.question, resolve, function (err, result) {
        res.answer = _(result).filter().flatten().value()
        res.send()
    })
}

function _logRequest(x) {
    var known = x.name in settings.known
    return ((known? chalk.magenta: chalk.blue)
            (x.name + (known? ' [known] ': ' ') + typeStr(x.type)))
}

function onError(err) {
    log.error('server error')
    console.error('^ ' + err.stack)
}

function socketListening(host, port) {
    log('up on ' + host + ':' + port)
}

function socketClose() {
    log('down')
}

function socketError(err) {
    log.error('socket error')
    console.error('^ ' + err)
}

function dnsError(err) {
    log.error('dns error')
    console.error('^ ' + err)
}

function run() {
    var host = '0.0.0.0'
    var port = process.env.PORT || 12353
    var server = dns2.createServer()

    server.on('request', onRequest)
    server.on('error', onError)
    server.on('listening', socketListening.bind(null, host, port))
    server.on('close', socketClose)
    server.on('socketError', socketError)

    server.serve(port, host)
}

module.exports = {run: run}
