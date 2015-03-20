'use strict'
var ns = require('./b/ns')
var log = require('./b/log')('umitm')

function run() {
    log('running')

    ns.run()
}

if (require.main === module) run()
