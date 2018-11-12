// To run: node -r esm read-log

import ssbClient from 'ssb-client'
import pull from 'pull-stream'
import toIterator from 'pull-stream-to-async-iterator'
import delay from 'delay'
import chalk from 'chalk'
import { promisify } from 'util'

const openSsbClient = promisify(ssbClient)

async function run () {
  try {
    const sbot = await openSsbClient()
    const source = pull(sbot.createFeedStream({
      gt: Date.now() - 60 * 60 * 1000, // 1 hour
      live: true
    }))
    const iterator = toIterator(source)
    for await (const value of iterator) {
      if (!value.value) continue
      const {
        value: {
          timestamp,
          author,
          content: {
            type,
            channel,
            text,
            reply
          }
        }
      } = value
      if (type === 'post') {
        console.log(chalk.green('Date: ' + new Date(timestamp)))
        const profile = await getProfile(sbot, author)
        if (profile) {
          console.log(chalk.yellow(`Author: ${profile.name}`))
        }
        if (channel) {
          console.log(chalk.red(`Channel: #${channel}`))
        }
        console.log('\n' + text + '\n\n')
        // console.log(JSON.stringify(value, null, 2)) + '\n\n'
        await delay(1000)
      }
    }
    sbot.close()
  } catch (err) {
    console.error('Exception', err)
  }
}

function getProfile (sbot, userId) {
  return new Promise((resolve, reject) => {
    pull(
      sbot.links({
        source: userId,
        dest: userId,
        rel: 'about',
        values: true
      }),
      pull.collect(function (err, msgs) {
        if (err) return reject(err)
        const profile = msgs.reduce((acc, data) => {
          const {
            value: {
              content: {
                name
              }
            }
          } = data
          const result = {...acc}
          if (name) result.name = name
          return result
        }, {})
        resolve(profile)
      })
    )
  })
}

run()
