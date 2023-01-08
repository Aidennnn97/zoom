// FrontEnd
const fSocket = new WebSocket(`ws://${window.location.host}`); // 서버에 연결

const nicknameForm = document.querySelector("#nickname");
const messageList = document.querySelector("ul");
const messageForm = document.querySelector("#message");

// object타입의 JSON을 string형태로 바꿔서 서버에 전달
function makeMessage(type, payload){
    const msg = {type, payload};
    return JSON.stringify(msg);
}

fSocket.addEventListener("open", ()=>{
    console.log("Connected to Server ✅"); // 연결이 발생하면
});

fSocket.addEventListener("message", (message)=>{ // 서버로 부터 받은 메세지
    const li = document.createElement("li");
    li.innerText = message.data;
    messageList.append(li);
});

fSocket.addEventListener("close", ()=>{
    console.log("Disconnected from the Server ❌"); // 서버가 닫혔을 때
});

function handleMessageSubmit(event){
    event.preventDefault();
    const input = messageForm.querySelector("input");
    fSocket.send(makeMessage("new_message", input.value));
    input.value = "";
}

messageForm.addEventListener("submit", handleMessageSubmit);

function handleNicknameSubmit(event){
    event.preventDefault();
    const input = nicknameForm.querySelector("input");
    fSocket.send(makeMessage("nickname", input.value));
    input.value = "";
}

nicknameForm.addEventListener("submit", handleNicknameSubmit);