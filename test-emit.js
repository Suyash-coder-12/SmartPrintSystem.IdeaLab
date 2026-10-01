const { io } = require("socket.io-client");
const socket = io("https://qr-print-api.onrender.com");

socket.on("connect", () => {
    console.log("Connected to Render server. Emitting print job...");
    socket.emit('trigger-print', {
        shopId: 'SHOP_1234',
        url: 'https://example.com/test.pdf',
        filename: 'test.pdf',
        printSettings: {}
    });
    console.log("Emitted.");
    setTimeout(() => process.exit(0), 2000);
});
