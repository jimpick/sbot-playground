// To run: node -r esm read-log

import ssbClient from 'ssb-client'
import pull from 'pull-stream'
import toIterator from 'pull-stream-to-async-iterator'
import { promisify } from 'util'

const openSsbClient = promisify(ssbClient)

async function run () {
  try {
    const sbot = await openSsbClient()
    const whoamiAsync = promisify(sbot.whoami)
    const whoami = await whoamiAsync()
    const source = pull(sbot.createUserStream({id: whoami.id}))
    const iterator = toIterator(source)
    for await (const value of iterator) {
      const {
        value: {
          timestamp,
          content: {
            type,
            channel,
            text,
            reply
          }
        }
      } = value
      if (type === 'post' && !reply) {
        console.log('Date: ' + new Date(timestamp))
        if (channel) {
          console.log(`Channel: #${channel}`)
        }
        console.log('\n' + text + '\n\n')
        // console.log(JSON.stringify(value, null, 2)) + '\n\n'
      }
    }
    sbot.close()
  } catch (err) {
    console.error('Exception', err)
  }
}

run()
