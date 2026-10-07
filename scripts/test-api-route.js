const http = require('http');

async function testRoute() {
  const data = JSON.stringify({ imageName: 'p1.jpeg' });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/analyze-image',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (d) => { body += d; });
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', body);
    });
  });

  req.on('error', (e) => {
    console.error('Request error (is dev server running?):', e.message);
  });

  req.write(data);
  req.end();
}

testRoute();

