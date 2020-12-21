// CLIENT socket.io
// Make connection
const socket = io.connect('https://daddydev:3069');

// Socket event handlers
socket.on('addSpot', function(data) {
    console.log('addspot received',data)
    AppendSpot(data.point);
});
function RemoteSpotAdd( spot ) {
    console.log('remote add spot', spot)
    socket.emit('addSpot',spot);
}
