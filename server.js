// Express: web server用ライブラリを読み込む
const express = require("express");
// Node.js標準のHTTPモジュールを読みこむ
const http = require("http");
const path = require("path");
// Socket.IOのサーバークラスを読み込む
const {Server} = require("socket.io");

// Expressアプリを作成する
const app = express();
// Expressを使うHTTPサーバーを作成
const server = http.createServer(app);
// HTTPサーバー上にSocket.IOを追加
const io = new Server(server);
const ROOM = "test-room";
const MAX_CHAT_LENGTH = 2000;
const MAX_PARTICIPANTS = 6;

// Markdown・TeX の表示用ファイルをローカルから配信する
app.use("/vendor/markdown-it", express.static(path.join(__dirname, "node_modules/markdown-it/dist/browser")));
app.use("/vendor/katex", express.static(path.join(__dirname, "node_modules/katex/dist")));
app.use("/vendor/texmath", express.static(path.join(__dirname, "node_modules/markdown-it-texmath")));
app.use("/vendor/dompurify", express.static(path.join(__dirname, "node_modules/dompurify/dist")));

// public以下のファイルをブラウザへ公開
app.use(express.static("public"));

// ブラウザがSocket.IOへ接続したときに実行される
io.on("connection", (socket) => {
    console.log(`Connected: ${socket.id}`);

    socket.on("join-room", () => {
        if (socket.rooms.has(ROOM)) return;
        const members = io.sockets.adapter.rooms.get(ROOM) ?? new Set();
        if (members.size >= MAX_PARTICIPANTS) {
            socket.emit("room-full");
            return;
        }

        // 入室前に、すでにいる人とカメラ・マイクの状態を控える
        const peers = [...members].map((id) => ({
            id,
            state: io.sockets.sockets.get(id).data.mediaState
        }));
        socket.join(ROOM);
        socket.data.name = `参加者 ${socket.id.slice(0, 4)}`;
        socket.data.mediaState = { camera: false, mic: false, screen: false };
        socket.emit("room-joined", { peers });
        // すでにいる人が新しい参加者へ Offer を送る
        socket.to(ROOM).emit("user-connected", { id: socket.id, state: socket.data.mediaState });
    });

    socket.on("media-state", (state) => {
        if (!socket.rooms.has(ROOM) || !state || typeof state !== "object") return;
        socket.data.mediaState = {
            camera: state.camera === true,
            mic: state.mic === true,
            screen: state.screen === true
        };
        socket.to(ROOM).emit("media-state", {
            from: socket.id,
            state: socket.data.mediaState
        });
    });

    // ルーム参加者だけのメッセージを、送信者と相手に転送する
    socket.on("chat-message", (message) => {
        if (!socket.rooms.has(ROOM) || typeof message !== "string") return;
        const text = message.trim();
        if (!text || text.length > MAX_CHAT_LENGTH) return;

        socket.emit("chat-message", { text, own: true });
        socket.to(ROOM).emit("chat-message", {
            text,
            own: false,
            senderName: socket.data.name
        });
    });

    // 映像の接続情報を、指定された相手だけへ転送する
    function relayToPeer(eventName, message) {
        const { to, data } = message ?? {};
        const target = io.sockets.sockets.get(to);
        if (!socket.rooms.has(ROOM) || !target?.rooms.has(ROOM) || to === socket.id) return;
        io.to(to).emit(eventName, { from: socket.id, data });
    }

    socket.on("offer", (message) => relayToPeer("offer", message));
    socket.on("answer", (message) => relayToPeer("answer", message));
    socket.on("ice-candidate", (message) => relayToPeer("ice-candidate", message));

    socket.on("disconnecting", () => {
        if (socket.rooms.has(ROOM)) socket.to(ROOM).emit("user-disconnected", socket.id);
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
