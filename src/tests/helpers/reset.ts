import { MongoClient } from 'mongodb'

/* istanbul ignore next */
const resetAllCollections = async (c: MongoClient) => {
  try {
    await c.connect()
    await c.db('testDB').collection('aggregatedHolders').deleteMany({})
    await c.db('testDB').collection('transfers').deleteMany({})
    await c.db('testDB').collection('syncData').deleteMany({})
  } finally {
    await c.close()
  }
}

export { resetAllCollections }
