//NODE SERVER
const express = require("express"),
    socket = require("socket.io"),
    SERVER_PORT = process.env.PORT || 3069,
    SERVER_NAME = process.env.PORT ? 'vr-vocab.glitch.me' : "daddydev",
    DATA_FILE = "./database/vrvocabdb.json",
    PRIVATE_DATA = "./database/privatedb.json",
    TRANS_DATA = "./database/transdb.json",
    fs = require("fs"),
    ip = require('ip'),
    protocol = process.env.PORT ? require("http") : require("https"), // non secure for glitch which has process.env defined
    key = fs.readFileSync("../privkey.pem"),
    cert = fs.readFileSync("../cert.pem"),
    app = express(),
    cors = require("cors"),
    Busboy = require("busboy"),
    requestIp = require('request-ip'),
    bodyParser = require('body-parser'),
    models = require('./models'),
    gpt = require('./gpt'),
    _ = require('lodash'),
    Memfs = require('memfs'),
    mfs = Memfs.fs,
    mvol = Memfs.vol,
    speech = require('@google-cloud/speech');

const {GoogleAuth} = require('google-auth-library');
const GOOGLE_AUTH = new GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
});

const {Configuration, OpenAIApi} = require('openai'),
    //OpenApi = require('openapi'),
    gptKey = fs.readFileSync("../gptapi.key", 'utf8').trim(),
    gptConf = new Configuration({apiKey: gptKey}),
    openai = new OpenAIApi(gptConf);

const GPT_MODEL = 'gpt-3.5-turbo-0301'
//const GPT_MODEL='text-davinci-003'
//const GPT_MODEL='gpt-3.5-turbo'
//
app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
//getting the IP address
//
app.use(requestIp.mw());

var server;
// if on glitch dont create a secure server as their proxy does that and it will cause hang ups
if (!process.env.PORT) {
    server = protocol
        .createServer({key: key, cert: cert}, app)
        .listen(SERVER_PORT, function () {
            console.log("https server started on ", SERVER_PORT);
        });
} else {
    // spin up secure server otherwise cant have webvr
    server = protocol
        .createServer(app)
        .listen(SERVER_PORT, function () {
            console.log("http server started on ", SERVER_PORT);
        });
}
io = socket(server);
/* ignore cors and just accept all for now but this did work
io = socket(server,{
  cors: {
    origin: "https://" + SERVER_NAME, //+ ":" + SERVER_PORT,
    methods: ["GET", "POST"]
  }
});*/
// getting errors in firefox, this does not fic it chatgpt
app.use(cors({
    origin: '*'
}))

// routes
const low = require("lowdb"),
    // use synchronous file mode
    FileSync = require("lowdb/adapters/FileSync"),
    db = low(new FileSync(DATA_FILE)),
    udb = low(new FileSync(PRIVATE_DATA))
const {Sequelize} = require("sequelize");
tdb = low(new FileSync(TRANS_DATA))

db.defaults({photos: [], words: {}, uid: 0}).write();
udb.defaults({users: [], log: []}).write();
tdb.defaults({en_nl: [], nl_en: [], nl_es: [], es_nl: []}).write();

//static root is public
app.use(express.static("public"));
// start photo hard coded to 1 in connect.

