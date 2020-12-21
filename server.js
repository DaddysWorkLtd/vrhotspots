const express=require('express'),
    socket=require('socket.io'),
    SERVER_PORT = 3069,
    SERVER_NAME = 'daddydev',
    DATA_FILE = './database/vrvocabdb.json'
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
const low = require('lowdb'),
    // use synchronous file mode
    FileSync = require('lowdb/adapters/FileSync'),
    db = low(new FileSync(DATA_FILE));

db.defaults({pictures: [], words: {}, uid: 0} ).write();

/* Data structure
pictures -  src:'', name:'', description: '', parentId:'', [ {hotspotId: '', word:'' , x: 0, y: 0, z:0, radius: 10} ] // may need to be able to specify object type eg circle or rectangular hotposts
words - ( : '', { description : '',
                    dutch: { word:'' . description:'' }

 */


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
    console.log( db.get('pictures').find({id:'P1'}).value());
    db.update('uid', n => n + 1)
        .write()
    // Handle chat event
    socket.on('addSpot', function(data){
        // console.log(data);


        io.emit('addSpot', data)
        messages.push(data);
        console.log (data, messages.length)
    });

});

io.on('connect_failed', function(){
    console.log('Connection Failed');
});

