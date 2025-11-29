const http = require('http');

const data = JSON.stringify([
    {
        id: 'test_1',
        productName: 'Test Product',
        price: 10.50,
        supermarket: 'Test Market',
        timestamp: new Date().toISOString()
    }
]);

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/prices/batch',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', (d) => {
        process.stdout.write(d);
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();
