var ssbClient = require('ssb-client')
ssbClient(function (err, sbot) {
  if (err)
    throw err

	console.log('Jim ready', sbot)
  // sbot is now ready. when done:
  sbot.close()
})
