// BackEnd
import http from "http";
import express from "express";
import {Server} from "socket.io";
import { instrument } from "@socket.io/admin-ui";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));

// 홈 외의 다른 페이지 이동시 홈으로 이동
app.get("/*", (_, res) => res.redirect("/"));

// Create http Server
const httpServer = http.createServer(app);

// Create SocketIO Server
const socketIOServer = new Server(httpServer, {
    cors: {
        origin: ["https://admin.socket.io"], // socketIO Server admin URL
        credentials: true
    }
});

// Test SocketIO admin page
instrument(socketIOServer, {
    auth: false,
});

// back-end에서 connection 받을 준비.
socketIOServer.on("connection", (backSocket) => {
    backSocket.onAny((event) => {
        //console.log(socketIOServer.sockets.adapter);
        console.log(`Socket Event: ${event}`);
    });
    // 유저가 방을 생성하거나 입장할 때
    backSocket.on("join_room", (roomName, nickname, done)=>{
        // 방 사람 수 체크(최대 2명)
        const userCount = socketIOServer.sockets.adapter.rooms.get(roomName)?.size;

        if(userCount === undefined || userCount === 0){ // 방이 존재하지 않으면
            backSocket.join(roomName); //방에 접속
            backSocket["Nickname"] = nickname; // 닉네임을 소켓에 저장
            backSocket.to(roomName).emit("welcome", nickname); 
            done('create_room');
        } else if (userCount === 1){ // 방에 사람이 한명 있으면
            // 오너에게 승인 요청
            socketIOServer.in(roomName).emit('join_room', nickname, backSocket.id);
            done('wait_approval'); // 오너로부터 승인 대기
        } else{
            done('exceed_max_capacity'); // 방에 이미 2명이 있으면
        }
    });

    // 승인 받으면
    backSocket.on("approve", (roomName, ownerNickname, socketId) => {
        // 게스트 입장
        socketIOServer.in(socketId).socketsJoin(roomName);
        // 승인됨을 알림
        socketIOServer.in(socketId).emit("approved", ownerNickname);
    });

    // 거절 받으면
    backSocket.on("decline", (socketId) => {
        // 거절됨을 알림
        socketIOServer.in(socketId).emit("declined");
    });

    backSocket.on("hello", (roomName) => { // 게스트가 방에 입장하면
        backSocket.to(roomName).emit("welcome");
    })

    backSocket.on("offer", (offer, roomName) => { // 게스트로부터 offer를 받으면
        backSocket.to(roomName).emit("offer", offer);
    });

    backSocket.on("answer", (answer, roomName) => { // 게스트로부터 answer를 받으면
        backSocket.to(roomName).emit("answer", answer);
    });

    backSocket.on("ice", (ice, roomName) => { // 오너와 게스트 IceCandidate 서로 공유
        backSocket.to(roomName).emit("ice", ice);
    });

    backSocket.on("leaveRoom", (roomName, done) => { // 둘중 한 사람이 방을 나가면
        backSocket.to(roomName).emit("peer-leaving");
        backSocket.leave(roomName);
        done();
    });

    backSocket.on("disconnecting", ()=>{ // 소켓 연결이 끊기면 모든 사람에게 emit, 소켓연결이 끊기기 바로 직전에 발생, 브라우저는 이미 닫았지만 아직 연결이 끊어지지 않은 그 찰나에 발생(room정보고 살아있음)
        backSocket.rooms.forEach((room) => {
            backSocket.to(room).emit("peer-leaving");
            backSocket.leave(room);
        });
    });

})

httpServer.listen(3000, () => {
    console.log(`Listening on http://localhost:3000`);
});