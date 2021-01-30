//NODE SERVER
const express = require("express"),
    socket = require("socket.io"),
    SERVER_PORT = process.env.PORT || 3069,
    SERVER_NAME = process.env.PORT ? 'vr-vocab.glitch.me' : "daddydev",
    DATA_FILE = "./database/vrvocabdb.json",
    PRIVATE_DATA = "./database/privatedb.json",
    fs = require("fs"),
    ip=require('ip'),
    protocol = process.env.PORT ? require("http") : require("https") , // non secure for glitch which has process.env defined
    key = fs.readFileSync("./config/devkey.pem"),
    cert = fs.readFileSync("./config/devcert.pem"),
    app = express(),
    requestIp = require('request-ip');
//getting the IP address
//
 app.use(requestIp.mw());

var server;
// if on glitch dont create a secure server as their proxy does that and it will cause hang ups
if (!process.env.PORT)
{
    server = protocol
        .createServer({ key: key, cert: cert }, app)
        .listen(SERVER_PORT, function() {
            console.log("https server started on ", SERVER_PORT);
        });
} else {
    // spin up secure server otherwise cant have webvr
    server = protocol
        .createServer(app)
        .listen(SERVER_PORT, function() {
            console.log("http server started on ", SERVER_PORT);
        });
}
io = socket(server);
/* ignore cors and just accept all for now but this did work
io = socket(server,{
  cors: {
    origin: "https://" + SERVER_NAME, //+ ":" + SERVER_PORT,
    methods: ["GET", "POST"]
  }
});*/

// routes
const low = require("lowdb"),
    // use synchronous file mode
    FileSync = require("lowdb/adapters/FileSync"),
    db = low(new FileSync(DATA_FILE)),
    udb = low(new FileSync(PRIVATE_DATA));

db.defaults({ photos: [], words: {}, uid: 0 }).write();
udb.defaults({ users: [], log: []}).write();


//static root is public
app.use(express.static("public"));
// start photo hard coded to 1 in connect.

io.on("connection", socket => {
    console.log("made socket connection", socket.id);
    // send back the current database on connect
    /*io.emit(
        "photos",
        db
            .get("photos")
            .value()
    );*/
    /* this causes the front end to keep reconnecting!
    io.emit(
      "words",
      db
        .get("words")
        .value()
    );*/

    // handle logging send everything to db
    socket.on("log", function(entry) {
        entry.id=socket.id;
        // NEED TO IMPLEMENT SOCKET HANDLER AS MIDDLEWARE TO GET IP from clientIP entry.ip=requestIp.get
        udb.get("log").push(entry).write();
    })
    // Handle add spot event by recording in database and broadcasting out
    socket.on("addSpot", function(data) {
        // save data
        function getUID() {
            let UID = db.get("uid").value();
            db.update("uid", uid => uid + 1).write();
            // also puts the server ip on it. It's in sync mode so db should lock on each request. Ok for now
            return( UID.toString() + ip.toLong(ip.address()).toString() );
        }
        // flush the db cashe or it will keep overwriting live edits
        db.read();
        //get the photo and update the spot array
        let rec = db
                .get("photos")
                .find({ id: data.photoId }),
            photo = rec.value();

        console.log('add spot',JSON.stringify(data));
        // append spot to array of wordSpots j
        data.id = getUID()
        photo.wordSpots.push( data );

        // write to database
        rec.assign(photo).write();

        //emits new spot to all clients, including the photoid so all clients get all spots for now
        io.emit("addSpot", data);
    });

});
io.on("connect_failed", function() {
    console.log("Connection Failed");
});

app.get('/api/ping', function(req,res,rrq) {  res.send('pong poo poo')});

app.get('/api/words/:word/:lang', (req,res,rrq) => res.json( db.get('words').value()[req.params.word][req.params.lang] ));
app.get('/api/words/:word', (req,res,rrq) => res.json( db.get('words').value()[req.params.word] ));
app.get('/api/words', (req,res,rrq) => { console.log('words'); res.json( db.get('words').value() )});
app.get('/api/photos/:id/wordspots', (req,res,rrq) => res.json( db.get('photos').find({id:req.params.id*1}).value().wordSpots ));
app.get('/api/photos', (req,res,rrq) => res.json( db.get('photos').value() ));
app.get('/api/photos/:id', (req,res,rrq) => res.json( db.get('photos').find({id:req.params.id*1}).value() ));

// for current user todo implement
app.get('/api/logs/', (req,res,rrq) => res.json( udb.get('logs').value() ));

console.log('server.js complete')