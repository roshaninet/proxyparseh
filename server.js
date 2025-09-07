const express = require("express");
const {createProxyMiddleware} = require("http-proxy-middleware");
const axios = require("axios");

const app = express();
app.use(async (req, res, next) => {
    if (req.path.match(/\.(ico|mp4|webm|css|xml|json|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|map)$/)) {
        return next();
    }

    if (!req.path.includes("/playback/presentation/")) {
        return next();
    }

    const token = req.query.token;
    const roomId = req.query.room_id;
    const apiUrl = "api.myparseh.com"
    if (!token || !roomId) {
        return res.status(400).json({message: "برای مشاهده ویدیو در سایت پارسه وارد حساب کاربری شوید. "});
    }

    try {
        // Call Laravel validate endpoint
        const https = require("https");
        const agent = new https.Agent({rejectUnauthorized: false});

        const response = await axios.post(
            `https://${apiUrl}/api/validate`,
            {room_id: roomId}, // بدنه POST
            {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                httpsAgent: agent
            }
        );
        if (response.data.success) {
            // Token and access are valid → continue to proxy
            return next();
        } else {
            return res.status(403).json({message: response.data.message || "Access denied"});
        }
    } catch (err) {
        console.error("Validation failed:", err.response?.data || err.message);
        return res.status(401).json({message: "Invalid or expired token"});
    }
});

// Proxy to target
app.use(
    "/",
    createProxyMiddleware({
        target: `https://mb1.myparseh.com`,
        changeOrigin: true,
        auth: "parseh:Hcy%cb@c7sh!26dh2!c8dja!23",
        secure: false
    })
);

app.listen(3710, () => {
    console.log("Proxy running at http://localhost:3710");
});
