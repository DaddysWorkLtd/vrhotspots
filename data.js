// script moves data from transdb.json to sqllite database
const { Sequelize, Model, DataTypes } = require('sequelize');
const sequelize = new Sequelize('sqlite:database/transdb.sqlite');
// todo rename this to something meaningful

// routes
const low = require("lowdb"),
  // use synchronous file mode
  FileSync = require("lowdb/adapters/FileSync"),
  TRANS_DATA = "./database/transdb.json",
  USER_ID = "1",
  tdb = low(new FileSync(TRANS_DATA)),
  models= require('./models.js'),
  Word = models.Word,
  Translation = models.Translation

async function processLog(from,to) {
  await sequelize.sync()
  const coll = from + "_" + to
  // check the last entry time in the database and query after that time
  try {
    var maxTime = await Translation.max('timestamp',{where: {fromLang: from,toLang: to}})
  } catch (e) {
    console.log('dropped table?')
    maxTime = 0 // table doesn't exist
  }
  recs=tdb.get(coll)
    .filter(rec => {
      return !maxTime || Date(rec.ts) < Date(maxTime)
    }).value()
  for (const trans of recs) {
    translation = Translation.create({user_id: USER_ID,
      timestamp: trans.ts,
      fromLang: from,
      toLang: to,
      fromText: trans.in,
      toText: trans.out})
      // replace punctuation
      inText = trans.in.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase();
      for (inWord of inText.split(/\s+/)) {
        // cant upsert as not sure on indexining strategy (language and word, think there is an insert or create
        if (!inWord.trim()) continue
        console.log('searching for',inWord)
        await Word.findOne({ where: { fromLang: from, toLang: to, fromText: inWord } })
          .then( word => {
            if (word) {
              return word.update({lastTimestamp: trans.ts, occurances: word.occurances + 1})
            } else {
              const wordDef = {
                userId: USER_ID,
                fromLang: from,
                toLang: to,
                fromText: inWord,
                firstTimestamp: trans.ts,
                lastTimestamp: trans.ts,
                occurances: 1
              }
              console.log('created', inWord)
              word = Word.create(wordDef)
            }
          })
          .catch(e => {console.error("table not created yet?",e) })
      }
  }
}


processLog('en','nl')
processLog('nl','en')


/*
const sqlite = require ("sqlite-async")
var db
sqlite.open('./database/transdb.sqlite')
  .then(_db => {
    db = _db
  })
  .catch(err => {
    console.log(err.message)
  })
async function getDatabase() {
  try {
    // probably don't need to do this, you'd hope there is connection caching.
    if (!db) db = await sqlite.open('./database/transdb.sqlite')
    return db
  } catch (e) {
    console.error(e)
  }
}
//(async(dbs) => dbs=await sqlite.open('./database/test.dbs'))(dbs);
getDatabase()
  .then(_db=> {
    console.log('then',db)
  }
)
  .then( getDatabase )
  .then( processTranslations ) // do this as a one off?
function processTranslations(db) {
  console.log('process translations', db)
}
*/
