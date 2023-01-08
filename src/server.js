// BackEnd
import http from "http";
import express from "express";
import WebSocket from "ws";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));

// 홈 외의 다른 페이지 이동시 홈으로 이동
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);
// app.listen(3000, handleListen);

// http, webSocket서버 둘 다 돌리는 방법
// http서버 생성
const server = http.createServer(app);
// webSocket서버 생성
const wss = new WebSocket.Server({server}); // {server} is optional

// FakeDatabase(누군가 연결되면 아래 변수에 커넥션 담음)
const bSockets = [];

// bsocket: backendSocket
wss.on("connection", (bSocket)=>{
    console.log("Connected to Browser ✅"); // 연결이 생기면
    bSockets.push(bSocket); // 연결된 커넥션 푸시
    bSocket["nickname"] = "Anonymous" // 초기 닉네임 설정, 소켓에 넣고싶은 정보 아무거나 저장 가능
    bSocket.on("message", (msg)=>{
        const message = JSON.parse(msg.toString('utf-8')); // 브라우저로부터 받은 메세지를 JSON으로 파싱
        switch(message.type){
            case "new_message":
                bSockets.forEach((aSocket) => aSocket.send(`${bSocket.nickname}: ${message.payload}`)); // 연결된 모든 브라우저로 메세지를 보냄
            case "nickname":
                bSocket["nickname"] = message.payload;
        }
    })
    bSocket.on("close", ()=> console.log("Disconnected from the Browser ❌")); // 브라우저가 꺼졌을 때
});

server.listen(3000, handleListen);