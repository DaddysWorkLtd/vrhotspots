// CLIENT socket.io
// Make connection
// hostname -- use daddydev locally
if (window.location.hostname === 'daddydev') {
    sockurl = 'https://daddydev:3069';
}else {
    sockurl = 'https://daddyswork.com:3069';
}

const adapter = new LocalStorage('db'),
    db = low(adapter),
    socket = io.connect(sockurl);

var gState= {};
socket.on('photo', function(data) {
    console.log('photo', data);
    gState.photo=data;
    setPhoto (data.src);
});
// Socket event handlers
socket.on('addSpot', function(data) {
    console.log('addspot received',data)
    appendSpot(data.point);
});
function RemoteSpotAdd( spot ) {
    console.log('remote add spot', spot)
    socket.emit('addSpot', {photoId: gState.photo.id, spot: spot} );
}
