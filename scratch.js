const https = require('https');

const data = JSON.stringify({
  query: `
    query {
      allBadges {
        name
        nameEn
        category {
          name
          nameEn
        }
      }
    }
  `
});

const req = https.request('https://prs.elbooklets.com/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      if (parsed.data && parsed.data.allBadges) {
         console.log(JSON.stringify(parsed.data.allBadges.slice(0, 5), null, 2));
      } else {
         console.log('No badges', body.substring(0, 200));
      }
    } catch(e) {
      console.log('Error parsing', e);
    }
  });
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
