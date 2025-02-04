// const express = require('express');
// const socket = require('socket.io');
// const http = require('http');
// const { Chess } = require('chess.js');
// const app = express();
// const path = require('path');
// const Server = http.createServer(app);
// const io = socket(Server);

// const chess = new Chess();
// let players = {};

// app.set("view engine", "ejs");
// app.use(express.static(path.join(__dirname, "public")));

// app.get('/', (req, res) => {
//   res.render('index', { title: "chess" });
// });

// io.on('connection', (uniquesocket) => {
//   if (!players.white) {
//     players.white = uniquesocket.id;
//     uniquesocket.emit('playerrole', 'w');
//     uniquesocket.emit('boardstate', chess.fen()); // Send current board state
//   } else if (!players.black) {
//     players.black = uniquesocket.id;
//     uniquesocket.emit('playerrole', 'b');
//     uniquesocket.emit('boardstate', chess.fen()); // Send current board state
//   } else {
//     uniquesocket.emit('spectatorrole');
//     uniquesocket.emit('boardstate', chess.fen()); // Send current board state
//   }

//   uniquesocket.on('disconnect', () => {
//     if (uniquesocket.id === players.white) {
//       delete players.white;
//       if (players.black) {
//         io.to(players.black).emit('opponentLeft');
//       }
//     } else if (uniquesocket.id === players.black) {
//       delete players.black;
//       if (players.white) {
//         io.to(players.white).emit('opponentLeft');
//       }
//     }
//   });

//   uniquesocket.on("move", (move) => {
//     try {
//       if (chess.turn() === 'w' && uniquesocket.id !== players.white) return;
//       if (chess.turn() === 'b' && uniquesocket.id !== players.black) return;
//       const result = chess.move(move);
//       if (result) {
//         io.emit("move", move);
//         io.emit("boardstate", chess.fen());
//       } else {
//         uniquesocket.emit("invalid move", move);
//       }
//     } catch (err) {
//       console.log(err);
//       uniquesocket.emit("invalid move", move);
//     }
//   });
// });

// Server.listen(3000, function () {
//   console.log('listening on *:3000');
// });
const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");

const app = express();
const path = require("path");
const server = http.createServer(app);
const io = socket(server);

let chess = new Chess();
let players = {};

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { title: "Chess" });
});

io.on("connection", (socket) => {
  if (!players.white) {
    players.white = socket.id;
    socket.emit("playerrole", "w");
  } else if (!players.black) {
    players.black = socket.id;
    socket.emit("playerrole", "b");
  } else {
    socket.emit("spectatorrole");
  }

  socket.emit("boardstate", chess.fen());

  socket.on("move", (move) => {
    const currentTurn = chess.turn();
    const playerId = currentTurn === "w" ? players.white : players.black;

    if (socket.id !== playerId) {
      socket.emit("invalidMove", "Not your turn");
      return;
    }
    try {
      const moveResult = chess.move(move);
      if (moveResult) {
        io.emit("move", move);
        io.emit("boardstate", chess.fen());
        if (chess.inCheck()) {
          const opponentId =
            currentTurn === "w" ? players.black : players.white;
          if (opponentId) {
            io.to(opponentId).emit("checkAlert", "You are in check!");
          }
        }
        if (chess.isGameOver()) {
          let resultMessage = "Game Over";
          if (chess.isCheckmate()) {
            resultMessage = "Checkmate!";
          } else if (chess.isDraw()) {
            resultMessage = "It's a Draw!";
          } else if (chess.isStalemate()) {
            resultMessage = "Stalemate!";
          }

          io.emit("gameover", { message: resultMessage, pgn: chess.pgn() });
        }
      } else {
        socket.emit("invalidMove", "Invalid move attempted");
      }
    } catch (error) {
      socket.emit("invalidMove", "Invalid move attempted");
    }
  });

  socket.on("rematch", () => {
    if (!players.white || !players.black) return;
    io.emit("rematchAccepted");
    chess = new Chess();
    io.emit("boardstate", chess.fen());
  });
  socket.on("disconnect", () => {
    if (socket.id === players.white) {
      setTimeout(() => {
        if (players.white === socket.id) {
          delete players.white;
          if (players.black) {
            io.to(players.black).emit("opponentLeft");
          }
        }
      }, 5000); 
    } else if (socket.id === players.black) {
      setTimeout(() => {
        if (players.black === socket.id) {
          delete players.black;
          if (players.white) {
            io.to(players.white).emit("opponentLeft");
          }
        }
      }, 5000); 
    }
  });
});
server.listen(3000, function () {
  console.log("Server is running on port 3000");
});

