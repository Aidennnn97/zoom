// FrontEnd
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form"); // 방 생성 폼
const welcomeAlert = welcome.querySelector("#alert");
const welcomeAlertMsg = welcomeAlert.querySelector("span");
const room = document.getElementById("room");
const roomContent = room.querySelector("#room-content");
const myVideo = roomContent.querySelector('#myVideo');
const peerVideo = roomContent.querySelector('#peerVideo');
const chatBox = roomContent.querySelector('#chat-wrapper');
const muteBtn = roomContent.querySelector('#control button#mute');
const cameraSelect = roomContent.querySelector('#camera-selection');
const cameraBtn = roomContent.querySelector('#control button#camera');
const hangUpBtn = roomContent.querySelector('#control button#hang-up');
const chatBtn = roomContent.querySelector('#control button#chat-button');
const chatList = chatBox.querySelector('#chat-content-wrapper ul');
const chatTextArea = chatBox.querySelector('form#chat-input textarea');

// 전역변수
let roomName;
let myNickname;
let peerNickname;
let myStream;
let muted = false;
let cameraOff = false;
let myPeerConnection;
let myDataChannel;
let frontSocket = createNewSocket();

// 방 입장 요청 시간
const waitApprovalObj = {
  interval: null,
  counter: 0,
}

function createNewSocket(){
  const newSocket = io(); // io는 자동적으로 back-end socket과 연결해줌

  // 방입장
  newSocket.on("join_room", (nickname, socketId) => {
    // 게스트 닉네임 저장
    peerNickname = nickname;

    // 승인요청 모달
    const joinModalWrapper = room.querySelector("#confirm-join-overlay");
    const joinModal = joinModalWrapper.querySelector("#confirm-join");
    joinModalWrapper.style.display = 'flex';
    joinModal.style.display = 'flex';
    joinModal.querySelector("#request-nickname").innerHTML = `<strong>${nickname}</strong> &nbsp wants to join the call`;
    waitApprovalObj.counter = 30;
    waitApprovalObj.interval = setInterval(() => {
      // 승인요청 모달 메세지
      const modalMsg = joinModal.querySelector("#confirm-message");
      modalMsg.innerText = `Will you approve the user to join the chat? (${waitApprovalObj.counter})`;
  
      if(waitApprovalObj.counter !== 0){
        --waitApprovalObj.counter;
      } else{
        clearInterval(waitApprovalObj.interval);
        joinModalWrapper.style.display = 'none';
        joinModal.style.display = 'none';
      }
    }, 1000);
  
    // 게스트 요청 승인버튼
    const approveBtn = joinModal.querySelector("#approve");
    approveBtn.addEventListener("click", () => {
      // 게스트 요청 승인
      newSocket.emit("approve", roomName, myNickname, socketId);

      joinModalWrapper.style.display = 'none';
      joinModal.style.display = 'none';
      clearInterval(waitApprovalObj.interval);

      // 상대방 별명
      roomContent.querySelector("#peerNickname").innerText = peerNickname;
    });
  
    // 거부버튼
    const declineBtn = joinModal.querySelector("#decline");
    declineBtn.addEventListener("click", () => {
      // 요청 거절
      newSocket.emit("decline", socketId);

      joinModalWrapper.style.display = 'none';
      joinModal.style.display = 'none';
    });
  });

  // 게스트의 요청이 승인 됐을 때
  newSocket.on("approved", async (ownerNickname) => {
    clearInterval(waitApprovalObj.interval);
    await showRoom();
    peerNickname = ownerNickname;
    roomContent.querySelector("#peerNickname").innerText = ownerNickname;
  });
  
  // 게스트의 요청이 거절 됐을 때
  newSocket.on("declined", () => {
    clearInterval(waitApprovalObj.interval);
    welcomeAlertMsg.innerText = `Declined to join the room! Try Again!`;
    const formElements = welcomeForm.elements;
    for(let i = 0; i < formElements.length; i++){
      formElements[i].disabled = false;
    }
  });

  newSocket.on("welcome", async () => { // 새로운 유저 입장시 나의 브라우저에서 실행됨
    myDataChannel = myPeerConnection.createDataChannel("chat"); // chat 이라는 데이터채널 생성
    myDataChannel.addEventListener("message", (message) => {
      addMessage("peer-chat", message.data);
    });
  
    const offer = await myPeerConnection.createOffer(); // 상대방이 참가할 수 있도록 초대장을 만드는 역할, 이것으로 연결을 구성해야함, createOffer()
    myPeerConnection.setLocalDescription(offer); // setLocalDescription()
    newSocket.emit("offer", offer, roomName); // 서버에 어떤 방이 이 Offer를 emit할 건지, 누구한테로 이 Offer를 보낼건지 알려주면 서버가 상대방에게 보냄
  });

  newSocket.on("offer", async (offer) => { // 상대방이 오퍼를 받음
    myPeerConnection.addEventListener("datachannel", (e) =>{
      myDataChannel = e.channel;
      myDataChannel.addEventListener("message", (message) => {
        addMessage("peer-chat", message.data);
      });
    });

    await myPeerConnection.setRemoteDescription(offer);

    const answer = await myPeerConnection.createAnswer(); // 나에게 답을 보냄
    myPeerConnection.setLocalDescription(answer);
    newSocket.emit("answer", answer, roomName);
  });

  newSocket.on("answer", (answer) => {
    myPeerConnection.setRemoteDescription(answer);
  });
  
  newSocket.on("ice", (ice) => {
    myPeerConnection.addIceCandidate(ice);
  });

  // 오너 혹은 게스트가 종료했을 때
  newSocket.on("peer-leaving", () => {
    peerNickname = '';
    roomContent.querySelector("#peerNickname").innerText = peerNickname;
    peerVideo.srcObject.getTracks().forEach((track) => {
      track.stop();
    });
    peerVideo.srcObject = null;
    chatList.innerHTML = '';
  
    // 종료 모달
    const modalWrapper = room.querySelector("#disconnected-peer-overlay");
    const disconnectedPeer = modalWrapper.querySelector("#disconnected-peer");
    modalWrapper.style.display = 'flex';
    disconnectedPeer.style.display = 'flex';
  
    // 종료 버튼
    const leaveBtn = disconnectedPeer.querySelector("#leave-room");
    leaveBtn.addEventListener("click", () => {
      modalWrapper.style.display = 'none';
      disconnectedPeer.style.display = 'none';
      hangUp();
    });

    // 머무르기 버튼
    const stayBtn = disconnectedPeer.querySelector("#stay-room");
    stayBtn.addEventListener("click", async () => {
      await myPeerConnection.close();
      myPeerConnection = undefined;
      makeConnection();
  
      modalWrapper.style.display = 'none';
      disconnectedPeer.style.display = 'none';
    });
  });

  return newSocket;
}

