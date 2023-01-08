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

// bsocket: backendSocket
wss.on("connection", (bSocket)=>{
    // console.log(bSocket);
    console.log("Connected to Browser ✅"); // 연결이 생기면
    bSocket.send("hello!!"); // 브라우저로 메세지를 보냄
    bSocket.on("message", (message)=>{
        console.log(message.toString('utf-8')); // 브라우저가 서버에 보낸 메세지
    })
    bSocket.on("close", ()=> console.log("Disconnected from the Browser ❌")); // 브라우저가 꺼졌을 때
});

server.listen(3000, handleListen);