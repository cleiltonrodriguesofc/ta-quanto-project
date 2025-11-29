const os = require('os');

const interfaces = os.networkInterfaces();
const addresses = [];

for (const k in interfaces) {
    for (const k2 in interfaces[k]) {
        const address = interfaces[k][k2];
        if (address.family === 'IPv4' && !address.internal) {
            addresses.push(address.address);
        }
    }
}

console.log('Your Local IP Addresses:');
addresses.forEach(ip => console.log(`- ${ip}`));
