//NODE SERVER
const express = require("express"),
  socket = require("socket.io"),
  SERVER_PORT = process.env.PORT || 3069,
  SERVER_NAME = process.env.PORT ? 'vr-vocab.glitch.me' : "daddydev",
  DATA_FILE = "./database/vrvocabdb.json",
  fs = require("fs"),
    ip=require('ip'),
  protocol = process.env.PORT ? require("http") : require("https") , // non secure for glitch which has process.env defined
  key = fs.readFileSync("./config/devkey.pem"),
  cert = fs.readFileSync("./config/devcert.pem"),
  app = express();
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
  db = low(new FileSync(DATA_FILE));

db.defaults({ photos: [], words: {}, uid: 0 }).write();


//static root is public
app.use(express.static("public"));
// start photo hard coded to 1 in connect.

io.on("connection", socket => {
  console.log("made socket connection", socket.id);
  // return first picture on connect - this should update a single photo client side
  io.emit(
      "photo",
      db
          .get("photos")
          .find({ id: 1 })
          .value()
  );
  // send back the current database on connect
  io.emit(
      "photos",
      db
          .get("photos")
          .value()
  );
  console.log('emiting photos', db
      .get("photos")
      .value() )
  io.emit(
      "words",
      db
          .get("words")
          .value()
  );

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
console.log('server.js complete')