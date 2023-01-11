// BackEnd
import http from "http";
import express from "express";
// import WebSocket from "ws";
import SocketIO from "socket.io";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));

// 홈 외의 다른 페이지 이동시 홈으로 이동
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);
// app.listen(3000, handleListen);

// http서버 생성
const httpServer = http.createServer(app);

// SocketIO Code Start-----------------------------
const wsServer = SocketIO(httpServer); // socketIO 서버 생성
wsServer.on("connection", (backSocket) => {
    backSocket["name"] = "Anonymous"; // 최초 연결 시 이름 초기화
    backSocket.on("enter_room", (roomName, userName, done)=>{ // 방 생성 또는 입장하면
        backSocket.join(roomName); //방에 접속
        backSocket["name"] = userName; // 이름을 소켓에 저장
        backSocket.to(roomName).emit("welcome", backSocket.name); // 나를 제외한 참가한 방 안의 모든 사람에게 emit, name데이터를 프론트 쪽으로 넘겨줌
        done(); // 프론트에서 실행됨
    });
    backSocket.on("new_message", (msg, room, done)=>{ // 새로운 메세지 발생 시 해당 방의 모든 사람에게 메세지 emit
        backSocket.to(room).emit("new_message", `${backSocket.name}: ${msg}`);
        done();
    });
    backSocket.on("disconnecting", ()=>{ // 소켓 연결이 끊기면 모든 사람에게 emit
        backSocket.rooms.forEach((room) => {
            backSocket.to(room).emit("bye", backSocket.name);
        });
    });
})
// SocketIO Code End-----------------------------

// WebSocket Code Start------------------------------
/* // FakeDatabase(누군가 연결되면 아래 변수에 커넥션 담음)
const backSockets = [];

// webSocket서버 생성
const wss = new WebSocket.Server({httpServer}); // {httpServer} is optional

wss.on("connection", (backSocket)=>{
    console.log("Connected to Browser ✅"); // 연결이 생기면
    backSocket.on("close", ()=> console.log("Disconnected from the Browser ❌")); // 브라우저가 꺼졌을 때
    backSockets.push(backSocket); // 연결된 커넥션 푸시
    backSocket["nickname"] = "Anonymous" // 초기 닉네임 설정, 소켓에 넣고싶은 정보 아무거나 저장 가능
    backSocket.on("message", (msg)=>{
        const message = JSON.parse(msg.toString('utf-8')); // 브라우저로부터 받은 메세지를 JSON으로 파싱
        switch(message.type){
            case "new_message":
                backSockets.forEach((allSocket) => allSocket.send(`${backSocket.nickname}: ${message.payload}`)); // 연결된 모든 브라우저로 메세지를 보냄
            case "nickname":
                backSocket["nickname"] = message.payload;
        }
    })
}); */
// WebSocket Code End------------------------------



httpServer.listen(3000, handleListen);