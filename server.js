const express=require('express'),
    socket=require('socket.io'),
    SERVER_PORT = 3069,
    SERVER_NAME = 'localhost',
    fs = require('fs'),
    https= require('https'),
    key = fs.readFileSync('./config/devkey.pem'),
    cert = fs.readFileSync('./config/devcert.pem'),
    app = express(),
    server = https.createServer({key: key, cert: cert , hostname: SERVER_NAME}, app).listen(SERVER_PORT),
    io = socket(server, {
        cors: {
            origin: "http://" + SERVER_NAME + ":" + SERVER_PORT,
            methods: ["GET", "POST"],
        }
    });
// routes


//static root is public
app.use(express.static('public'));




var messages = [];
io.on('connection', (socket) => {
    console.log('made socket connection', socket.id);
    // output all the exiting items?
    // need to check it's a new connection
    //messages.forEach( function (old) {
    //    socket.emit('chat', old);
    //});

    // Handle chat event
    socket.on('addSpot', function(data){
        // console.log(data);
        //socket.broadcast.emit('chat', data);
        io.emit('addSpot', data)
        messages.push(data);
        console.log (data, messages.length)
    });

});

io.on('connect_failed', function(){
    console.log('Connection Failed');
});

