import ssbClient from 'ssb-client'
import pull from 'pull-stream'
import { promisify } from 'util'

const openSsbClient = promisify(ssbClient)

async function run () {
  try {
    const sbot = await openSsbClient()
    console.log('Jim ready', sbot)
    const whoamiAsync = promisify(sbot.whoami)
    const whoami = await whoamiAsync()
    console.log('Jim whoami', whoami)
    pull(
      sbot.createUserStream({id: whoami.id}),
      pull.collect((err, msgs) => {
        if (err) throw err
        msgs.forEach(msg => {
          console.log(JSON.stringify(msg, null, 2))
        })
      })
    )
    sbot.close()
  } catch (err) {
    console.error('Exception', err)
  }
}

run()
