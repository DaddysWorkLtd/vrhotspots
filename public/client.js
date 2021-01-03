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
    setPhoto: function () {
        setPhoto(this.photo.src);
    },
    addWordSpots: function () {
        this.photo.wordSpots.forEach(appendSpot);
    },
    // history - timesramp, photoid, targetword, guess, correct
    correct: function(answer) {
        // choose a new word
        this.history = this.history || [];
        this.history.push([{date: new Date(), photoid: this.photo.id, word: this.word, correct: 1}]);
        setHudText('bot','Yes! It is: ' + answer);
        this.word='correct';
        this.nextWord();
    },
    incorrect: function(answer) {
        // choose a new word
        this.history = this.history || [];
        this.history.push([{date: new Date(), photoid: this.photo.id, word: this.word, guess: answer}]);
        setHudText('bot','Incorrect: ' + answer);
    },
    nextWord: function () {
        var words = this.db.get('words').value(),
            nextWord;
        // just loop through spots with words defined
        document.querySelectorAll('.wordspot').forEach( function (spotEl) {
                // would actually need to check it is defined for the language
                nextWord = nextWord || words[spotEl.getAttribute('word')];
            });
        if (nextWord) {
            setHudText('top', 'Find: ' + nextWord[gState.lang].word);
        } else {
            setHudText('top', 'Completed. Refresh to play again');
        }
        this.word=nextWord;
    },
    initGame: function() {
        // scoping isse with
        this.nextWord();
    }
};
gState.db.defaults({ photos: [], words: {}, history: [] }).write();

// Socket event handlers
// sync a local copy of the remote database
socket.on('photos', function(data) {
    gState.db.set('photos',data).write();
    // not currently in use as the photo method works
    if (!gState.photo) {
        gState.photo = gState.db.get('photos').first().value();
        gState.setPhoto()
        gState.addWordSpots()
    }
});
socket.on('words', function(data) {
    gState.db.set('words',data).write();
// THIS IS WHERE WE INIT THE GAME
    gState.initGame();
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
    // check the photo
    [].forEach.call(document.querySelectorAll('.wordspot'), function (el) {
        el.setAttribute('opacity',0);
    });
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

