// BackEnd
import http from "http";
import express from "express";
// import WebSocket from "ws";
import {Server} from "socket.io";
import { instrument } from "@socket.io/admin-ui";

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
const wsServer = new Server(httpServer, {
    cors: {
        origin: ["https://admin.socket.io"], // 서버 URL
        credentials: true
    }
}); // socketIO 서버 생성

instrument(wsServer, {
    auth: false
});

// back-end에서 connection 받을 준비.
wsServer.on("connection", (backSocket) => {
    backSocket["Nickname"] = "Anonymous"; // 최초 연결 시 이름 초기화

    backSocket.onAny((event) => {
        //console.log(wsServer.sockets.adapter);
        console.log(`Socket Event: ${event}`);
    });

    backSocket.on("join_room", (roomName, userNickname)=>{ // 방 생성 또는 입장하면
        backSocket.join(roomName); //방에 접속
        backSocket["Nickname"] = userNickname; // 이름을 소켓에 저장
        backSocket.to(roomName).emit("welcome", backSocket.Nickname); // 나를 제외한 참가한 방 안의 모든 사람에게 emit, name데이터를 프론트 쪽으로 넘겨줌
    });

    backSocket.on("offer", (offer, roomName) => { // 사용자로부터 offer를 받으면
        backSocket.to(roomName).emit("offer", offer);
    });

    backSocket.on("answer", (answer, roomName) => {
        backSocket.to(roomName).emit("answer", answer);
    });

    backSocket.on("ice", (ice, roomName) => {
        backSocket.to(roomName).emit("ice", ice);
    })

    backSocket.on("new_message", (msg, room, done)=>{ // 새로운 메세지 발생 시 해당 방의 모든 사람에게 메세지 emit
        backSocket.to(room).emit("new_message", `${backSocket.Nickname}: ${msg}`);
        done();
    });

    backSocket.on("disconnecting", ()=>{ // 소켓 연결이 끊기면 모든 사람에게 emit, 소켓연결이 끊기기 바로 직전에 발생, 브라우저는 이미 닫았지만 아직 연결이 끊어지지 않은 그 찰나에 발생(room정보고 살아있음)
        backSocket.rooms.forEach((room) => {
            backSocket.to(room).emit("bye", backSocket.Nickname); // 소켓 연결이 끊기기 바로 직전에 발생하여 자신도 포함되기 때문에 -1 해줌
        });
    });

})


httpServer.listen(3000, handleListen);