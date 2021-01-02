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

// dirty global for state management
var gState= {
    db: low(adapter)
};
gState.db.defaults({ photos: [], words: {}, history: [] }).write();
// history - timesramp, photoid, targetword, selectedword, correct

// Socket event handlers
// update record for individual photo
socket.on('photos', function(data) {
    gState.db.set('photos',data).write();
});
socket.on('words', function(data) {
    gState.db.set('words',data).write();
});

socket.on('photo', function(data) {
    console.log('photo', data);
    gState.photo=data;
    setPhoto (data.src);
    // display all the spots
    data.wordSpots.forEach(appendSpot);
});
// add hotspot to current photo
socket.on('addSpot', function(data) {
    console.log('addspot received',data);
    // check the photo
    if (gState.photo.id === data.photoId) {
        appendSpot(data);
    }
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