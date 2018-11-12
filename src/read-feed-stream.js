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
      if (type === 'post' && timestamp <= Date.now() + 5 * 60 * 1000) {
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

async function getProfile (sbot, userId) {
  const source = pull(sbot.links({
    source: userId,
    dest: userId,
    rel: 'about',
    values: true
  }))
  let profile = {}
  const iterator = toIterator(source)
  for await (const value of iterator) {
    const {
      value: {
        content: {
          name
        }
      }
    } = value
    if (name) profile.name = name
  }
  return profile
}

run()
