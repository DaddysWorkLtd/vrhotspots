// Frontend CLIENT code
// contains application logic
var sockurl;
if (window.location.hostname === 'daddydev') {
  sockurl = 'https://daddydev:3069';
} else {
// for glitch etc
  sockurl = 'https://' + window.location.hostname;
  //sockurl = 'https://daddyswork.com:3069';
}
// initialis lowdb
const adapter = new LocalStorage('db'),
  socket = io.connect(sockurl);

// dirty global for state management....
var gState = {
  db: low(adapter),
  lang: 'nl',
  word: {},
  // how many attempts on current word
  attempt: 1,
  wordsPerGame: 15,
  gameMode: 'Play', // learning - written word on 1st attempt, testing - on 2nd attempt, practice - pick any spot, reads out word
  // might only what wordsPerGame in testing mode otherwise do all of them
  // learning mode - single word, testing mode multiple words, practice mode - all words
  setPhoto: function (photo) {
    if (photo) {
      this.photo = photo;
    }
    setPhoto(this.photo);
  },
  // this creates wordsPerGame
  addWordSpots: function () {
    const undefWords = this.undefWordList(this.photo.id);
    _.forEach(_.sampleSize(_.filter( this.photo.wordSpots, spot => _.indexOf(undefWords, spot.word)=== -1),this.wordsPerGame), appendSpot);
  },
  // this deletes wordSpots
  // history - timesramp, photoid, targetword, guess, correct
  correct: function (answer) {
    document.querySelector('#correct').play(); //should be calling a method in the ui code
    // choose a new word
    this.log({date: new Date(), photoId: this.photo.id, word: this.word, correct: 1});
    let score = this.getScore();
    this.nextWord();
    setHudText('bot', 'Correct: ' + answer + '\n(' + score.correct + ' of ' + this.wordsPerGame + ')');
    // don't clear the bottom hud when the spot is removed ending the intersection
    this.stickyBot = true;
    this.attempt = 1;
  },
  getScore: function () {
    try {
      let correct = _.countBy(this.history, {correct: 1}),
        score = {elapsed: new Date() - this.history[0].date};
      score.correct = correct.true;
      score.attempts = correct.true + (correct.false || 0);
      // incorrect nattempts on current word _.countBy(gState.history,{word: gState.word}).true
      return score;
    } catch (err) {
      return {};
    }
  },
  incorrect: function (answer) {
    document.querySelector('#incorrect').play();
    this.log({date: new Date(), photoId: this.photo.id, word: this.word, guess: answer});
    setHudText('bot', 'Incorrect: ' + answer);
    // increase the attempt
    this.attempt += 1;
    // after 3 incorrect give a clue...
    if (this.attempt > 3 && this.word.clue) {
      setHudText('top', 'Find: ' + this.word[this.lang].word + ' (' + this.word.clue + ')');
    } else {
      setHudText('top', 'Find: ' + this.word[this.lang].word);
    }
    // repeat word out loud
    this.playWord();
  },
  log: function (entry) {
    // we have a local history and a remote log db
    entry.attempt = this.attempt;
    entry.userId = this.userId;
    entry.gameStart = this.gameStart;
    entry.wordNum = this.wordNum;
    // maybe log game information only on word 1 attempt 1
    entry.wordsPerGame = this.wordNum;
    entry.gameMode = this.gameMode;
    // may delete unwanted bits from word, especially other languages not attempted!
    entry.lang = this.lang;
    // history is just current game now
    this.history.push(entry);
    // using log to store all past activity, only in local storage... should have the userid
    this.db.get('log').push(entry).write();
    // remote log
    socket.emit('log', entry);
  },

  nextWord: function () {

    var words = this.db.get('words').value(),
      _candidates = [],
      nextWord;
    // build an array of candidates that have words (ie translations defined)
    document.querySelectorAll('.wordspot').forEach(function (spotEl) {
      // would actually need to check it is defined for the language
      let _word = spotEl.getAttribute('word');
      // notice the scoping here (in a cb function), this does not refer to parent object so explicitly reference gstate
      if (words[_word] && words[_word][gState.lang]) {
        // so there is a translation defined for this language, apppend the english as that is the key and needed for logging
        words[_word]['en'] = _word;
        _candidates.push(words[_word]);
      }
      ;
    });
    if (_candidates.length) {
      // could just as well use
      // sampleSize to get multiple words
      if (this.gameMode !== 'Practice' && this.gameMode !=='Edit') { // todo, create a dictionaty of options rather than hardcoding
        this.wordNum++;
        nextWord = _.sample(_candidates);
        // if in learning mode show text for all attempts, otherwise start without it
        if (this.gameMode === 'Learn') {
          setHudText('top', 'Find: ' + nextWord[this.lang].word);
        }
        this.word = nextWord;
        this.playWord();
      }
    } else {
      this.endGame();
    }

  },
  endGame: function () {
    function _secShow(secs) {
      let basedate = new Date(0);
      if (!secs) return '';
      basedate.setSeconds(secs);// specify value for SECONDS here
      return basedate.toISOString().substr(14, 5) + 's';
    }

    let score = this.getScore();
    this.word = {};
    // make sure there have been words, otherwise when editing you get a broken message in top hud
    if (score.correct) {
      const photoStats = _.find(this.getUserPhotoData(),{id:this.photo.id});
      let roomMess = Math.round(photoStats.found*100/photoStats.words) + '% Found\n\n' +
        Math.round(photoStats.mastered*100/photoStats.words) + '% Mastered';
      if (photoStats.mastered === photoStats.words) {
        roomMess = 'Room MASTERED\n\n' + roomMess;
      } else if (photoStats.found === photoStats.words) {
        roomMess = 'Room COMPLETE\n\n' + roomMess;
      } else {
        roomMess = 'Room Stats\n\n' + roomMess;
      }
      // avoid a race condition that prevents display
      window.setTimeout(function () {
        setHudText('top', 'Accuracy: ' + Math.round(score.correct * 100 / score.attempts) + '% Completed in ' + _secShow(score.elapsed / 1000));
        setHudText('mid', roomMess);
        setHudText('bot', 'Use exit to play again');
      },100);
    }
  },
  playWord: function (wordOnly) {
    // we might want a delay on this, we could also write it as a method so that it is call cached
    let trans = this.word[this.lang];
    if (trans.audio) {
      let audio = new Audio("audio/" + this.lang + "/where-is.mp3"),
        wordPlay = function () {
          // now play the word
          audio.removeEventListener('ended', wordPlay); // otherwise it repeats for ever!
          audio.src = trans.audio;
          audio.play();
        };
      if (wordOnly) {
        wordPlay();
      } else {
        audio.play();
        audio.addEventListener('ended', wordPlay);
      }
    }
  },
  changePhoto: function (photoId) {
    const nextPhoto = gState.db.get('photos').find({id: _.toNumber(photoId)}).value();
    if (nextPhoto) {
      // this is init game stuff
      removeSpots();
      setHudText('top', '');
      setHudText('mid', nextPhoto.name);
      this.setPhoto(nextPhoto);
      this.startGame();
    }
  },
  startGame: function () {
    this.wordNum = 0;
    this.word = {};
    this.history = [];
    // generate a unique gameId for logging....
    // need to know how many words and which position this word is in the list?
    this.gameStart = new Date();
    // can't have more spots that there are words
    const maxWords = this.photo.wordSpots.length - this.undefWordList(this.photo.id).length;
    if (this.wordsPerGame > maxWords ) {
      this.wordsPerGame = maxWords;
    }
    this.addWordSpots();
    this.nextWord();
  },
  nextPhoto: function (offset) {
    if (!this.photo) {
      this.changePhoto(1);
    } else if (_.isNumber(offset)) {
      this.changePhoto(this.photo.id + offset);
    } else {
      //1 by default
      this.changePhoto(this.photo.id + 1);
    }
  },
  // returns an array of words that are undefined for the target language
  undefWordList: function (photoId) {
    const words = gState.db.get('words').value(),
      _this = this;
    return _.reduce(gState.db.get('photos').find({id: photoId}).value().wordSpots, function (res, row) {
      const wordRec = words[row.word];
      if (!wordRec || !wordRec[_this.lang]) {
        res.push(row.word);
      }
      return res;
    }, []);
  },
  getPhotoSums: function () {
    const _this = this;
    // careful as this return a reference and gets written back to the db cache
    return _.map(gState.db.get('photos').cloneDeep().value(), photo => {
      // this would be an _.intersect of language
      photo.words = photo.wordSpots.length - _this.undefWordList(photo.id).length;
      photo.creator = 'vr-vocab';
      photo.thumb = photo.src;
      delete photo.wordSpots;
      delete photo.navSpots;
      return photo;
    });

  },
  getUserPhotoData: function () {
    const _this = this;
    return _.map(this.getPhotoSums(), photo => {
      let words = _this.getWordStats(photo.id, _this.lang);
      photo.seen = _.size(words);
      photo.found = _.countBy(words, word => word.correct>0 ).true || 0;
      photo.mastered = _.countBy(words, word => word.firstTime > 0).true || 0;
      //found all = 1 star
      //done all first time = 2 star
      //found all first time last time recently=3 stars.
      // last attempt only, probably needs to be done word by word to find last
      if (photo.words  && photo.words === photo.mastered) {
        photo.stars = 2;
      } else if (photo.words && photo.words === photo.found) {
        photo.stars = 1;
      } else {
        photo.stars = 0;
      }
      return photo;
    });
  },
//TODO: Gametype needs to be play???? --- maybe allow for a filter as an object
  getWordStats: function (photoId) {
    let stats = _.reduce(_.filter(this.db.get('log').filter({photoId: photoId}).value(),
      (filter) => {
        //filters out log entries for current language
        return !!filter.word[this.lang];
      }), (cum, row) => { // language

      function _initWord(word) {
        if (!cum[word]) {
          cum[word] = {attempts: [], correct: 0, incorrect: 0, elapsed: 0, firstTime: 0};
        }
      }

      const word = row.word[this.lang].word,
        rowTime = new Date(row.date).getTime();
      // initialise row for word if it doesnt already exists
      _initWord(word);
      cum[word].attempts.push(row.date);
      if (row.correct) {
        cum[word].correct++;
        if (row.attempt === 1)
          cum[word].firstTime++;
      } else {
        cum[word].incorrect++;
        if (row.guess) {
          _initWord(row.guess);
          cum[row.guess].incorrect++;
        }
      }
      if (cum.lastGame === row.gameStart) {
        cum[word].elapsed += rowTime - cum.lastTime;
      } else {
        cum.games++;
      }
      cum.lastGame = row.gameStart;
      cum.lastTime = rowTime;
      return cum;
    }, {lastGame: '', lastTime: '', games: 0});
    delete stats.lastGame;
    delete stats.lastTime; // might want these numbers actuall for macro-analysis
    delete stats.games; //just returning one key per word for now
    return stats;
  }
};
gState.db.defaults({photos: [], words: {}, log: [], state: {}}).write();

