var async = require('async')
var dns = require('dns')
var dns2 = require('native-dns')

function resolve(x, done) {
    done(null, {name: x.name, address: '127.0.0.1', ttl: 666})
}

function onRequest(req, res) {
    console.log('ns request: ' + req.question.map(x => x.name))

    async.map(req.question, resolve, function (err, result) {
        res.answer = result.map(dns2.A)
        res.send()
    })
}

function onError(err) {
    console.log('ns server error')
    console.error('^ ' + err.stack)
}

function socketListening(host, port) {
    console.log('ns up on ' + host + ':' + port)
}

function socketClose() {
    console.log('ns down')
}

function socketError(err) {
    console.log('ns socket error')
    console.error('^ ' + err)
}

function run() {
    var host = '0.0.0.0'
    var port = 12353
    var server = dns2.createServer()

    server.on('request', onRequest)
    server.on('error', onError)
    server.on('listening', socketListening.bind(null, host, port))
    server.on('close', socketClose)
    server.on('socketError', socketError)

    server.serve(port, host)
}

module.exports = {run: run}
