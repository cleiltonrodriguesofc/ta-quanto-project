const https = require('https');

const url = 'https://heavy-poets-glow.loca.lt/health';

const options = {
    headers: {
        'Bypass-Tunnel-Reminder': 'true',
        'User-Agent': 'TaQuantoApp/1.0'
    }
};

https.get(url, options, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Body:', data);
    });
}).on('error', (err) => {
    console.error('Error:', err);
});
