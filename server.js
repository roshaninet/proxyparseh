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
    const apiUrl = "api.myparseh.com";
    if (!token || !roomId) {
        return res.status(400).send(`
            <html>
                <head>
                    <title>خطا</title>
                    <style>
                        body { font-family: sans-serif; text-align: center; padding: 50px; }
                        h1 { color: #c00; }
                        p { font-size: 18px; }
                    </style>
                </head>
                <body>
                    <h1>دسترسی غیرمجاز</h1>
                    <p>برای مشاهده ویدیو در سایت پارسه وارد حساب کاربری شوید.</p>
                </body>
            </html>
        `);
    }

    try {
        const https = require("https");
        const agent = new https.Agent({rejectUnauthorized: false});
        let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        if (clientIp.startsWith("::ffff:")) {
            clientIp = clientIp.split(":").pop();
        }
        const linkWithoutQuery = `https://${req.get('host')}${req.path}`;

        const response = await axios.post(
            `https://${apiUrl}/api/validate-token`,
            { link: linkWithoutQuery, room_id: roomId, token: token, ip: clientIp },
            { httpsAgent: agent }
        );

        if (response.data.success) {
            return next();
        } else {
            return res.status(403).send(`
                <html>
                    <head>
                        <title>دسترسی محدود</title>
                        <style>
                            body { font-family: sans-serif; text-align: center; padding: 50px; }
                            h1 { color: #c00; }
                            p { font-size: 18px; }
                        </style>
                    </head>
                    <body>
                        <h1>دسترسی محدود</h1>
                        <p>${response.data.message || "Access denied"}</p>
                    </body>
                </html>
            `);
        }
    } catch (err) {
        console.error("Validation failed:", err.response?.data || err.message);
        return res.status(401).send(`
            <html>
                <head>
                    <title>توکن نامعتبر</title>
                    <style>
                        body { font-family: sans-serif; text-align: center; padding: 50px; }
                        h1 { color: #c00; }
                        p { font-size: 18px; }
                    </style>
                </head>
                <body>
                    <h1>توکن نامعتبر یا منقضی شده است</h1>
                    <p>${err.response?.object || err.message}</p>
                </body>
            </html>
        `);
    }
});


// Proxy to target
app.use(
    "/",
    createProxyMiddleware({
        target: `https://bbb1.myparseh.com`,
        changeOrigin: true,
        auth: "myparseh:My@54321",
        secure: false
    })
);

app.listen(3710, () => {
    console.log("Proxy running at http://localhost:3710");
});
