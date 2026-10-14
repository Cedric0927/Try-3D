import {createServer} from 'node:http';import{readFileSync}from'node:fs';
const routes={'/':'sorter.html','/sorter.html':'sorter.html','/index.html':'index.html','/raptor-light.html':'raptor-light.html','/raptor.html':'raptor.html'};
createServer((req,res)=>{const name=routes[new URL(req.url,'http://localhost').pathname];if(!name){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(readFileSync(new URL('../'+name,import.meta.url)));}).listen(4175,'127.0.0.1',()=>console.log('http://127.0.0.1:4175'));
