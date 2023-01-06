const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: "*"
  }
});

const port = process.env.PORT || 6001;


// Key: room id, Value: dictionary of doodleboard and codeboard state
const room_data = {}
// Key: socket id, Value: room id
const user_room = {}

function check_room_data(room, failed_function) {
  if (!(room in room_data)) {
    room_data[room] = {state: null, color: null, size: null, code: null, language: null};
    console.log("room data not found bug during " + failed_function);
  }
}



io.on('connection', (socket) =>
{
  console.log('user connected ' + socket.id);

  socket.on('disconnect', function () {
    console.log('user disconnected');
    console.log("room_data on leaving")
    delete user_room[socket.id];
    console.log(room_data)
    console.log(user_room)
    // when all users are gone, consider removing room from room_data
  });

  socket.on('sync_request', function () {
    var current_room = user_room[socket.id];
    check_room_data(current_room, "sync_request");
    io.to(socket.id).emit("sync_up", room_data[current_room].code, room_data[current_room].language,
    room_data[current_room].state, room_data[current_room].color, room_data[current_room].size);
  });

  socket.on('room_request', function (room) {
    socket.join(room);
    user_room[socket.id] = room;
    if (!(room in room_data)) {
      room_data[room] = {state: null, color: null, size: null, code: null, language: null};
    }
    console.log("room_data on joining");
    console.log(room_data);
    console.log(user_room);
  });

  // codeboard
  socket.on('codeboard_update', function (code_value, new_line, new_num_lines) {
    var current_room = user_room[socket.id];
    check_room_data(current_room, "codeboard_update");
    room_data[current_room].code = code_value;
    socket.to(current_room).emit("codeboard_relay", code_value, new_line, new_num_lines);
  });
  socket.on('update_language', function (lang) {
    var current_room = user_room[socket.id];
    check_room_data(current_room, "update_language");
    room_data[current_room].language = lang;
    socket.to(current_room).emit("language_relay", lang);
  });

  // doodleboard
  socket.on('whiteboard_dragstart', function () {
    socket.to(user_room[socket.id]).emit("whiteboard_dragstart_relay");
  });
  socket.on('whiteboard_drag', function (event) {
    socket.to(user_room[socket.id]).emit("whiteboard_drag_relay", event);
  });
  socket.on('whiteboard_dragend', function (event, state) {
    var current_room = user_room[socket.id];
    check_room_data(current_room, "whiteboard_dragend");
    room_data[current_room].state = state;
    socket.to(current_room).emit("whiteboard_dragend_relay", event);
  });
  socket.on('whiteboard_undo', function (event, state) {
    var current_room = user_room[socket.id];
    check_room_data(current_room, "whiteboard_undo");
    room_data[current_room].state = state;
    socket.to(current_room).emit("whiteboard_undo_relay");
  });
  socket.on('whiteboard_redo', function (event, state) {
    var current_room = user_room[socket.id];
    check_room_data(current_room, "whiteboard_redo");
    room_data[current_room].state = state;
    socket.to(current_room).emit("whiteboard_redo_relay");
  });
  socket.on('whiteboard_clear', function (event, state) {
    var current_room = user_room[socket.id];
    check_room_data(current_room, "whiteboard_clear");
    room_data[current_room].state = state;
    socket.to(current_room).emit("whiteboard_clear_relay");
  });
  socket.on('update_color', function (color) {
    var current_room = user_room[socket.id];
    check_room_data(current_room, "update_color");
    room_data[current_room].color = color;
    socket.to(current_room).emit("update_color_relay", color);
  });
  socket.on('update_size', function (size) {
    var current_room = user_room[socket.id];
    check_room_data(current_room, "update_size");
    room_data[current_room].size = size;
    socket.to(current_room).emit("update_size_relay", size);
  });
})

server.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
