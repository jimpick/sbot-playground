// To run: node -r esm read-log

import delay from 'delay'
import chalk from 'chalk'
import SSB from './ssb';

const {red, green, yellow} = chalk

async function run () {
  try {
    const ssb = new SSB()
    await ssb.open()
    for await (const post of ssb.feed()) {
      const {timestamp, channel, text} = post
      if (timestamp > Date.now() + 5 * 60 * 1000) continue
      console.log(green('Date: ' + new Date(timestamp)))
      const {name} = await post.profile()
      name && console.log(yellow(`Author: ${name}`))
      channel && console.log(red(`Channel: #${channel}`))
      console.log('\n' + text + '\n\n')
      await delay(1000)
    }
    ssb.close()
  } catch (err) {
    console.error('Exception', err)
  }
}

run()
