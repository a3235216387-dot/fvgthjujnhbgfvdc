const os = require('os');
const http = require('http');
const fs = require('fs');
const path = require('path');
const net = require('net');
const { exec, execSync } = require('child_process');

function ensureModule(name) {
    try {
        require.resolve(name);
    } catch (e) {
        console.log(`Module '${name}' not found. Installing...`);
        execSync(`npm install ${name}`, { stdio: 'inherit' });
    }
}

ensureModule('ws');
const { WebSocket, createWebSocketStream } = require('ws');

// 直接从环境变量读取，不等待输入
const NAME = process.env.NAME || os.hostname();
const UUID = process.env.UUID;
const PORT = process.env.PORT || 3000;
const DOMAIN = process.env.DOMAIN;

console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
console.log("甬哥Github项目  ：github.com/yonggekkk");
console.log("甬哥Blogger博客 ：ygkkk.blogspot.com");
console.log("甬哥YouTube频道 ：www.youtube.com/@ygkkk");
console.log("Nodejs真一键无交互Vless代理脚本");
console.log("当前版本：25.6.9");
console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");

// 验证必要环境变量
if (!UUID) {
    console.error("❌ 错误: 必须设置 UUID 环境变量");
    console.error("请在 GalaxyCloud 平台的环境变量设置中添加 UUID");
    process.exit(1);
}

if (!DOMAIN) {
    console.error("❌ 错误: 必须设置 DOMAIN 环境变量");
    console.error("请在 GalaxyCloud 平台的环境变量设置中添加 DOMAIN");
    process.exit(1);
}

console.log('✅ 你的UUID:', UUID);
console.log('✅ 你的端口:', PORT);
console.log('✅ 你的域名:', DOMAIN);

const httpServer = http.createServer((req, res) => {
    if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Hello, World-YGkkk\n');
    } else if (req.url === `/${UUID}`) {
        let vlessURL;
        if (NAME.includes('server') || NAME.includes('hostypanel')) {
            vlessURL = `vless://${UUID}@${DOMAIN}:443?encryption=none&security=tls&sni=${DOMAIN}&fp=chrome&type=ws&host=${DOMAIN}&path=%2F#Vl-ws-tls-${NAME}
// ... 其他配置保持不变
`;
        } else {
            vlessURL = `vless://${UUID}@${DOMAIN}:443?encryption=none&security=tls&sni=${DOMAIN}&fp=chrome&type=ws&host=${DOMAIN}&path=%2F#Vl-ws-tls-${NAME}`;
        }
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(vlessURL + '\n');
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found\n');
    }
});

httpServer.listen(PORT, () => {
    console.log(`✅ HTTP Server is running on port ${PORT}`);
});

const wss = new WebSocket.Server({ server: httpServer });
const uuid = UUID.replace(/-/g, "");
wss.on('connection', ws => {
    ws.once('message', msg => {
        const [VERSION] = msg;
        const id = msg.slice(1, 17);
        if (!id.every((v, i) => v == parseInt(uuid.substr(i * 2, 2), 16))) return;
        let i = msg.slice(17, 18).readUInt8() + 19;
        const port = msg.slice(i, i += 2).readUInt16BE(0);
        const ATYP = msg.slice(i, i += 1).readUInt8();
        const host = ATYP == 1 ? msg.slice(i, i += 4).join('.') :
            (ATYP == 2 ? new TextDecoder().decode(msg.slice(i + 1, i += 1 + msg.slice(i, i + 1).readUInt8())) :
                (ATYP == 3 ? msg.slice(i, i += 16).reduce((s, b, i, a) => (i % 2 ? s.concat(a.slice(i - 1, i + 1)) : s), []).map(b => b.readUInt16BE(0).toString(16)).join(':') : ''));
        ws.send(new Uint8Array([VERSION, 0]));
        const duplex = createWebSocketStream(ws);
        net.connect({ host, port }, function () {
            this.write(msg.slice(i));
            duplex.on('error', () => { }).pipe(this).on('error', () => { }).pipe(duplex);
        }).on('error', () => { });
    }).on('error', () => { });
});

console.log(`✅ vless-ws-tls节点已启动`);
console.log(`✅ 节点链接: vless://${UUID}@${DOMAIN}:443?encryption=none&security=tls&sni=${DOMAIN}&fp=chrome&type=ws&host=${DOMAIN}&path=%2F#Vl-ws-tls-${NAME}`);
