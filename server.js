// Express: web server用ライブラリを読み込む
const express = require("express");
// Node.js標準のHTTPモジュールを読みこむ
const http = require("http");
// Socket.IOのサーバークラスを読み込む
const {Server} = require("socket.io");
// BASIC認証用のライブラリを読み込む
const basicAuth = require("express-basic-auth");

// Expressアプリを作成する
const app = express();
// Expressを使うHTTPサーバーを作成
const server = http.createServer(app);
// HTTPサーバー上にSocket.IOを追加
const io = new Server(server);
const ROOM = "test-room";

// // BASIC認証を設定
// app.use(
//     basicAuth({
//         users: {
//             admin: "password"
//         },
//         challenge: true
//     })
// )

// public以下のファイルをブラウザへ公開
app.use(express.static("public"));

// ブラウザがSocket.IOへ接続したときに実行される
io.on("connection", (socket) => {
    console.log(`Connected: ${socket.id}`);

    socket.on("join-room", () => {
        if (socket.rooms.has(ROOM)) return;
        if ((io.sockets.adapter.rooms.get(ROOM)?.size ?? 0) >= 2) {
            socket.emit("room-full");
            return;
        }

        socket.join(ROOM);
        socket.to(ROOM).emit("user-connected");
    });

    //Offerを相手へ通知
    socket.on("offer", (offer) => {
        if (socket.rooms.has(ROOM)) socket.to(ROOM).emit("offer", offer);
    });

    // Answerを相手へ転送
    socket.on("answer", (answer) => {
        if (socket.rooms.has(ROOM)) socket.to(ROOM).emit("answer", answer);
    });

    // ICE Candidateを相手へ転送
    socket.on("ice-candidate", (candidate) => {
        if (socket.rooms.has(ROOM)) socket.to(ROOM).emit("ice-candidate", candidate);
    });

    socket.on("disconnecting", () => {
        if (socket.rooms.has(ROOM)) socket.to(ROOM).emit("user-disconnected");
    });

    // ブラウザが切断された時に実行
    socket.on("disconnect", () => {
        console.log(`Disconnected: ${socket.id}`);
    });
})

// Webサーバーのポート番号
const PORT = 3000;

// アクセス受付
server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
