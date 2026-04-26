const http = require('http');
const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'assets', 'images');

const server = http.createServer((req, res) => {
  // API: 返回实际存在的图片列表
  if (req.url === '/api/images') {
    fs.readdir(imagesDir, (err, files) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Cannot read images directory' }));
        return;
      }
      var images = files.filter(function(f) {
        return f.endsWith('.webp') || f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.gif');
      }).sort();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ images: images }));
    });
    return;
  }

  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, filePath);

  const ext = path.extname(filePath);
  const contentType = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.webp': 'image/webp',
    '.mp3': 'audio/mpeg',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif'
  }[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

server.listen(8888, () => {
  console.log('Server running at http://localhost:8888');
});
