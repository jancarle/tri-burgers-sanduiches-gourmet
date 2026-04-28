const https = require('https');
https.get('https://storage.googleapis.com/mweb-prod-us-central1-c-uploads/6ba2e684-f3da-4a6f-bfe1-f926017b8b40', (res) => {
  console.log('Status Code:', res.statusCode);
  res.on('data', () => {});
}).on('error', (e) => {
  console.error(e);
});
