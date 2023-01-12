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

function publicRooms(){ // 공개 방
    // const sids = wsServer.sockets.adapter.sids;
    // const rooms = wsServer.sockets.adapter.rooms;
    const { // wsServer.sockets.adapter로 부터 sids와 rooms를 가져옴
        sockets:{
            adapter:{sids, rooms}, // rooms는 개인방, 공개방 다있고 sids는 개인방만 있음.
        },
    } = wsServer; // 위의 두줄과 같음

    const publicRooms = [];

    rooms.forEach((_, key) => { // rooms 키값 중에
        if(sids.get(key) === undefined){ // sids에 없는 키값이
            publicRooms.push(key); // 공개방 키값이다.
        }
    });

    return publicRooms;   
}

function countRoomUser(roomName){ // 현재 방 사용자 수 
    // if(wsServer.sockets.adapter.rooms.get(roomName)){
    //     return wsServer.sockets.adapter.rooms.get(roomName).size
    // } else {
    //     return undefined;
    // }
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (backSocket) => {
    backSocket["name"] = "Anonymous"; // 최초 연결 시 이름 초기화

    backSocket.onAny((event) => {
        //console.log(wsServer.sockets.adapter);
        console.log(`Socket Event: ${event}`);
    });

    backSocket.on("enter_room", (roomName, userName, done)=>{ // 방 생성 또는 입장하면
        backSocket.join(roomName); //방에 접속
        backSocket["name"] = userName; // 이름을 소켓에 저장
        backSocket.to(roomName).emit("welcome", backSocket.name, countRoomUser(roomName)); // 나를 제외한 참가한 방 안의 모든 사람에게 emit, name데이터를 프론트 쪽으로 넘겨줌
        wsServer.sockets.emit("public_rooms", publicRooms()); // 현재 서버에 생성된 공개방 리스트
        const roomUserCnt = wsServer.sockets.adapter.rooms.get(roomName)?.size;
        done(roomUserCnt); // 프론트에서 실행됨(showRoom)
    });

    backSocket.on("new_message", (msg, room, done)=>{ // 새로운 메세지 발생 시 해당 방의 모든 사람에게 메세지 emit
        backSocket.to(room).emit("new_message", `${backSocket.name}: ${msg}`);
        done();
    });

    backSocket.on("disconnecting", ()=>{ // 소켓 연결이 끊기면 모든 사람에게 emit, 소켓연결이 끊기기 바로 직전에 발생
        backSocket.rooms.forEach((room) => {
            backSocket.to(room).emit("bye", backSocket.name, countRoomUser(room) - 1); // 소켓 연결이 끊기기 바로 직전에 발생하여 자신도 포함되기 때문에 -1 해줌
        });
    });

    backSocket.on("disconnect", () => { // 소켓 연결 끊기고 나서
        wsServer.sockets.emit("public_rooms", publicRooms());
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