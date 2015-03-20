var ns = require('./b/ns')

function run() {
    console.log('umitm running')

    ns.run()
}

if (require.main === module) run()
