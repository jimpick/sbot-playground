import ssbClient from 'ssb-client'
import pull from 'pull-stream'
import toIterator from 'pull-stream-to-async-iterator'
import { promisify } from 'util'

const openSsbClient = promisify(ssbClient)

export default class SSB {
  async open () {
    this.sbot = await openSsbClient()
  }

  close () {
    this.sbot.close()
  }

  feed () {
    const maxTimestamp = Date.now() + 5 * 60 * 1000
    const source = pull(
      this.sbot.createFeedStream({
        gt: Date.now() - 4 * 60 * 60 * 1000, // 4 hours
        live: true }),
      pull.filter(data => data.value),
      pull.filter(data => data.value.content.type === 'post'),
      pull.filter(data => data.timestamp < maxTimestamp),
      pull.map(data => new Post(this, data))
    )
    return toIterator(source)
  }
}

class Post {
  constructor (ssb, data) {
    this.ssb = ssb
    const {
      value: {
        timestamp,
        author,
        content: {
          type,
          channel,
          text
        }
      }
    } = data
    this.timestamp = timestamp
    this.author = author
    this.type = type
    this.channel = channel
    this.text = text
  }

  async profile () {
    const source = pull(this.ssb.sbot.links({
      source: this.author,
      dest: this.author,
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
}
