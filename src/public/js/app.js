// FrontEnd
const frontSocket = io(); // io는 자동적으로 back-end socket과 연결해주는 function.

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName;

function addMessage(message){
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

function handleMessageSubmit(event){
    event.preventDefault();
    const input = room.querySelector("input");
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
    const form = room.querySelector("form");
    form.addEventListener("submit", handleMessageSubmit);
}

function handleRoomSubmit(event){
    event.preventDefault();
    const input = form.querySelector("input");
    frontSocket.emit( // emit(event이름의 text, args, callback), 끝날 때  실행되는 함수를 보고 싶으면 마지막에 넣어야함
        "enter_room", 
        input.value,
        showRoom
    ); 
    roomName = input.value;
    input.value="";
}

form.addEventListener("submit", handleRoomSubmit);

frontSocket.on("welcome", ()=>{
    addMessage("Someone joined!");
});

frontSocket.on("bye", () => {
    addMessage("Someone left ㅠㅠ")
})

frontSocket.on("new_message", addMessage);