# Zoom

Zoom Clone using NodeJS, WebRTC and Websockets.

## babel
 - Javascript(동적 타입의 인터프린터 언어)로 결과물을 만들어주는 컴파일러.
 - 동적타입이라는 의미는 컴파일 환경이 아닌, 실행하는 런타임 환경에서 결정한다는 의미.
 - 사용이유
   - 1. 크로스 브라우징 : 즉, JavaScript(ES6) -> JavaScript(ES5)로 변환해준다.(브라우저 하위 호환성을 생각하여 es6로 작성하여도 구형 브라우저가 인식할 수 있도록 es5로 변환해줌)
   - 2. 폴리필(polyfill) : 개발자가 특정 기능이 지원되지 않는 브라우저를 위해 사용할 수 있는 코드 조각이나 플러그인을 의미.

## 인터프리터 언어
 - 소스코드를 한줄 한줄 읽어가며 명령을 바로 처리하는 프로그램, 번역과 실행이 동시에 이루어짐.

## 컴파일 언어
 - 소스코드를 한꺼번에 다른 목적 코드로 번역한 후, 한 번에 실행하는 프로그램.
 - 자바 같은 경우에는 자바 컴파일러와, 자바 인터프리터가 있고, 자바 컴파일러는 .java 소스파일을 .class 파일로 변환해줌.

## HTTP
 - 유저가 req를 날리면 서버는 res를 날려준다.
 - 서버는 res를 날린 후 유저가 누구인지 기억하지 못한다(stateless), 기억하게 하려면 쿠키 사용.

## WebSocket(protocol)
 - 서버가 websocket 지원하면 ex) wss://naver.com 이런식, wss(Secure Web Socket).
 - webSocket 연결(connection)이 일어날 땐 마치 악수처럼 작동(handshake).
 - 브라우저가 서버로 webSocket req를 보내면 서버가 받거나 거절함, 이런 악수가 한번 성립되면 연결은 성립(establish)됨.
 - 연결돼있기 때문에 서버는 유저가 누구인지 기억할 수 있고, 원한다면 유저가 서버에게 서버가 유저에게 어떤 때나 메세지를 보낼 수 있으며 req, res 과정이 필요하지 않고 그냥 발생함.
 - bi-direction(양방향의)연결.

## WS: a Node.js WebSocket library(implementation)
 - 현재 Express는 Http를 다루고 있고 ws(webSocket)를 지원하지 않기 때문에 ws를 사용하기위해 같은 서버에 ws기능을 설치하려면 function을 추가.

## Socket IO
 - 프론트와 백 간의 실시간, 양방향, event 기반의 통신을 가능하게 해주는 프레임워크 또는 라이브러리.
 - WebSocket의 부가기능이 아님.
 - WebSocket 보다 높은 신뢰성, 빠른 속도, 탄력성이 뛰어나며 WebSocket은 SocketIO가 기능을 제공하는 방법중 하나이다.
 - WebSocket을 사용하지만 브라우저가 websocket을 지원하지 않으면 다른 것(Ex, HTTP long Polling)을 사용한다.
 - 원하는 모든 것을 emit할 수 있고 원하는 만큼 백에 보낼 수 있지만, 프론트와 백을 통신할 때 socket.emit과 socket.on에는 같은 이름을 사용해야 한다.

## Adapter
 - 서버들 사이에 실시간 어플리케이션을 동기화 하는 역할.
 - 누가 연결되었는지, 현재 방이 얼마나 생성되었는지 알려줌.

## WebRTC(Web Real-Time Communication)
 - Peer-to-Peer: 내 브라우저가 직접 상대방 브라우저에 연결되어 영상, 오디오, 텍스트와 같은 데이터가 서버를 거치지 않고 전달됨.
 - 하지만 상대방과 연결을 하기 위해서는 상대방의 IP주소와같은 정보가 필요하고 얻기위해 서버를 사용해야한다.
  ![그림1](/src/public/img/webRTC.png)