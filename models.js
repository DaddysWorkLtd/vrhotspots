// script moves data from transdb.json to sqllite database
const {Sequelize, Model, DataTypes} = require('sequelize');
const sequelize = new Sequelize('sqlite:database/transdb.sqlite');

class Translation extends Model {
}

Translation.init({
    translationId: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    userId: DataTypes.TEXT('tiny'),
    timestamp: DataTypes.DATE,
    fromLang: DataTypes.TEXT('tiny'),
    toLang: DataTypes.TEXT('tiny'),
    fromText: DataTypes.TEXT('tiny'),
    toText: DataTypes.TEXT('tiny')
}, {sequelize, modelName: "translation", underscored: true, timestamps: false})

class Word extends Model {
}

Word.init({
    wordId: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    userId: DataTypes.TEXT('tiny'),
    fromLang: DataTypes.TEXT('tiny'),
    toLang: DataTypes.TEXT('tiny'),
    fromText: DataTypes.TEXT('tiny'),
    toText: DataTypes.TEXT('tiny'),
    firstTimestamp: DataTypes.DATE,// first tested, used for ensuring data is not imported twice
    lastTimestamp: DataTypes.DATE,// last tested... next test due?
    occurances: DataTypes.INTEGER, // that's how many times seen in translation requests - uniqueness/difficulty?
    disabled: DataTypes.DATE
}, {sequelize, modelName: "word", underscored: true, timestamps: false})

class WordLearning extends Model {
} // maybe WordPerformance
// how do we deal with reverse, is that a separate question (entry in word)
WordLearning.init({
    wordId: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    firstTested: DataTypes.DATE,
    lastTested: DataTypes.DATE,
    nextRepetition: DataTypes.DATE,
    repetitions: DataTypes.INTEGER,
    correctRate: DataTypes.INTEGER, // to 100
    lastConfidence: DataTypes.INTEGER, // *100
    lastTime: DataTypes.INTEGER, // Standardised Score - 100 = Median
    consecutiveCorrect: DataTypes.INTEGER,
    lastDistracted: DataTypes.DATE // when given as a wrong answer, triggers recalculation of nextRepetition
}, {sequelize, modelName: "wordLearning", underscored: true, timestamps: false})


class Question extends Model {
    async processAnswer(answerWordId, confidence = .5) {
        // todo: random element, from time elapsed based on relative (z score), also cumulative correct
        // not sure what the profile is of this.
        // this needs to be exposed for unit testing
        function _getNextInterval(lastInterval, confidence, correct) {
            // interval = 3 ^ (offset + confidence)*2
            const offset = correct ? -0.35 : -1
            return (3 ** ((offset + confidence) * 2)) * lastInterval
        }

        const now = new Date()
        this.answerWordId = answerWordId
        this.save()
        // now update performance stats
        const correct = (answerWordId == this.wordId)
        // update statistics and set next repetition date
        const [wordTested, firstTest] = await WordLearning.findOrCreate({
            where: {wordId: this.wordId},
            defaults: {
                firstTested: now,
                repetitions: 0,
                consecutiveCorrect: 0
            }
        })
        if (firstTest) {
            wordTested.correctRate = correct ? 100 : 0
            // last period is a day in ms
            var lastPeriod = 1 * 60 * 60 * 24 * 1000
        } else {
            const totalCorrect = Math.round(wordTested.correctRate * wordTested.repetitions / 100, 0)
            if (correct) {
                wordTested.correctRate = (totalCorrect + 1) * 100 / (wordTested.repetitions + 1)
            } else {
                wordTested.correctRate = (totalCorrect) * 100 / (wordTested.repetitions + 1)
            }
            var lastPeriod = Math.round(wordTested.nextRepetition - wordTested.lastTested)
        }
        wordTested.lastTested = now
        wordTested.lastConfidence = confidence
        wordTested.repetitions++
        // time taken to submit answer
        wordTested.lastTime = now - this.createdAt
        let interval = _getNextInterval(lastPeriod, confidence, correct)
        wordTested.nextRepetition = new Date(now.getTime() + interval)
        if (correct) {
            // why is this property not found
            wordTested.consecutiveCorrect += 1
        } else {
            // why is this property not found
            wordTested.consecutiveCorrect = 0
            // process incorrect distractor, alter what? lastDistracted?
            const distracted = await WordLearning.findByPk(answerWordId)
            // only do something if this disractor has been tested - has performance data
            if (distracted) {
                // if last answer was correct then now recalculate
                distracted.lastDistracted = now
                if (distracted.consecutiveCorrect) {
                    distracted.consecutiveCorrect = 0;
                    let oldPeriod = Math.round(wordTested.nextRepetition - wordTested.lastTested)
                    distracted.nextRepetition = distracted.lastTested + _getNextInterval(oldPeriod, distracted.lastConfidence, false)
                }
                distracted.save()
            }
        }
        wordTested.save()
        return correct
    }
}

Question.init({
    questionId: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    wordId: DataTypes.INTEGER,
    reverse: DataTypes.BOOLEAN,
    distractors: DataTypes.INTEGER,
    answerWordId: DataTypes.INTEGER,
}, {sequelize, modelName: "question", underscored: true, timestamps: true})

// methods to process answers including logging when a distractor is selected, do we need a model that defines what has been learned etc
// class is the table instance is the row, class methods apply to whole table, instance methords - rows

/*WordScore
Number of times tested
Confidence - Free score? 0-1?
Number of times tested
Number of times correct
Number of times distractor
Time taken to answer (difficulty) - faster than average
Uniqueness (difficulty)
Retest time..
1,2,4,8,16 - Normal but need  a variation (1-2, 2-4, 4-8, 8-16)
Maybe that's for 0.5. 1 and it's


There is likely to be an exponential curve, there are different stages - effective encoding, reinforcing, maintaining

What happens if distractor selected? cut due date in half



*/

async function createTables() {
    try {
        await sequelize.sync();
    } catch (e) {
        console.error(e.message)
    }
}

createTables()


// todo, can i just require s/Sequelize when it is used
module.exports = {
    Word: Word,
    Translation: Translation,
    sequelize: sequelize,
    Question: Question,
    Sequelize: Sequelize,
    Op: Sequelize.Op,
    WordLearning: WordLearning
}

