# Zoom

1:1 Video Chat Room implementation using WebRTC

## Environment
 - NodeJS, Express, Pug, CSS, Vanilla JS, Websockets, SocketIO, WebRTC

## Features
 - Create Private Video Call Rooms
 - Create WebRTC Connection between peers to stream video, audio, text
   - Use SocketIO for signaling server
   - Offer / Answer / IceCandidate / Addstream
 - Change Camera
 - Ask room owners whether to allow joining the new guest or not
 - When one user exit, the other user is asked to leave or stay for other participants
 - P2p Chat


| ![그림1](/src/public/img/owner1.png) |
| :---------------------------------: |
| _Join Room_ |

| ![그림1](/src/public/img/owner2.png) |
| :---------------------------------: |
| _Receive request from guest_ |

| ![그림1](/src/public/img/guest1.png) |
| :---------------------------------: |
| _Waiting for approval_ |

| ![그림1](/src/public/img/room.png) |
| :---------------------------------: |
| _Room_ |

| ![그림1](/src/public/img/leave.png) |
| :---------------------------------: |
| _When one user left_ |