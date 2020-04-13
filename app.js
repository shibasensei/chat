require("dotenv").config();
const socketIO = require("socket.io");
const express = require("express");
const app = express();
const http = require("http");
const port = process.env.PORT || 5000;
const rtns = require("./rout");
let server = http.createServer(app);
let io = socketIO(server);

//helper func
function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

// main socket routine
let users = [];
let rooms = ["default"];
let adminColour = "#e01010";
io.on("connection", (socket) => {
  console.log("new connection established");
  console.log(users);
  socket.emit("allusers", {
    allusers: users,
  });
  socket.emit("allRooms", {
    allrooms: rooms,
  });
  // client has joined
  socket.on("join", (client) => {
    if (users.indexOf(client.chatName) > -1) {
      socket.emit("nameexists", {
        from: "Admin",
        text: "name already taken, try a different name",
        colour: adminColour,
        room: socket.room,
        time: rtns.getTime(),
      });
    } else {
      socket.emit("allusers", {
        allusers: users,
      });
      rooms.push(client.roomName);
      rooms = rooms.filter(onlyUnique);
      socket.name = client.chatName;
      socket.room = client.roomName;
      socket.colour = rtns.newColour();
      users.push({
        name: client.chatName,
        room: client.roomName,
      });
      socket.join(client.roomName);
      socket.emit("allRooms", {
        allrooms: rooms,
      });
      socket.emit("welcome", {
        from: "Admin",
        text: `welcome ${client.chatName}`,
        colour: adminColour,
        room: socket.room,
        time: rtns.getTime(),
      });
      socket.to(client.roomName).emit("someonejoined", {
        from: "Admin",
        text: `${client.chatName} has joined the ${client.roomName} room`,
        colour: adminColour,
        room: socket.room,
        time: rtns.getTime(),
      });
    }
  });
  socket.on("disconnect", async () => {
    socket.to(socket.room).emit("someoneleft", {
      from: "Admin",
      text: `${socket.name} has left the main room`,
      colour: socket.colour,
      room: socket.room,
      time: rtns.getTime(),
    });
  });
  socket.on("typing", (client) => {
    socket.to(socket.room).emit("someoneistyping", {
      from: client.from,
      text: `${client.from} is typing`,
      colour: socket.colour,
      room: socket.room,
      time: rtns.getTime(),
    });
  });
  socket.on("message", (client) => {
    io.in(socket.room).emit("newmessage", {
      from: client.from,
      text: client.text,
      colour: socket.colour,
      room: socket.room,
      time: rtns.getTime(),
    });
  });
});
app.use((req, res, next) => {
  const error = new Error("No such route found");
  error.status = 404;
  next(error);
});
app.use((error, req, res, next) => {
  res.status(error.status || 500).send({
    error: {
      status: error.status || 500,
      message: error.message || "Internal Server Error",
    },
  });
});
server.listen(port, () => console.log(`starting on port ${port}`));