// Socket event handlers
// sync a local copy of the remote database
socket.on('photos', function (data) {
  gState.db.set('photos', data).write();
  // disabled for home screen
  /*
  if (!gState.photo) {
      gState.photo = gState.db.get('photos').first().value();
      gState.setPhoto()
      gState.addWordSpots()
  } */
});
socket.on('words', function (data) {
  gState.db.set('words', data).write();
// THIS IS WHERE WE INIT THE GAME IF NOT ALREADY (eg socket reconnects)
//    if ( _.isEmpty(gState.word) ) gState.initGame();
});
// get the current data from api
fetch('api/words')
  .then(response => response.json())
  .then(data => gState.db.set('words', data).write());

// get the current data from api
fetch('api/photos')
  .then(response => response.json())
  .then(data => gState.db.set('photos', data).write());

// this should really add or update a photo?
/*socket.on('photo', function(data) {
    console.log('photo', data);
    gState.photo=data;
    setPhoto (data.src);
    display all the spots
    data.wordSpots.forEach(appendSpot);
});
 */
// add hotspot to current photo
socket.on('addSpot', function (data) {
  console.log('addspot received', data);
  // check the photo matches but what if for another photo? TODO: NEED TO UPDATE PHOTOS COLLECTION
  if (data.photoId === gState.photo.id) appendSpot(data);
});

// database related functions
// send new spot details to server - where should this live
function remoteSpotAdd(pos) {
  // get the name of the spot
  var hudTop = document.querySelector('#hud-top');
  if (hudTop.getAttribute('text').value) {
    console.log('remote add spot', pos, hudTop.getAttribute('text').value)
    socket.emit('addSpot', {photoId: gState.photo.id, pos: pos, word: hudTop.getAttribute('text').value});
    //need some user feeback it worked? clear the text box
    hudTop.setAttribute('text', 'value:');
  } else {
    // tell user they need to hit return
    document.querySelector('#hud-bot').setAttribute('text', 'value: To add a new spot enter a word first followed by return then point to place');
  }
}

function remoteSpotDel(spotId) {
  console.log('need to add this functionality but can delete in json file easily');
  // emit ('delSpot', spotId[2]) // strip off the VRS or maybe that should be done in the UI layer
}


//function userStats - word stats?