// socket io stuff
io.on("connection", socket => {
    console.log("made socket connection", socket.id);
    // send back the current database on connect
    /*io.emit(
        "photos",
        db
            .get("photos")
            .value()
    );*/
    /* this causes the front end to keep reconnecting!
    io.emit(
      "words",
      db
        .get("words")
        .value()
    );*/

    // handle logging send everything to db
    socket.on("log", function (entry) {
        entry.id = socket.id;
        // NEED TO IMPLEMENT SOCKET HANDLER AS MIDDLEWARE TO GET IP from clientIP entry.ip=requestIp.get
        udb.get("log").push(entry).write();
    })
    // Handle add spot event by recording in database and broadcasting out
    socket.on("addSpot", function (data) {
        // save data
        function getUID() {
            let UID = db.get("uid").value();
            db.update("uid", uid => uid + 1).write();
            // also puts the server ip on it. It's in sync mode so db should lock on each request. Ok for now
            return (UID.toString() + ip.toLong(ip.address()).toString());
        }

        // flush the db cashe or it will keep overwriting live edits
        db.read();
        //get the photo and update the spot array
        let rec = db
                .get("photos")
                .find({id: data.photoId}),
            photo = rec.value();

        console.log('add spot', JSON.stringify(data));
        // append spot to array of wordSpots j
        data.id = getUID()
        photo.wordSpots.push(data);

        // write to database
        rec.assign(photo).write();

        //emits new spot to all clients, including the photoid so all clients get all spots for now
        io.emit("addSpot", data);
    });

});
io.on("connect_failed", function () {
    console.log("Connection Failed");
});

// API STUFF

app.get('/api/ping', function (req, res, rrq) {
    res.send('pong poo poo')
});

app.get('/api/words/:word/:lang', (req, res, rrq) => res.json(db.get('words').value()[req.params.word][req.params.lang]));
app.get('/api/words/:word', (req, res, rrq) => res.json(db.get('words').value()[req.params.word]));
app.get('/api/words', (req, res, rrq) => {
    console.log('words');
    res.json(db.get('words').value())
});
app.get('/api/photos/:id/wordspots', (req, res, rrq) => res.json(db.get('photos').find({id: req.params.id * 1}).value().wordSpots));
app.get('/api/photos', (req, res, rrq) => res.json(db.get('photos').value()));
app.get('/api/photos/:id', (req, res, rrq) => res.json(db.get('photos').find({id: req.params.id * 1}).value()));

const {Translate} = require('@google-cloud/translate').v2;
const projectId = 'vr-vocab-123';
const translater = new Translate({projectId});

app.get('/api/translate/:from/:to/:text', async (req, res, rrq) => {
    let [translation] = await translater.translate(req.params.text, {to: req.params.to, from: req.params.from});
    const coll = req.params.from + "_" + req.params.to;
    tdb.get(coll).push({in: req.params.text, out: translation, ts: new Date()}).write()
    res.json(translation)
});

app.post('/api/translate', async (req, res, rrq) => {
    if (req.body.text) {
        let [translation] = await translater.translate(req.body.text.trim(), {to: req.body.to, from: req.body.from});
        const coll = req.body.from + "_" + req.body.to;
        console.log(coll, {in: req.body.text.trim(), out: translation, ts: new Date()});
        tdb.get(coll).push({in: req.body.text.trim(), out: translation, ts: new Date()}).write()
        res.json(translation)
    } else {
        res.json({error: 'no in text found'})
    }
});

// api/translate/history/from/to

app.get('/api/history/:from/:to', async (req, res, rrq) => {
    try {
        var words = await models.Word.findAll({
            where: {fromLang: req.params.from, toLang: req.params.to},
            order: [['occurances', 'DESC']],
            attributes: ['fromText', 'occurances']
        })
    } catch (e) {
        console.error(m)
    }
    res.json(words)
});

app.get('/api/history/:from/:to/:fromText', async (req, res, rrq) => {
    try {
        var words = await models.Word.findAll({
            where: {fromLang: req.params.from, toLang: req.params.to, fromText: req.params.fromText},
            attributes: {exclude: ['userId']}
        })
    } catch (e) {
        console.error(e)
    }
    if (words) {
        res.json(words)
    } else {
        res.status(404)
        res.trailer('NOT FOUND')
    }
});

app.get('/api/vocably/words/:wordId', async (req, res) => {
    try {
        var word = await models.Word.findOne({where: {wordId: req.params.wordId}})
    } catch (e) {
        res.status(500)
        console.error(e)
        res.json(e)
    }
    if (word) {
        res.status(200)
        res.json(word)
    } else {
        res.status(404)
        res.json({"NOT_FOUND": req.params.wordId})
    }
})

