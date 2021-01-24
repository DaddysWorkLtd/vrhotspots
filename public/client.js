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
    NUM_SPOTS: 15,
    gameMode:'TESTING', // learning - written word on 1st attempt, testing - on 2nd attempt, practice - pick any spot, reads out word
                    // might only what NUM_SPOTS in testing mode otherwise do all of them
                    // learning mode - single word, testing mode multiple words, practice mode - all words
    setPhoto: function (photo) {
        if (photo) {
            this.photo = photo;
        }
        setPhoto(this.photo);
    },
    // this creates NUM_SPOTS
    addWordSpots: function () {
        _.forEach(_.sampleSize(this.photo.wordSpots, this.NUM_SPOTS),appendSpot);
    },
    // this deletes wordSpots
    // history - timesramp, photoid, targetword, guess, correct
    correct: function(answer) {
        document.querySelector('#correct').play(); //should be calling a method in the ui code
        // choose a new word
        this.log({date: new Date(), photoid: this.photo.id, word: this.word, correct: 1});
        let score=this.getScore();
        this.nextWord();
        setHudText('bot','Correct: ' + answer + '\n(' + score.correct + ' of ' + this.NUM_SPOTS +')' );
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
        this.log({date: new Date(), photoid: this.photo.id, word: this.word, guess: answer});
        setHudText('bot','Incorrect: ' + answer);
        // increase the attempt
        this.attempt += 1;
        // after 3 incorrect give a clue...
        if (this.attempt > 3 && this.word.clue) {
            setHudText('top','Find: ' + this.word[this.lang].word + ' (' + this.word.clue + ')' );
        } else {
            setHudText('top','Find: ' + this.word[this.lang].word );
        }
        // repeat word out loud
        this.playWord();
    },
    log: function(entry) {
        // we have a local history and a remote log db
        this.history = this.history || [];
        this.history.push(entry);
        // remote log
        socket.emit('log',entry);
    },
    nextWord: function () {
        function _secShow (secs) {
            let basedate = new Date(0);
            if (!secs) return '';
            basedate.setSeconds(secs);// specify value for SECONDS here
            return basedate.toISOString().substr(14, 5) + 's';
        }
        var words = this.db.get('words').value(),
            _candidates = [],
            nextWord;
        // build an array of candidates that have words (ie translations defined)
        document.querySelectorAll('.wordspot').forEach( function (spotEl) {
                // would actually need to check it is defined for the language
                let _word = spotEl.getAttribute('word');
                // notice the coping here, this does not refer to parent object so explicitly reference gstate
                if (words[_word] && words[_word][gState.lang]) {
                    _candidates.push(words[_word]);
                };
            });
        if ( _candidates.length ) {
            // could just as well use
            // sampleSize to get multiple words
            nextWord = _.sample(_candidates);
            // if in learning mode show text from the offset
            if (this.gameMode==='LEARNING') {
                setHudText('top', 'Find: ' + nextWord[this.lang].word);
            }
            this.word=nextWord;
            this.playWord();
        } else {
            let score = this.getScore();
            this.word={};
            // make sure there have been words, otherwise when editing you get a broken message in top hud
            if (score.correct) {
                setHudText('top', 'Accuracy: ' + Math.round(score.correct*100/score.attempts) + '% Completed in ' + _secShow(score.elapsed / 1000));
                setHudText('mid', 'Refresh to play again');
            }

        }

    },
    playWord: function() {
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
            audio.play();
            audio.addEventListener('ended', wordPlay );
        }
    },
    changePhoto: function(photoId) {
        const nextPhoto = gState.db.get('photos').find( {id:photoId}).value();
        if (nextPhoto) {
            removeSpots();
            setHudText('top','');
            setHudText('mid', nextPhoto.name);
            this.setPhoto(nextPhoto);
            this.word={};
            this.addWordSpots();
            this.nextWord();
        }
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
gState.db.defaults({ photos: [], words: {}, history: [] }).write();

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
    /* WTF is this doing here? Hiding the spots!?!=g MAYBE BECAUSE WE DON"T SHOW ALL SPOTS NOW
    [].forEach.call(document.querySelectorAll('.wordspot'), function (el) {
        el.setAttribute('opacity',0);
    }); */
    // Needs to be added to photo
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

