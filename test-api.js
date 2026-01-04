const https = require('https');

const agent = new https.Agent({ rejectUnauthorized: false });

https.get('https://localhost:3000/api/public/posts', { agent }, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const foliePosts = json.data.filter(p => p.title && p.title.includes('Folie'));
    foliePosts.forEach(post => {
      console.log('---');
      console.log('ID:', post.id);
      console.log('Title:', post.title);
      console.log('ContentType:', post.contentType);
      console.log('MediaId:', post.mediaId);
      console.log('Media Object:', JSON.stringify(post.media, null, 2));
      console.log('Media URL:', post.media?.url);
    });
  });
}).on('error', (e) => console.error(e));