app.delete('/api/vocably/words/:wordId', async (req, res) => {
    try {
        var deleted = await models.Word.destroy({where: {wordId: req.params.wordId}})
    } catch (e) {
        res.status(500)
        res.json(e)
    }
    if (deleted) {
        res.status(204)
        res.end()
    } else {
        res.status(404)
        res.json({"NOT_FOUND": req.params.wordId})
    }
})

app.put('/api/vocably/words/:wordId', async (req, res) => {
    try {
        // cant update primary key
        delete req.body.wordId
        var updated = await models.Word.update(req.body, {where: {wordId: req.params.wordId}})
    } catch (e) {
        res.status(500)
        res.json(e)
    }
    if (updated) {
        // should just get like this, change and save but who cares for now its total mess code anyhoe
        var word = await models.Word.findOne({where: {wordId: req.params.wordId}})
        res.json(word)
    } else {
        res.status(404)
        res.json({"NOT FOUND": req.params.wordId})
    }
})

// anki aki update can be done in python

// create question - can either give choice of answers or give answer and distractors, probably prefer to keep that back. Any hints? These could be keyed b word
// todo api/question/new?distractors=5
app.get('/api/vocably/question/:fromLang/:toLang/new', async (req, res) => {
    function randy(min, max, factor = 1) {
        const rand = (Math.random() ** factor)
        return min + Math.floor(rand * (max - min))
    }

    // default 3 distractors, can get more
    const distractors = req.query.distractors || 3
    // number of attempts to find unique distactors (crash protection)
    const maxAttempts = 50
    //can only have distractors etc for same language so may need from and to in the url
    words = await models.Word.findAll({
        where: {
            wordId: {[models.Sequelize.Op.notIn]: [models.sequelize.literal('select word_id from questions where answer_word_id is not null')]},
            disabled: null,
            to_text: {[models.Op.ne]: null},
            fromLang: req.params.fromLang,
            toLang: req.params.toLang
        },
        order: [["occurances", "DESC"]]
    });
    if (!words.length) {
        res.json({
            questionId: 0,
            word: "Finished :)",
            choices: [],
            remaining: 0
        })
    } else {
        let answers = [];
        let choice = randy(0, words.length - 1, 1.5) // 1.5 top biases
        let word = words[choice]
        answers.push({wordId: word.wordId, word: word.toText})
        let crashCheck = 0
        for (let i = 0; i < (req.query.distractors || 3); i++) {
            choice = randy(0, words.length - 1, .75) // .75 tail biases, more difficult ones
            // don't include the same word twice unless we're out of words
            if (crashCheck < maxAttempts && _.find(answers, {wordId: words[choice].wordId})) {
                i--
                crashCheck++
            } else {
                answers.push({wordId: words[choice].wordId, word: words[choice].toText})
            }
        }
        question = await models.Question.create({wordId: answers[0].wordId, distractors: distractors, reverse: false})
        const returnObj = {
            questionId: question.questionId,
            word: word.fromText, // if not reverse
            choices: _.shuffle(answers),
            remaining: words.length
        }
        res.json(returnObj)
    }
})

