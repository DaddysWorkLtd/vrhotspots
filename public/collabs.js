// CLIENT socket.io
// Make connection
const adapter = new LocalStorage('db'),
    db = low(adapter),
    socket = io.connect('https://daddydev:3069');

socket.on('photo', function(data) {
    console.log('photo', data);
    setPhoto (data.src);
});
// Socket event handlers
socket.on('addSpot', function(data) {
    console.log('addspot received',data)
    appendSpot(data.point);
});
function RemoteSpotAdd( spot ) {
    console.log('remote add spot', spot)
    socket.emit('addSpot',spot);
}
