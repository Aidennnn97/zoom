// FrontEnd
const frontSocket = io(); // io는 자동적으로 back-end socket과 연결해주는 function.

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form"); // 방 생성 폼
const room = document.getElementById("room");

room.hidden = true;

let roomName;

function addMessage(message) {
  // 메세지 만들어주는 함수
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = message;
  ul.appendChild(li);
}

function handleMessageSubmit(event) {
  // 메세지 전송 함수
  event.preventDefault();
  const input = room.querySelector("#msg input"); // msg 폼의 Input
  const value = input.value;
  frontSocket.emit("new_message", input.value, roomName, () => {
    addMessage(`Me: ${value}`);
  });
  input.value = "";
}

function handleExit(event) {
  event.preventDefault();
  window.location.reload();
}

function showRoom(roomUserCnt) {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector("h3");
  if (roomUserCnt === 1) {
    h3.innerText = `Room ${roomName}`;
  } else {
    h3.innerText = `Room ${roomName}(${roomUserCnt})`;
  }
  
  const msgForm = room.querySelector("#msg");
  msgForm.addEventListener("submit", handleMessageSubmit);
  const exit = room.querySelector("#exit");
  exit.addEventListener("click", handleExit);

  getMedia(); // 유저 비디오 실행
  muteBtn.addEventListener("click", handleMuteClick);
  cameraBtn.addEventListener("click", handleCameraClick);
  camerasSelect.addEventListener("input", handleCameraChange);

}

function handleRoomSubmit(event) {
  // 방 접속 함수
  event.preventDefault();
  const nameInput = form.querySelector("#name");
  const roomInput = form.querySelector("#roomname");
  frontSocket.emit(
    // emit(event이름의 text, args, callback), 끝날 때  실행되는 함수를 보고 싶으면 마지막에 넣어야함
    "enter_room",
    roomInput.value, // 방이름
    nameInput.value, // 유저이름
    showRoom // 방 생성 함수
  );
  roomName = roomInput.value;
  roomInput.value = "";
  nameInput.value = "";
}

form.addEventListener("submit", handleRoomSubmit);

frontSocket.on("welcome", (user, userCount) => {
  // 새로운 유저 입장
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName}(${userCount})`;
  addMessage(`${user}님이 입장하셨습니다.`);
});

frontSocket.on("bye", (user, userCount) => {
  // 유저 퇴장
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName}(${userCount})`;
  addMessage(`${user}님이 퇴장하셨습니다.`);
});

frontSocket.on("new_message", addMessage); //새 메세지 생성

frontSocket.on("public_rooms", (rooms, userCount) => {
  // console.log === (msg) => console.log(msg);
  console.log(rooms);
  const roomList = welcome.querySelector("ul");
  roomList.innerHTML = "";
  // if(rooms.length === 0){ // 현재 생성된 방이 하나도 없을 때 방 목록을 비워줌
  //     return;
  // }
  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = `${room}(${userCount})`;
    roomList.append(li);
  });
});

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

let myStream; // 유저로부터 비디오와 오디오가 결합된것
let muted = false;
let cameraOff = false;

async function getCameras(){
  try {
    const devices = await navigator.mediaDevices.enumerateDevices(); // 모든 장치 정보
    console.log(devices);
    const cameras = devices.filter((device)=>device.kind === "videoinput"); // 카메라만
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera)=>{
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if(currentCamera.label === camera.label){
        option.selected = true;
      }
      camerasSelect.appendChild(option);
    })
  } catch (error) {
    console.log(error);
  }
}

async function getMedia(deviceId) { // 유저 미디어 가져오는 함수, deviceId 인자를 받을 수 있음
  const initialDeviceId = {
    audio: true,
    video: {facingMode: "user"}, // 모바일일 경우 셀카 모드, facingMode: {exact: "environment"}(후면카메라)
  };
  const cameraDeviceId = {
    audio: true,
    video: {deviceId: {exact: deviceId}},
  }
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraDeviceId : initialDeviceId
    );
    myFace.srcObject = myStream;
    if(!deviceId){
      await getCameras();
    }
  } catch (error) {
    console.log(error);
  }
}

function handleMuteClick() {
  console.log(myStream.getAudioTracks());
  myStream.getAudioTracks().forEach((track) => {
    track.enabled = !track.enabled;
  });
  if (!muted) {
    muteBtn.innerText = "UnMute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
}

function handleCameraClick() {
  console.log(myStream.getVideoTracks());
  myStream.getVideoTracks().forEach((track) => {
    track.enabled = !track.enabled;
  });
  if (cameraOff) {
    cameraBtn.innerText = "Camera Off";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "Camera On";
    cameraOff = true;
  }
}

async function handleCameraChange(){
  await getMedia(camerasSelect.value);
}