app.get('/api/vocably/question/:fromLang/:toLang/repeat', async (req, res) => {
    // get a due question - if no repeat questions return none or maybe a flag to override
    // default 3 distractors, can get more
    const distractors = req.query.distractors || 3
    let returnObj = {
        questionId: 0,
        word: "Finished :)",
        choices: [],
        remaining: 0
    }
    // todo: not going to have enoughd distractors, these can be from anywhere
    wordsLearn = await models.WordLearning.findAll({
        where: {
            wordId: {
                // todo: is that really how you do a join?
                [models.Sequelize.Op.in]: [models.sequelize.literal("SELECT words.word_id FROM questions,words \
                                                    WHERE words.word_id=questions.word_id \
                                                    AND words.disabled is NULL \
                                                    AND words.to_text is not NULL\
                                                    AND from_lang='" + req.params.fromLang + "' \
                                                    AND to_lang='" + req.params.toLang + "'")]
            },
            nextRepetition: {
                [models.Sequelize.Op.lte]: new Date()
            }
            // todo: need to add next_repetition < now
        },
//        order: [['nextRepetition', 'ASC']],
        order: models.sequelize.random(),
// should really limit as randomising whole is inefficient       limit: distractors + 1
    })
    if (wordsLearn.length) {
        question = await models.Question.create({
            wordId: wordsLearn[0].wordId,
            distractors: distractors,
            reverse: false
        })
        var _questionWord
        // slice the first 1+ distractors off - this was done with a limit clause
        let answerList = await Promise.all(wordsLearn.slice(0, distractors + 1).map(async function (wordLearn) {
            word = await models.Word.findByPk(wordLearn.wordId)
            return {wordId: word.wordId, word: word.toText, fromText: word.fromText};
        }));
        returnObj = {
            questionId: question.questionId,
            word: _.find(answerList, {wordId: question.wordId}).fromText, // if not reverse
            choices: _.shuffle(_.omit(answerList, 'fromText')),
            remaining: wordsLearn.length
        }
    }
    res.json(returnObj)
})
app.put('/api/vocably/answer/:questionId', async (req, res) => {
    const question = await models.Question.findByPk(req.params.questionId)
    if (!question) {
        res.status(404)
        return res.json({"QUESTION NOT FOUND": req.params.questionId})
    }
    // todo: should we allow a question to be answered twice?
    if (!req.body.wordId) {
        res.status(400)
        return res.json({"REQUIRED": "wordId"})
    }
    let confidence = req.body.confidence || .5
    if (confidence < 0 || confidence > 1.5) {
        res.status(400)
        return res.json({"INVALID RANGE": "confidence " + confidence + " should be 0-1.5 "})
    }
    // todo: do not allow old questions to be updated, as PKs are guessable
    const word = await models.Word.findByPk(req.body.wordId)
    if (!word) {
        res.status(404)
        return res.json({"ANSWER NOT FOUND": req.body.wordId})
    }
    question.answerWordId = req.body.wordId
    let correct = await question.processAnswer(req.body.wordId, confidence)
    res.status(correct ? 200 : 400)
    let correctWrong = correct ? "correct" : "incorrect"
    console.log('correct', correct, correctWrong)
    const returnValue = {}
    returnValue[correctWrong] = question.wordId
    return res.json(returnValue)
})
// deletes question and disables word so it's not asked again
app.delete('/api/vocably/question/:questionId', async (req, res) => {
    question = await models.Question.findByPk(req.params.questionId)
    if (!question) {
        res.status(404)
        return res.json({"QUESTION NOT FOUND": req.params.questionId})
    } else {
        word = await models.Word.findByPk(question.wordId)
        word.disabled = new Date()
        word.save()
        question.destroy()
        res.status(204)
        res.end()
    }
});

// for current user todo implement
app.get('/api/logs', (req, res, rrq) => res.json(udb.get('logs').value()));

