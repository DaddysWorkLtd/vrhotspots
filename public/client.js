// Frontend CLIENT code
// contains application logic
var sockurl;
if (window.location.hostname === 'daddydev') {
    sockurl = 'https://daddydev:3069';
}else {
// for glitch etc
  sockurl = 'https://' + window.location.hostname;
  //sockurl = 'https://daddyswork.com:3069';
}
// initialis lowdb
const adapter = new LocalStorage('db'),
    socket = io.connect(sockurl);

// dirty global for state management....
var gState= {
    db: low(adapter),
    lang: 'nl',
    word: {},
    // how many attempts on current word
    attempt: 1,
    wordsPerGame: 15,
    gameMode:'Play', // learning - written word on 1st attempt, testing - on 2nd attempt, practice - pick any spot, reads out word
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
        _.forEach(_.sampleSize(this.photo.wordSpots, this.wordsPerGame),appendSpot);
    },
    // this deletes wordSpots
    // history - timesramp, photoid, targetword, guess, correct
    correct: function(answer) {
        document.querySelector('#correct').play(); //should be calling a method in the ui code
        // choose a new word
        this.log({date: new Date(), photoId: this.photo.id, word: this.word, correct: 1});
        let score=this.getScore();
        this.nextWord();
        setHudText('bot','Correct: ' + answer + '\n(' + score.correct + ' of ' + this.wordsPerGame +')' );
        // don't clear the bottom hud when the spot is removed ending the intersection
        this.stickyBot = true;
        this.attempt=1;
    },
    getScore: function() {
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
    incorrect: function(answer) {
        document.querySelector('#incorrect').play();
        this.log({date: new Date(), photoId: this.photo.id, word: this.word, guess: answer});
        setHudText('bot','Incorrect: ' + answer);
        // increase the attempt
        this.attempt += 1;
        // after 3 incorrect give a clue...
        if (this.attempt > 3 && this.word.clue) {
            setHudText('top','Vind: ' + this.word[this.lang].word + ' (' + this.word.clue + ')' );
        } else {
            setHudText('top','Vind: ' + this.word[this.lang].word );
        }
        // repeat word out loud
        this.playWord();
    },
    log: function(entry) {
        // we have a local history and a remote log db
        console.log(entry);
        entry.attempt=this.attempt;
        entry.userId=this.userId;
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
        socket.emit('log',entry);
    },

    nextWord: function () {

        var words = this.db.get('words').value(),
            _candidates = [],
            nextWord;
        // build an array of candidates that have words (ie translations defined)
        document.querySelectorAll('.wordspot').forEach( function (spotEl) {
                // would actually need to check it is defined for the language
                let _word = spotEl.getAttribute('word');
                // notice the scoping here (in a cb function), this does not refer to parent object so explicitly reference gstate
                if (words[_word] && words[_word][gState.lang]) {
                    // so there is a translation defined for this language, apppend the english as that is the key and needed for logging
                    words[_word]['en'] = _word;
                    _candidates.push(words[_word]);
                };
            });
        if ( _candidates.length ) {
            // could just as well use
            // sampleSize to get multiple words
            this.wordNum++;
            nextWord = _.sample(_candidates);
            // if in learning mode show text for all attempts, otherwise start without it
            if (this.gameMode==='Learn') {
                setHudText('top', 'Vind: ' + nextWord[this.lang].word);
            }
            this.word=nextWord;
            this.playWord();
        } else {
            this.endGame();
        }

    },
    endGame: function () {
        function _secShow (secs) {
            let basedate = new Date(0);
            if (!secs) return '';
            basedate.setSeconds(secs);// specify value for SECONDS here
            return basedate.toISOString().substr(14, 5) + 's';
        }
        let score = this.getScore();
        this.word={};
        // make sure there have been words, otherwise when editing you get a broken message in top hud
        if (score.correct) {
            setHudText('top', 'Accuracy: ' + Math.round(score.correct*100/score.attempts) + '% Completed in ' + _secShow(score.elapsed / 1000));
            setHudText('mid', 'Refresh to play again');
        }
    },
    playWord: function(wordOnly) {
      // we might want a delay on this, we could also write it as a method so that it is call cached
        let trans=this.word[this.lang];
        if (trans.audio) {
            let audio = new Audio( "audio/" + this.lang + "/where-is.mp3" ),
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
                audio.addEventListener('ended', wordPlay );
            }
        }
    },
    changePhoto: function(photoId) {
        const nextPhoto = gState.db.get('photos').find( {id:_.toNumber(photoId)}).value();
        if (nextPhoto) {
            // this is init game stuff
            removeSpots();
            setHudText('top','');
            setHudText('mid', nextPhoto.name);
            this.setPhoto(nextPhoto);
            this.startGame();
        }
    },
    startGame: function () {
        this.wordNum = 0;
        this.word={};
        this.history = [];
        // generate a unique gameId for logging....
        // need to know how many words and which position this word is in the list?
        this.gameStart=new Date();
        this.addWordSpots();
        this.nextWord();
    },
    nextPhoto: function(offset) {
        if (!this.photo) {
            this.changePhoto(1);
        } else if (_.isNumber(offset)) {
            this.changePhoto( this.photo.id+offset );
        } else {
            //1 by default
            this.changePhoto(this.photo.id + 1);
        }
    }
};
gState.db.defaults({ photos: [], words: {}, log: [], state: {} }).write();

