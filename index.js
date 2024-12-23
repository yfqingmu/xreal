const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { promisify } = require('util');
const execAsync = promisify(exec);

const PORT = process.env.PORT || 8080;

async function downloadXray() {
    try {
        console.log('Starting Xray download and setup...');
        
        // 创建必要的目录
        if (!fs.existsSync('xray')) {
            fs.mkdirSync('xray');
            console.log('Created xray directory');
        }
        if (!fs.existsSync('etc/xray')) {
            fs.mkdirSync('etc/xray', { recursive: true });
            console.log('Created etc/xray directory');
        }

        // 下载 Xray
        console.log('Downloading Xray...');
        const response = await axios({
            method: 'get',
            url: 'https://github.com/XTLS/Xray-core/releases/latest/download/Xray-linux-64.zip',
            responseType: 'arraybuffer'
        });

        // 保存zip文件
        fs.writeFileSync('xray.zip', response.data);
        console.log('Downloaded Xray successfully');

        // 解压并设置权限
        console.log('Extracting Xray...');
        await execAsync('unzip -o xray.zip -d xray');
        await execAsync('chmod +x xray/xray');
        console.log('Xray extracted and permissions set');
        
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
                            "shortIds": [""]
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
        console.log('Configuration file created');

        // 启动 Xray
        console.log('Starting Xray...');
        const xrayProcess = exec('./xray/xray -config etc/xray/config.json');
        xrayProcess.stdout.pipe(process.stdout);
        xrayProcess.stderr.pipe(process.stderr);

        // 添加进程错误处理
        xrayProcess.on('error', (error) => {
            console.error('Failed to start Xray:', error);
            process.exit(1);
        });

        xrayProcess.on('exit', (code) => {
            if (code !== 0) {
                console.error(`Xray exited with code ${code}`);
                process.exit(1);
            }
        });

        console.log('Xray started successfully');

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// 添加进程异常处理
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
    process.exit(1);
});

downloadXray(); 