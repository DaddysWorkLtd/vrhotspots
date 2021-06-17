// script moves data from transdb.json to sqllite database
const { Sequelize, Model, DataTypes } = require('sequelize');
const sequelize = new Sequelize('sqlite:database/transdb.sqlite');

class Translation extends Model {}
Translation.init({
  translationId: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement:true},
  userId: DataTypes.TEXT('tiny'),
  timestamp: DataTypes.DATE,
  fromLang: DataTypes.TEXT('tiny'),
  toLang: DataTypes.TEXT('tiny'),
  fromText: DataTypes.TEXT('tiny'),
  toText: DataTypes.TEXT('tiny')
}, {sequelize,modelName:"translation",underscored: true, timestamps: false})

class Word extends Model {}
Word.init({
  wordId: {type: DataTypes.INTEGER,primaryKey:true,autoIncrement:true},
  userId: DataTypes.TEXT('tiny'),
  fromLang: DataTypes.TEXT('tiny'),
  toLang: DataTypes.TEXT('tiny'),
  fromText: DataTypes.TEXT('tiny'),
  toText: DataTypes.TEXT('tiny'),
  firstTimestamp: DataTypes.DATE,
  lastTimestamp:DataTypes.DATE,
  occurances:DataTypes.INTEGER
}, {sequelize,modelName:"word",underscored: true, timestamps: false})

class Question extends Model {}
Question.init({
  questionId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  wordId: DataTypes.INTEGER,
  reverse: DataTypes.BOOLEAN,
  distractors: DataTypes.INTEGER,
  answer_wordId: DataTypes.INTEGER
}, {sequelize,modelName:"question",underscored: true, timestamps: true})

async function createTables() {
  try {
    await sequelize.sync();
  } catch (e) {
    console.error(e.message)
  }
}

createTables()

module.exports = { Word: Word, Translation: Translation, sequelize: sequelize, Question: Question, Sequelize: Sequelize }

