const express = require("express"),
  socket = require("socket.io"),
  SERVER_PORT = process.env.PORT || 3069,
  SERVER_NAME = process.env.PORT ? 'vr-vocab.glitch.me' : "daddydev",
  DATA_FILE = "./database/vrvocabdb.json",
  fs = require("fs"),
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

db.defaults({ pictures: [], words: {}, uid: 0 }).write();
console.log('lowdb started');
/* Data structure
pictures -  src:'', name:'', description: '', parentId:'', [ {hotspotId: '', word:'' , x: 0, y: 0, z:0, radius: 10} ] // may need to be able to specify object type eg circle or rectangular hotposts
words - ( : '', { description : '',
                    dutch: { word:'' . description:'' }

 */

//static root is public
app.use(express.static("public"));
// start photo hard coded to 1 in connect.

io.on("connection", socket => {
  console.log("made socket connection", socket.id);
  // output all the exiting items?
  // need to check it's a new connection
  //messages.forEach( function (old) {
  //    socket.emit('chat', old);
  //});

  // Handle chat event
  socket.on("addSpot", function(data) {
    // save data
    function getUID() {
      let UID = db.get("uid").value();
      db.update("uid", uid => uid + 1).write();
      console.log(UID);
    }

    //db.get('spo') emits to all client
    io.emit("addSpot", data);
  });
  // return first picture
  io.emit(
    "photo",
    db
      .get("photos")
      .find({ id: 1 })
      .value()
  );
});

io.on("connect_failed", function() {
  console.log("Connection Failed");
});
console.log('server.js complete')