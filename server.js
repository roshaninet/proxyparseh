const express = require("express");
const {createProxyMiddleware} = require("http-proxy-middleware");
const axios = require("axios");

const app = express();
app.set('trust proxy', true);
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
    //const apiUrl = "api.ostadana.test"
    if (!token || !roomId) {
        return res.status(400).json({message: "برای مشاهده ویدیو در سایت پارسه وارد حساب کاربری شوید. "});
    }

    try {
        // Call Laravel validate endpoint
        const https = require("https");
        const agent = new https.Agent({rejectUnauthorized: false});
        let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        // If IPv6-mapped IPv4, remove the ::ffff: prefix
        if (clientIp.startsWith("::ffff:")) {
            clientIp = clientIp.split(":").pop();
        }
        const linkWithoutQuery = `https://${req.get('host')}${req.path}`;
        // console.log({link: linkWithoutQuery, room_id: roomId, token: token, ip: clientIp})

        const response = await axios.post(
            `https://${apiUrl}/api/validate-token`,
            {link: linkWithoutQuery, room_id: roomId, token: token, ip: clientIp}, // بدنه POST
            {
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
        return res.status(401).json({message: err.response?.data || err.message});
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
