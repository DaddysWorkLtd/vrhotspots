// example usage node translator.js -p 2 -l nl
// node translator.js -l fr the mushroom

// config, not sure why this is needed as
// credentials are in GOOGLE_APPLICATION_CREDENTIALS environment variable
const projectId = 'vr-vocab-123';
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');
const ttsClient = new textToSpeech.TextToSpeechClient();
const yargs = require('yargs');
const {Translate} = require('@google-cloud/translate').v2;
const translater = new Translate({projectId});
const _ = require('lodash');
const langConfig = {
  nl: {
    "audioConfig": {
      "audioEncoding": "LINEAR16",
      "effectsProfileId": [
        "headphone-class-device"
      ],
      "pitch": -5,
      "speakingRate": 0.7
    },
    "voice": {
      "languageCode": "nl-NL",
      "name": "nl-NL-Wavenet-B"
    }
  },
  fr: {
    "audioConfig": {
      "audioEncoding": "LINEAR16",
      "effectsProfileId": [
        "headphone-class-device"
      ],
      "pitch": 0,
      "speakingRate": 0.7
    },
    "voice": {
      "languageCode": "fr-FR",
      "name": "fr-FR-Wavenet-C"
    }
  },
  sv: {
    "audioConfig": {
      "audioEncoding": "LINEAR16",
      "effectsProfileId": [
        "headphone-class-device"
      ],
      "pitch": 0,
      "speakingRate": 0.7
    },
    "voice": {
      "languageCode": "sv-SE",
      "name": "sv-SE-Wavenet-A"
    }
  },
  it: {
    "audioConfig": {
      "audioEncoding": "LINEAR16",
      "effectsProfileId": [
        "headphone-class-device"
      ],
      "pitch": 0,
      "speakingRate": 0.7
    },
    "voice": {
      "languageCode": "it-IT",
      "name": "it-IT-Wavenet-B"
    }
  },
  sp: {
    "audioConfig": {
      "audioEncoding": "LINEAR16",
      "effectsProfileId": [
        "headphone-class-device"
      ],
      "pitch": 0,
      "speakingRate": 0.7
    },
    "voice": {
      "languageCode": "es-ES",
      "name": "es-ES-Wavenet-B"
    }
  },
  de: {
    "audioConfig": {
      "audioEncoding": "LINEAR16",
      "effectsProfileId": [
        "headphone-class-device"
      ],
      "pitch": 0,
      "speakingRate": 0.7
    },
    "voice": {
      "languageCode": "de-DE",
      "name": "de-DE-Wavenet-B"
    }
  }
}

//NODE SERVER
const DATA_FILE = "./database/vrvocabdb.json",
  PRIVATE_DATA = "./database/privatedb.json",
  low = require("lowdb"),
  // use synchronous file mode
  FileSync = require("lowdb/adapters/FileSync"),
  db = low(new FileSync(DATA_FILE));

const argv = yargs
  .option('lang', {
    alias: 'l',
    demand:true,
    description: 'language code',
    type: 'text',
  })
  .option('photoId', {
    alias: 'p',
    description: 'Photo Id',
    type: 'number',
  })
  .option('replaceText', {
    alias: 'rt',
    description: 'replace existing text translations',
    type: 'boolean',
})
  .option('replaceAudio', {
    alias: 'ra',
    description: 'replace existing audio',
    type: 'boolean',
})
  .option('debug', {
    alias: 'd',
    description: 'just list the rows that will change',
    type: 'boolean',
  })
  .help()
  .alias('help', 'h')
  .argv;

const LANG = argv.lang;

// find the rows to be updated

// returns an array of words that are undefined for the target LANGuage
function undefWords( photoId) {
  const words = db.get('words').value();
  return _.reduce(db.get('photos').find({id:photoId}).value().wordSpots,function (res, row) {
    const wordRec=words[row.word];
    if(!wordRec || !wordRec[LANG]) {
      res.push(row.word);
    }
    return res;
  },[]);
}
const words=db.get('words').value();
async function generateAudio(translation,target,filename) {

  // Construct the request
  const request = langConfig[target];
  request.input={text: translation};
  // Performs the text-to-speech request
  const [response] = await ttsClient.synthesizeSpeech(request);
  // Write the binary audio content to a local file
  const writeFile = util.promisify(fs.writeFile);
  await writeFile('./public/'+ filename, response.audioContent, 'binary');
  console.log(`Audio content written to public/` + filename);
}


if (argv.photoId) {
  // this is only undefined words.... do we need a photoId? We could just do all of them
  _.forEach(undefWords(argv.photoId), async function (en) {
    let [translation] = await translater.translate('the ' + en, LANG);
    if (!words[en]) words[en] = {};
    if (argv.replaceText || !words[en][LANG] || !words[en][LANG].word) {
      // resetting text also resets audio
      words[en][LANG] = {word: translation, audio: ''};
    }
    if (argv.replaceAudio || !words[en][LANG].audio) {
      const filename = 'audio/' + LANG + '/' + translation.replace(/\s/g, '-') + '.mp3';
      if (!argv.debug) await generateAudio(translation, LANG, filename);
      words[en][LANG].audio = filename;
      //make it
    }
    console.log(en, words[en]);
    // should only be called once all promises are resolved but this will do for now as we are single threaded (I hope)
    if (!argv.debug) {
      db.set('words', words).write();
    }
  });
} else {
  async function transateText(text,lang) {
    let [translation] = await translater.translate(text, lang);
    let file = 'audio' + '/' + translation.replace(/\s/g, '-') + '.mp3';
    console.log(text,lang,translation);
    await generateAudio(translation, lang,file );
    console.log('public/audio/file');
  }
  transateText( argv._.join(' '),LANG);

}


