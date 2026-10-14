import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
const files={'/':'raptor.html','/raptor.html':'raptor.html','/raptor-light.html':'raptor-light.html','/index.html':'index.html'};
createServer((req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  if(path==='/favicon.ico'){res.writeHead(204);return res.end();}
  const file=files[path];if(!file){res.writeHead(404);return res.end('Not found');}
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
  res.end(readFileSync(new URL('../'+file,import.meta.url)));
}).listen(4174,'127.0.0.1',()=>console.log('http://127.0.0.1:4174'));