function reset(){
  clearInterval(waitApprovalObj.interval);

  const formElements = welcomeForm.elements;
  for (let index = 0; index < formElements.length; index++) {
    formElements[index].disabled = false;
  }

  welcomeAlertMsg.innerText = '';
  welcomeAlert.style.display = 'none';

  welcome.style.display = 'flex';
  room.style.display = 'none';
  chatBox.style.display = 'none';
}

function addMessage(chatType, message) { // 메세지 만들어주는 함수
  const listElem = document.createElement('li');
  const divSpacer = document.createElement('div');
  const divSpanWrapper = document.createElement('div');
  const span = document.createElement('span');

  listElem.classList.add(chatType);
  divSpacer.classList.add('chat-spacer');
  divSpanWrapper.classList.add('chat-span-wrapper');

  // 메세지 생성
  span.innerText = message;
  divSpanWrapper.appendChild(span);
  listElem.appendChild(divSpacer);
  listElem.appendChild(divSpanWrapper);
  chatList.appendChild(listElem);

  chatBox.style.display = 'flex';
}

async function showRoom() {
  welcome.style.display = 'none';
  room.style.display = 'flex';
  roomContent.querySelector("#myNickname").innerText = myNickname;

  await getMedia(); // 유저 비디오 실행

  makeConnection(); // webRTC Connection 생성
}

