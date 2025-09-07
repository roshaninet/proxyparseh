module.exports = {
    apps: [{
        name: "proxyparseh",
        script: "./server.js", // <-- point directly to your JS file
        instances: '2',
        exec_mode: 'cluster',
        wait_ready: true,
        autorestart: true,
        max_memory_restart: '1G',
        listen_timeout: 10000,
        kill_timeout: 5000,
        out_file: "./pm2log/out.log",
        log_file: "./pm2log/log.log",
        error_file: "./pm2log/error.log"
    }],
};