const express = require('express')
const socket=require('socket.io');
const http=require('http');
const{Chess}=require('chess.js')
const app = express()
const path=require('path')
const Server=http.createServer(app);//http ka server chaiye linked with express ke server
const io=socket(Server);

const chess=new Chess();
let players={};
// let current='w';
app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")));

app.get('/', (req, res) => {
  res.render('index',{title:"chess"});
})
io.on('connection',(uniquesocket)=>{
//   uniquesocket.on('churan',()=>{
//    io.emit('churan papdi')
//   })
//    uniquesocket.on('disconnect',()=>{
//     console.log('disconnected');
//     io.emit('disconnected');
//    })
 if(!players.white){
    players.white=uniquesocket.id;
    uniquesocket.emit('playerrole','w');
 }
 else if(!players.black){
    players.black=uniquesocket.id;
    uniquesocket.emit('playerrole','b');
 }
 else{
    uniquesocket.emit('spectatorrole')
 }
//  uniquesocket.on('disconnect',()=>{
//     if(uniquesocket.id===players.white){
//         delete(players.white);
//     }
//     else if(uniquesocket.id===players.black){
//         delete(players.black);
//     }
//  })
uniquesocket.on('disconnect', () => {
  if (uniquesocket.id === players.white) {
    delete players.white;
    if (players.black) {
      io.to(players.black).emit('opponentLeft');
    }
  } else if (uniquesocket.id === players.black) {
    delete players.black;
    if (players.white) {
      io.to(players.white).emit('opponentLeft');
    }
  }
});
 uniquesocket.on("move",(move)=>{
   try{
    if(chess.turn()==='w' && uniquesocket.id !==players.white) return;
    if(chess.turn()==='b' && uniquesocket.id !==players.black) return;
    const result=chess.move(move)
    if(result){
        current=chess.turn();
        io.emit("move",move);
        io.emit("boardstate",chess.fen())
    }
    else{
        console.log("Invalid Move")
        socket.emit("invalid move",move);
    }
   }
   catch(err){
    console.log(err);
    uniquesocket.emit("Invalid move",move)
   }
})
})
Server.listen(3000,function(){
    console.log('listening')
})