async function handleRoomSubmit(event) { // 방 접속 함수
  event.preventDefault();

  welcomeAlert.style.display = 'none';

  myNickname = welcomeForm.querySelector("#nickname").value;
  roomName = welcomeForm.querySelector("#roomname").value;
  
  frontSocket.emit("join_room", roomName, myNickname, async (status) => {
    switch(status){
      case 'create_room':
        await showRoom();
        roomName = "";
        myNickname = "";
        break;
      case 'wait_approval':
        const formElements = welcomeForm.elements;
        for(let i = 0; i < formElements.length; i++){
          formElements[i].disabled = true;
        }

        welcomeAlert.style.display = 'block';
        waitApprovalObj.counter = 30;
        waitApprovalObj.interval = setInterval(() => {
          welcomeAlertMsg.innerText = `Waiting for Approval (${waitApprovalObj.counter})`;
          
          if(waitApprovalObj.counter !== 0){
            --waitApprovalObj.counter;
          } else{
            clearInterval(waitApprovalObj.interval);
            for (let index = 0; index < formElements.length; index++) {
              formElements[index].disabled = false;
            }
            welcomeAlertMsg.innerText = `Not Approved Yet! Try Again!`;
          }
        }, 1000);
        break;
      case 'exceed_max_capacity':
        welcomeAlert.style.display = 'block';
        welcomeAlertMsg.innerText = 'The room is packed!';
        break;
    }
  });
}

welcomeForm.addEventListener("submit", handleRoomSubmit);
muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraChange);
hangUpBtn.addEventListener("click", hangUp);
chatBtn.addEventListener('click', () => {
  if (chatBox.style.display === 'none') {
    chatBox.style.display = 'flex';
  } else {
    chatBox.style.display = 'none';
  }
});
chatTextArea.addEventListener('keydown', (keyboardEvent) => {
  if (keyboardEvent.key === 'Enter') {
    keyboardEvent.preventDefault();
    const msg = chatTextArea.value;

    myDataChannel?.send(msg);
    addMessage('my-chat', msg);
    chatTextArea.value = '';
  }
});

function hangUp(){
  myPeerConnection.close();
  myPeerConnection = null;
  myDataChannel = null;
  myNickname = '';
  peerNickname = '';
  chatList.innerHTML = '';
  roomContent.querySelector("#myNickname").innerText = myNickname;
  roomContent.querySelector("#peerNickname").innerText = peerNickname;

  myStream.getTracks().forEach((track) => {
    track.stop();
  });

  if(peerVideo?.srcObject){
    peerVideo.srcObject.getTracks().forEach((track) => {
      track.stop();
    });
    peerVideo.srcObject = null;
  }

  frontSocket.emit("leaveRoom", roomName, () => {
    roomName = '';
    frontSocket.disconnect();
    frontSocket = createNewSocket();
    reset();
  });
}


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
      cameraSelect.appendChild(option);
    })
  } catch (error) {
    console.log(error);
  }
}

async function getMedia(deviceId) { // getUserMedia(), deviceId 인자를 받을 수 있음
  // 현재 스트림이 존재할 때
  if(myStream) {
    myStream.getTracks().forEach((track) => {
      track.stop();
    })
  }

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
    myVideo.srcObject = myStream;
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
  await getMedia(cameraSelect.value);
  if(myPeerConnection){
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection.getSenders().find((sender) => sender.track.kind === "video");
    videoSender.replaceTrack(videoTrack);
  }
}

function makeConnection(){ // PeerToPeer, 양쪽 브라우저에 peer-to-peer 연결 생성
  myPeerConnection = new RTCPeerConnection({ 
    iceServers: [
      {
        urls: [ // STUN SERVER
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
          'stun:stun3.l.google.com:19302',
          'stun:stun4.l.google.com:19302',
        ],
      },
    ],
  }); 

  myPeerConnection.addEventListener("icecandidate", (e) => {
    frontSocket.emit("ice", e.candidate, roomName);
  });

  myPeerConnection.addEventListener("track", (e) => { // 상대방 미디어 추가
    peerVideo.srcObject = e.streams[0];
  });

  myStream.getTracks().forEach((track) => {
    myPeerConnection.addTrack(track, myStream);
  }); // 양쪽 브라우저로 부터 카메라와 마이크의 데이터 Stream을 받아 연결에 집어넣음, addStream()
}

reset();