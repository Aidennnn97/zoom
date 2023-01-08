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

const handleListen = () => console.log(`Listening on http://localhost:3000 or ws://localhost:3000`);
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
    console.log(bSockets);
    bSocket.on("message", (message)=>{
        bSockets.forEach((aSocket) => aSocket.send(message.toString('utf-8'))); // 연결된 모든 브라우저로 메세지를 보냄
    })
    bSocket.on("close", ()=> console.log("Disconnected from the Browser ❌")); // 브라우저가 꺼졌을 때
});

server.listen(3000, handleListen);