// FrontEnd
const frontSocket = io(); // io는 자동적으로 back-end socket과 연결해주는 function.

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form"); // 방 생성 폼
const room = document.getElementById("room");

room.hidden = true;

let roomName;

function addMessage(message){ // 메세지 만들어주는 함수
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

function handleMessageSubmit(event){ // 메세지 전송 함수
    event.preventDefault();
    const input = room.querySelector("#msg input"); // msg 폼의 Input
    const value = input.value;
    frontSocket.emit("new_message", input.value, roomName, ()=>{
        addMessage(`You: ${value}`);
    });
    input.value = "";
}

function showRoom(){
    welcome.hidden = true;
    room.hidden = false;
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName}`;
    const msgForm = room.querySelector("#msg");
    msgForm.addEventListener("submit", handleMessageSubmit);
}

function handleRoomSubmit(event){ // 방 접속 함수
    event.preventDefault();
    const nameInput = form.querySelector("#name");
    const roomInput = form.querySelector("#roomname");
    frontSocket.emit( // emit(event이름의 text, args, callback), 끝날 때  실행되는 함수를 보고 싶으면 마지막에 넣어야함
        "enter_room", 
        roomInput.value, // 방이름
        nameInput.value, // 유저이름
        showRoom // 방 생성 함수
    ); 
    roomName = roomInput.value;
    roomInput.value="";
    nameInput.value="";
}

form.addEventListener("submit", handleRoomSubmit);

frontSocket.on("welcome", (user)=>{ // 새로운 유저 입장 
    addMessage(`${user}님이 입장하셨습니다.`);
});

frontSocket.on("bye", (user) => { // 유저 퇴장
    addMessage(`${user}님이 퇴장하셨습니다.`)
})

frontSocket.on("new_message", addMessage); //새 메세지 생성