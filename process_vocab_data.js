// this is a script for transferring data from json to sqllite, it translates as it goes - could do with a better name!
// lowercase
// strip out all punctuation and non letters except apostrophe

// script moves data from transdb.json to sqllite database
const { Sequelize, Model, DataTypes } = require('sequelize');
const sequelize = new Sequelize('sqlite:database/transdb.sqlite');

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

const {Translate} = require('@google-cloud/translate').v2;
const projectId = 'vr-vocab-123';
const translater = new Translate({projectId});

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
      // replace punctuation and numbers - - strip off de/het?
      inText = trans.in.replace(/[[^A-z\s']/gm,"").toLowerCase();
      for (inWord of inText.split(/\s+/)) {
        // cant upsert as not sure on indexining strategy (language and word, think there is an insert or create
        if (!inWord.trim()) continue
//        console.log('searching for',inWord)
        await Word.findOne({ where: { fromLang: from, toLang: to, fromText: inWord } })
          .then( word => {
            if (word) {
              return word.update({lastTimestamp: trans.ts, occurances: word.occurances + 1})
            } else {
              const wordDef = {
                userId: USER_ID,
                fromLang: from,
                toLang: to,
                fromText: inWord.trim(),
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
async function lookupWords() {
  words = await Word.findAll({ where: { toText:null } })
  words.forEach(async word => {
    try {
      // getting socket hangup errors so slowing it down
      await new Promise(resolve => setTimeout(resolve, 500));
      let [toText] = await translater.translate(word.fromText, {to: word.toLang, from: word.fromLang});
      if (toText) {
        word.toText = toText.toLowerCase().trim()
        console.log('translated', word.fromText, word.toText)
        // this happens when word is not valid for language, disable incase it appears again
        if (word.fromText == word.toText) {
          word.disabled = new Date()
        }
        word.save()
      }
    } catch(e) {
      console.log("translation error", word.fromText, word.totext, e)
    }
  })
}


processLog('en','nl')
processLog('nl','en')
// todo: lookup from cache where possible
// we look up everything again even if we have it in the json db just because its small at the moment
lookupWords()
// what about the audio?
// get audio getAudio(language)
// google image search? word hippo example?
// crossword