// FrontEnd
const frontSocket = io(); // io는 자동적으로 back-end socket과 연결해주는 function.

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");

function handleRoomSubmit(event){
    event.preventDefault();
    const input = form.querySelector("input");
    frontSocket.emit("enter_room", {payload: input.value}, ()=>{console.log("server is done!")}); // emit(event이름의 text, args, callback)
    input.value="";
}

form.addEventListener("submit", handleRoomSubmit);