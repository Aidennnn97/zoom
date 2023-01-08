// FrontEnd
const fSocket = new WebSocket(`ws://${window.location.host}`); // 서버에 연결

const messageList = document.querySelector("ul");
const messageForm = document.querySelector("form");

fSocket.addEventListener("open", ()=>{
    console.log("Connected to Server ✅"); // 연결이 발생하면
});

fSocket.addEventListener("message", (message)=>{
    console.log("New message: ", message.data, "from the Server"); // 서버로 부터 받은 메세지
});

fSocket.addEventListener("close", ()=>{
    console.log("Disconnected from the Server ❌"); // 서버가 닫혔을 때
});

function handleSubmit(event){
    event.preventDefault();
    const input = messageForm.querySelector("input");
    fSocket.send(input.value);
    input.value = "";
}

messageForm.addEventListener("submit", handleSubmit);