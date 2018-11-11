import ssbClient from 'ssb-client'
import pull from 'pull-stream'
import toIterator from 'pull-stream-to-async-iterator'
import { promisify } from 'util'

const openSsbClient = promisify(ssbClient)

async function run () {
  try {
    const sbot = await openSsbClient()
    console.log('Jim ready', sbot)
    const whoamiAsync = promisify(sbot.whoami)
    const whoami = await whoamiAsync()
    console.log('Jim whoami', whoami)
    const source = pull(
      sbot.createUserStream({id: whoami.id}),
      pull.asyncMap((value, cb) => {
        console.log('Jim sleep 1s')
        setTimeout(() => {
          cb(null, value)
        }, 1000)
      })
    )
    const iterator = toIterator(source)
    for await (const value of iterator) {
      console.log(JSON.stringify(value, null, 2))
    }
    sbot.close()
  } catch (err) {
    console.error('Exception', err)
  }
}

run()
