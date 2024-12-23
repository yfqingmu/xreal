const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { promisify } = require('util');
const execAsync = promisify(exec);

const PORT = process.env.PORT || 8080;

async function downloadXray() {
    try {
        // 创建必要的目录
        if (!fs.existsSync('xray')) {
            fs.mkdirSync('xray');
        }
        if (!fs.existsSync('etc/xray')) {
            fs.mkdirSync('etc/xray', { recursive: true });
        }

        // 下载 Xray
        const response = await axios({
            method: 'get',
            url: 'https://github.com/XTLS/Xray-core/releases/latest/download/Xray-linux-64.zip',
            responseType: 'arraybuffer'
        });

        // 保存zip文件
        fs.writeFileSync('xray.zip', response.data);

        // 解压并设置权限
        await execAsync('unzip xray.zip -d xray');
        await execAsync('chmod +x xray/xray');
        
        // 写入配置文件
        const config = {
            "log": {
                "loglevel": "warning"
            },
            "inbounds": [
                {
                    "port": PORT,
                    "protocol": "vless",
                    "settings": {
                        "clients": [
                            {
                                "id": "538d9cb5-3223-43ef-a6c6-cb12d5a36856",
                                "flow": "xtls-rprx-vision"
                            }
                        ],
                        "decryption": "none"
                    },
                    "streamSettings": {
                        "network": "tcp",
                        "security": "reality",
                        "realitySettings": {
                            "show": false,
                            "dest": "www.microsoft.com:443",
                            "serverNames": [
                                "www.microsoft.com"
                            ],
                            "privateKey": "cJqlmECjWWJT8QIIiaVBd2H1MHb8-BlA4nsnAHwH_lQ",
                            "shortIds": [
                                ""
                            ]
                        }
                    }
                }
            ],
            "outbounds": [
                {
                    "protocol": "freedom"
                }
            ]
        };

        fs.writeFileSync('etc/xray/config.json', JSON.stringify(config, null, 2));

        // 启动 Xray
        const xrayProcess = exec('./xray/xray -config etc/xray/config.json');
        xrayProcess.stdout.pipe(process.stdout);
        xrayProcess.stderr.pipe(process.stderr);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

downloadXray(); 