const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const axios = require("axios");
const https = require("https");

const app = express();
app.set("trust proxy", true);

const serverAdd = "bbb1";
const apiUrl = "https://api.myparseh.com";

// ✅ Reuse one agent across all requests
const agent = new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true,
    maxSockets: 100, // prevent too many open sockets
});

// ✅ Axios instance with timeout & agent
const apiClient = axios.create({
    httpsAgent: agent,
    timeout: 5000, // 5 seconds timeout
});

app.use(async (req, res, next) => {
    // Skip static assets
    if (req.path.match(/\.(json|ico|mp4|webm|css|xml|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|map)$/)) {
        return next();
    }

    // Only handle playback validation
    if (!req.path.includes("/playback/presentation/")) {
        return next();
    }

    const { token, room_id: roomId } = req.query;
    if (!token || !roomId) {
        return res.status(400).send("Invalid request.");
    }

    try {
        let clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
        if (clientIp.startsWith("::ffff:")) clientIp = clientIp.split(":").pop();

        const host = req.get("host").split(":")[0];
        const linkWithoutQuery = `https://${host}:8443${req.path}`;

        const response = await apiClient.post(`${apiUrl}/api/validate-token`, {
            link: linkWithoutQuery,
            room_id: roomId,
            token,
            ip: clientIp,
        });

        if (response.data.success) return next();

        return res.status(403).send("Access denied.");
    } catch (err) {
        console.error("Validation error:", err.message);
        return res.status(401).send("Invalid or expired token.");
    }
});

// ✅ Proxy (with limited connections)
app.use(
    "/",
    createProxyMiddleware({
        target: `https://${serverAdd}.myparseh.com`,
        changeOrigin: true,
        auth: "myparseh:My@54321",
        secure: false,
    })
);

app.listen(3710, () => console.log("Proxy running at http://localhost:3710"));
