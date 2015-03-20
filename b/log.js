'use strict'
var chalk = require('chalk')

module.exports = function (a) {
    var log = function (b) {
        console.log(chalk.blue(a), chalk.green(b))
    }

    log.error = function (b) {
        console.log(chalk.blue(a), chalk.red(b))
    }

    return log
}