// Handle POST requests to the /chat endpoint
app.post('/api/gpt/chat', async (req, res) => {
    try {
        const prompt = req.body.prompt;
        const response = await openai.createChatCompletion({
            messages: [{role: 'user', content: prompt}],
            model: GPT_MODEL
        });
        res.json(response.data);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Something went wrong', err: JSON.stringify(err)});
    }
});
app.post('/api/gpt/question/:lang/:baselang', async (req, res) => {
    try {
        let prompt = "Stel mij een willekeurige open vraag in [" + req.params.lang + "]",
            wordList = ""
        //
        if (req.body.seed && req.body.seed == "word_learnings") {
            const fromLang = req.params.baselang
            const toLang = req.params.lang
            wordList = await getRandomWordList(fromLang, toLang, 1)
            if (wordList) prompt += ` dat bezit "${wordList}",`
        }
        prompt += " gevolgd door een vertaling van de vraag in [" + req.params.baselang + "] vertaling. Label eerst talen."// Label your reply [language]: text"

        const response = await openai.createChatCompletion({
            messages: [{role: 'user', content: prompt}],
            model: GPT_MODEL
        });
        match = gpt.matchQuestion(response.data.choices[0].message.content)
        if (match) {
            res.json({
                question_lang: match[0],
                question: match[1],
                translation_lang: match[2],
                translation: match[3],
                seed: wordList
            });
        } else {
            throw new Error("no regex match on choice 0" + response.data.choices[0].text)
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Something went wrong', message: err.message});
    }
});
// this will only work one person at a time! You need your own chatgpt api key
app.post('/api/gpt/answer', async (req, res) => {
    try {
        if (!req.body.prompt) throw new Error("prompt not found in request body or empty")
        const prompt = "Is dit antwoord hieronder grammaticaal correct en zo niet, waarom niet? Geef een gedetailleerde grammaticale uitleg en een gecorrigeerde versie.\n\n" + req.body.prompt
        const response = await openai.createChatCompletion({
            messages: [{role: 'user', content: prompt}],
            model: GPT_MODEL
        });
        res.json({text: response.data.choices[0].message.content});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Something went wrong', message: err.message});
    }
});

async function getRandomWordList(fromLang, toLang, listLen) {
    let wordList = ""
    const query = "SELECT words.word_id FROM questions,words \
                                                WHERE words.word_id=questions.word_id \
                                                AND words.disabled is NULL \
                                                AND words.to_text is not NULL\
                                                AND from_lang='" + fromLang + "' \
                                                AND to_lang='" + toLang + "'"
    //console.log(query);
    const wordsLearn = await models.WordLearning.findAll({
        where: {
            wordId: {
                [models.Sequelize.Op.in]: [models.sequelize.literal(query)]
            },
            nextRepetition: {
                [models.Sequelize.Op.lte]: new Date()
            }
        },
        order: models.sequelize.random(),
        limit: listLen
    })
    // todo: sort this out using a join
    for (const el of wordsLearn) {
        // or could use wordid in
        let word = await models.Word.findByPk(el.wordId);
        wordList += `,${word.fromText}`
    }
    return wordList.substr(1) //remove leading comma
}

app.post('/api/gpt/statement/:lang/:baselang', async (req, res) => {
    try {
        let prompt = "Maak een zin in [" + req.params.lang + "]",
            wordList = "",
            seeds = req.body.seeds || 1
        //
        if (req.body.seed && req.body.seed == "word_learnings") {
            const fromLang = req.params.baselang;
            const toLang = req.params.lang;
            wordList = await getRandomWordList(fromLang, toLang, seeds)
            if (wordList) prompt += ` het gebruik van de woorden [${wordList}],`
        }
        prompt += " gevolgd door een vertaling in [" + req.params.baselang + "]. Label eerst talen."
        const response = await openai.createChatCompletion({
            messages: [{role: 'user', content: prompt}],
            model: GPT_MODEL
        });
        match = gpt.matchQuestion(response.data.choices[0].message.content, false)
        if (match) {
            res.json({
                statement_lang: match[0],
                statement: match[1],
                translation_lang: match[2],
                translation: match[3],
                seeds: wordList
            });
        } else {
            throw new Error("no regex match on gpt response: " + response.data.choices[0].message.content)
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Something went wrong', message: err.message});
    }
});

app.post('/api/gpt/clue/:lang/:baselang', async (req, res) => {
    try {
        let prompt = "Maak een aanwijzing in [" + req.params.lang + "]"

        //
        const fromLang = req.params.baselang;
        const toLang = req.params.lang;
        wordList = await getRandomWordList(fromLang, toLang, 1)
	console.log(wordList)
        if (wordList) {
            prompt += ` voor de woord[${wordList}],`
            prompt += " gevolgd door een vertaling in [" + req.params.baselang + "]. Label de talen."
	    console.log(prompt)
            const response = await openai.createChatCompletion({
                messages: [{role: 'user', content: prompt}],
                model: GPT_MODEL
            });
            console.log(response.data.choices[0].message.content)
            match = gpt.matchQuestion(response.data.choices[0].message.content, false)
            if (match) {
                res.json({
                    clue_lang: match[0],
                    clue: match[1],
                    translation_lang: match[2],
                    translation: match[3],
                    answer: wordList
                });
            } else {
                res.status(404).send('No clue what happened: response.data.choices[0].message.content')
            }
        } else {
            throw new Error("no regex match on gpt response: " + response.data.choices[0].message.content)
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Something went wrong', message: err.message});
    }
});

app.post('/api/gpt/roleplay/:lang/:baselang', async (req, res) => {
    try {
        const sysPrompt = "Je doet alsof '" + req.body.who +
                "' voor een rollenspel in [" + req.params.lang + "]." +
                "antwoord in minder dan 50 woorden. Gebruik de meest voorkomende tweehonderd woorden in " + req.params.lang,
            prompt = req.body.prompt,
            history = req.body.history,
            convoSeed = [{role: 'system', content: sysPrompt}]
        // add on history and new message
        let messages = convoSeed.concat(history, [{role: 'user', content: prompt}])
        const response = await openai.createChatCompletion({
            messages: messages,
            model: GPT_MODEL
        });
        // return the history?
        res.json({
            message: response.data.choices[0].message.content,
            message_lang: req.params.lang
        })
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Something went wrong', message: err.message});
    }
});


async function googleTTS(req, res) {
    try {
        const busboy = Busboy({headers: req.headers})
        let fileData = null
        busboy.on('file', (fieldname, upload, filename, encoding, mimetype) => {
            // save stream?
            console.log(fieldname, upload, filename, encoding, mimetype)
            upload.on('data', (data) => {
                if (fileData === null) {
                    fileData = data
                } else
                    fileData = Buffer.concat([fileData, data])
            })
        })
        const reqBody = {}
        busboy.on('field', (name, val, info) => {
            reqBody[name] = val;
        });
        busboy.on('finish', async () => {
            const audio = {
                content: fileData.toString('base64')
            };
            /*
            const response = await openai.createTranscription(file, "whisper-1",
                undefined,
                undefined,
                undefined,
                req.body.language || undefined)
            res.json({text: response.data.text});
          */
            // Google Cloud - todo: can I reduce the sampleRate on media recorder?
            const client = new speech.SpeechClient()
//todo despite my attempts it is coming through as webm at 48kHz. The config is in the file header so this is ignored. Couldn't workout how to use flac.js
            const config = {
                encoding: 'flac',
//              sampleRateHertz: 16000,
                languageCode: reqBody.language || 'en-GB',
            };
            const [op] = await client.longRunningRecognize({config: config, audio: audio}).catch(err => {
                console.log("setup", err)
            })
            const [response] = await op.promise().catch(err => {
                console.log("waiting", err)
            });
            const transcription = response.results
                .map(result => result.alternatives[0].transcript)
                .join('\n');
            console.log(`Transcription: ${transcription}`);
            res.json({text: transcription})
        })
        return req.pipe(busboy)

    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Something went wrong', message: err.message});
    }
}

async function whisperTTS(req, res) {
    try {
        const busboy = Busboy({headers: req.headers})
        let fileData = null
        const reqBody = {}
        busboy.on('field', (name, val, info) => {
            reqBody[name] = val;
        });
        busboy.on('file', (fieldname, upload, filename, encoding, mimetype) => {
            // create a virtual filestream
            upload.pipe(mfs.createWriteStream('/speechfile.mp3'))
        })
        busboy.on('finish', async () => {
            const file = mfs.createReadStream('/speechfile.mp3')
            file.path = 'speechfile.mp3'
            // shorten code for openai
            if (reqBody.language) {
                reqBody.language = reqBody.language.substring(0, 2)
            }
            const response = await openai.createTranscription(file, 'whisper-1', undefined, undefined, undefined, reqBody.language)
                .catch(error => {
                    if (error.response) {
                        console.log(error.response.status);
                        console.log(error.response.data);
                    } else {
                        console.log(error.message);
                    }
                })

            res.json({text: response.data.text})
        })
        return req.pipe(busboy)

    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Something went wrong', message: err.message});
    }
}

//app.post('/api/transcribe', googleTTS)
app.post('/api/transcribe', whisperTTS)


const langConfig = {
    nl: {
        "audioConfig": {
            "audioEncoding": "MP3",
            "effectsProfileId": [
                "headphone-class-device"
            ],
            "pitch": -5,
            "speakingRate": 0.9
        },
        "voice": {
            "languageCode": "nl-NL",
            "name": "nl-NL-Wavenet-B"
        }
    },
    fr: {
        "audioConfig": {
            "audioEncoding": "MP3",
            "effectsProfileId": [
                "headphone-class-device"
            ],
            "pitch": 0,
            "speakingRate": 0.9
        },
        "voice": {
            "languageCode": "fr-FR",
            "name": "fr-FR-Wavenet-C"
        }
    },
    sv: {
        "audioConfig": {
            "audioEncoding": "MP3",
            "effectsProfileId": [
                "headphone-class-device"
            ],
            "pitch": 0,
            "speakingRate": 0.9
        },
        "voice": {
            "languageCode": "sv-SE",
            "name": "sv-SE-Wavenet-A"
        }
    },
    it: {
        "audioConfig": {
            "audioEncoding": "MP3",
            "effectsProfileId": [
                "headphone-class-device"
            ],
            "pitch": 0,
            "speakingRate": 0.9
        },
        "voice": {
            "languageCode": "it-IT",
            "name": "it-IT-Wavenet-B"
        }
    },
    es: {
        "audioConfig": {
            "audioEncoding": "MP3",
            "effectsProfileId": [
                "headphone-class-device"
            ],
            "pitch": 0,
            "speakingRate": 0.9
        },
        "voice": {
            "languageCode": "es-ES",
            "name": "es-ES-Wavenet-B"
        }
    },
    de: {
        "audioConfig": {
            "audioEncoding": "MP3",
            "effectsProfileId": [
                "headphone-class-device"
            ],
            "pitch": 0,
            "speakingRate": 0.9
        },
        "voice": {
            "languageCode": "de-DE",
            "name": "de-DE-Wavenet-B"
        }
    }
}
const textToSpeech = require('@google-cloud/text-to-speech');
const util = require("util");
const ttsClient = new textToSpeech.TextToSpeechClient();

app.post('/api/tts', async (req, res) => {
    try {
        // Construct the request
        const request = langConfig[req.body.language]
        request.input = {text: req.body.text}
        // Performs the text-to-speech request
        const [gresponse] = await ttsClient.synthesizeSpeech(request)
        const audioBuff = Buffer.from(gresponse.audioContent)
        res.send({file: 'data:audio/mpeg;base64,' + audioBuff.toString('base64')})
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Something went wrong', message: err.message});
    }
});


//


// Answer - "Tell me if my answer is gramatically correct: "
// Check not chat - "Ask me a random question in {lang}"
// make up a question in dutch with vlichtuig in it and translate to en
// Ask me a random question in nl that contains "opgaan", followed by a translation of the question in en. Label each with [language]: text.
//  Ik heb hoofpij gehad
