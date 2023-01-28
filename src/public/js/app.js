// FrontEnd
const frontSocket = io(); // io는 자동적으로 back-end socket과 연결해주는 function.

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form"); // 방 생성 폼
const room = document.getElementById("room");

room.style.display = 'none'; // 방 숨김.

let roomName;
let myNickname;

function addMessage(message) { // 메세지 만들어주는 함수
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = message;
  ul.appendChild(li);
}

function handleMessageSubmit(event) { // 메세지 전송 함수
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

async function showRoom() {
  welcome.style.display = 'none';
  room.style.display = 'flex';

  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName}`;

  document.querySelector("#myNickname").innerText = myNickname;

  const msgForm = room.querySelector("#msg");
  msgForm.addEventListener("submit", handleMessageSubmit);

  const exit = room.querySelector("#exit");
  exit.addEventListener("click", handleExit);

  await getMedia(); // 유저 비디오 실행
  makeConnection();
  muteBtn.addEventListener("click", handleMuteClick);
  cameraBtn.addEventListener("click", handleCameraClick);
  camerasSelect.addEventListener("input", handleCameraChange);
}

async function handleRoomSubmit(event) { // 방 접속 함수
  event.preventDefault();
  const nicknameInput = form.querySelector("#nickname");
  const roomInput = form.querySelector("#roomname");
  myNickname = nicknameInput.value;
  roomName = roomInput.value;
  await showRoom(); // 방 생성
  frontSocket.emit( // emit(event이름의 text, args, callback), 끝날 때  실행되는 함수를 보고 싶으면 마지막에 넣어야함
    "join_room",
    roomInput.value, // 방이름
    nicknameInput.value, // 유저이름
  );
  
  roomInput.value = "";
  nicknameInput.value = "";
}

form.addEventListener("submit", handleRoomSubmit);

frontSocket.on("welcome", async (userNickname) => { // 새로운 유저 입장시 나의 브라우저에서 실행됨
  addMessage(`${userNickname}님이 입장하셨습니다.`);

  const offer = await myPeerConnection.createOffer(); // 상대방이 참가할 수 있도록 초대장을 만드는 역할, 이것으로 연결을 구성해야함, createOffer()
  myPeerConnection.setLocalDescription(offer); // setLocalDescription()
  console.log("send the offer");
  frontSocket.emit("offer", offer, roomName); // 서버에 어떤 방이 이 Offer를 emit할 건지, 누구한테로 이 Offer를 보낼건지 알려주면 서버가 상대방에게 보냄
});

frontSocket.on("offer", async (offer) => { // 상대방이 오퍼를 받음
  console.log("receive the offer");
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer(); // 나에게 답을 보냄
  myPeerConnection.setLocalDescription(answer);
  frontSocket.emit("answer", answer, roomName);
  console.log("send the answer");
});

frontSocket.on("answer", (answer) => {
  console.log("receive the answer");
  myPeerConnection.setRemoteDescription(answer);
});

frontSocket.on("ice", (ice) => {
  console.log("send candidate");
  myPeerConnection.addIceCandidate(ice);
})

frontSocket.on("bye", (userNickname) => { // 유저 퇴장
  addMessage(`${userNickname}님이 퇴장하셨습니다.`);
});

frontSocket.on("new_message", addMessage); //새 메세지 생성

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

let myStream; // 유저로부터 비디오와 오디오가 결합된것
let muted = false;
let cameraOff = false;
let myPeerConnection;

async function getCameras(){
  try {
    const devices = await navigator.mediaDevices.enumerateDevices(); // 모든 장치 정보
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

async function getMedia(deviceId) { // getUserMedia(), deviceId 인자를 받을 수 있음
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

function makeConnection(){ // PeerToPeer
  myPeerConnection = new RTCPeerConnection(); // 양쪽 브라우저에 peer-to-peer 연결 생성
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("addstream", handleAddStream);
  myStream.getTracks().forEach((track)=>myPeerConnection.addTrack(track, myStream)); // 양쪽 브라우저로 부터 카메라와 마이크의 데이터 Stream을 받아 연결에 집어넣음, addStream()
}

function handleIce(data){
  console.log("send candidate");
  frontSocket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data){ // 상대방 미디어 추가
  const peerFace = document.getElementById("peerFace");
  peerFace.srcObject = data.stream;
}