// Socket event handlers
// sync a local copy of the remote database
socket.on('photos', function(data) {
    gState.db.set('photos',data).write();
    // disabled for home screen
    /*
    if (!gState.photo) {
        gState.photo = gState.db.get('photos').first().value();
        gState.setPhoto()
        gState.addWordSpots()
    } */
});
socket.on('words', function(data) {
    gState.db.set('words',data).write();
// THIS IS WHERE WE INIT THE GAME IF NOT ALREADY (eg socket reconnects)
//    if ( _.isEmpty(gState.word) ) gState.initGame();
});
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
socket.on('addSpot', function(data) {
    console.log('addspot received',data);
    // check the photo matches but what if for another photo? TODO: NEED TO UPDATE PHOTOS COLLECTION
    if (data.photoId === gState.photo.id) appendSpot (data);
});

// database related functions
// send new spot details to server - where should this live
function remoteSpotAdd( pos ) {
    // get the name of the spot
    var hudTop = document.querySelector('#hud-top');
    if (hudTop.getAttribute('text').value) {
        console.log('remote add spot', pos, hudTop.getAttribute('text').value)
        socket.emit('addSpot', {photoId: gState.photo.id, pos: pos, word: hudTop.getAttribute('text').value} );
        //need some user feeback it worked? clear the text box
        hudTop.setAttribute('text','value:');
    } else {
        // tell user they need to hit return
        document.querySelector('#hud-bot').setAttribute('text', 'value: To add a new spot enter a word first followed by return then point to place');
    }
}
function remoteSpotDel( spotId ) {
    console.log ('need to add this functionality but can delete in json file easily');
    // emit ('delSpot', spotId[2]) // strip off the VRS or maybe that should be done in the UI layer
}

// returns an array of words that are undefined for the target language
function undefWords( photoId) {
    const words = gState.db.get('words').value();
    return _.reduce(gState.db.get('photos').find({id:photoId}).value().wordSpots,function (res, row) {
        const wordRec=words[row.word];
        if(!wordRec || !wordRec[gState.lang]) {
            res.push(row.word);
        }
        return res;
    },[]);
}


// name, description, words, src, thumb src, creator... words defined for current language
function photoSums () {
    return _.map(gState.db.get('photos').value(),photo=>{
        // this would be an _.intersect of language
        photo.words=photo.wordSpots.length - undefWords(photo.id).length;
        photo.creator = 'vr-vocab';
        photo.thumb = photo.src;
        delete photo.wordSpots;
        delete photo.navSpots;
        return photo;
    });
}

//function roomStats

//function userPhotoStats
//words found..... fastest game (need to record game type in game id perhaps)...
var s = new Set(); // an array with no duplicates
function userPhotoStats (photoId) {
    // words seen.... learned..... mastered... stars.
    //_.map(gState.db.get('log'),row => { return { date:row.date, en: row.word.en, nl: row.word.nl.word, guess: row.guess};})
}

function wordStats (photoId) {
    // could also do this without a photoId
    let stats = _.reduce ( gState.db.get('log').filter({photoId:photoId}).value(), ( cum, row) => {
        function _initWord( word ) {
            if (!cum[ word ] ) {
                cum[ word ] = { attempts: [], correct: 0, incorrect: 0, elapsed: 0 };
            }
        }
        const word = row.word[gState.lang].word,
            rowTime = new Date (row.date).getTime();
        _initWord( word );
        cum[word].attempts.push(row.date);
        if ( row.correct ) {
            cum[word].correct++;
        } else {
            cum[word].incorrect++;
            if (row.guess) {
                _initWord(row.guess);
                cum[row.guess].incorrect++;
            }
        }
        if ( cum.lastGame=== row.gameStart) {
            cum[word].elapsed += rowTime-cum.lastTime;
        } else {
            cum.games++;
        }
        cum.lastGame=row.gameStart;
        cum.lastTime=rowTime;
        return cum;
    }, { lastGame : '', lastTime: '', games:0});
    delete stats.lastGame;
    delete stats.lastTime;
    delete stats.games; //just returning one key per word for now
    return stats;
}



//function userStats - word stats?


