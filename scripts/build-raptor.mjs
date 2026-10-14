import { readFileSync, writeFileSync } from 'node:fs';
const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const partNames={
  'Gimbal and thrust puck':'万向节与推力承载盘',
  'Oxygen turbopump':'液氧涡轮泵',
  'Oxygen-rich preburner':'富氧预燃室',
  'Oxygen duct and main valve':'液氧管路与主阀',
  'Injector and main chamber':'喷注器与主燃烧室',
  'Nozzle':'喷管',
  'Methane turbopump and fuel-rich preburner':'甲烷涡轮泵与富燃预燃室',
  'Hot-gas manifold':'高温燃气歧管',
  'Downcomer and main fuel valve':'下降管与燃料主阀',
  'Plumbing':'辅助管路',
  'Engine controller and harness':'控制器与线束'
};
const css=`
.case-head{margin:20px 0 0;font-family:system-ui,"Microsoft YaHei",sans-serif;color:var(--anatomy-text)}
.case-nav{display:flex;justify-content:space-between;gap:16px;padding:0 0 20px;border-bottom:1px solid var(--anatomy-mid);font-size:11px;color:var(--anatomy-muted)}
.case-nav a{color:inherit;text-decoration:none}.case-nav a:hover{color:var(--anatomy-text)}
.case-eyebrow{font-size:10px;letter-spacing:2px;color:var(--anatomy-muted);margin:30px 0 12px}
.case-head h1{font-size:clamp(25px,4vw,38px);font-weight:500;letter-spacing:-1px;line-height:1.3;margin:0 0 14px}
.case-sub{font-size:13px;line-height:1.9;color:var(--anatomy-muted);margin:0;max-width:720px}
.case-tags{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 25px}.case-tags span{font-size:10px;color:var(--anatomy-muted);border:1px solid var(--anatomy-mid);padding:6px 10px;border-radius:20px}
.case-help{font-size:11px;line-height:1.9;color:var(--anatomy-muted);margin-top:0}.case-help kbd{font:11px monospace;color:var(--anatomy-text);border:1px solid var(--anatomy-mid);border-radius:3px;padding:2px 5px;margin:0 3px}
.case-foot{border-top:1px solid var(--anatomy-mid);margin-top:25px;padding:20px 0;font:11px/1.9 system-ui,"Microsoft YaHei",sans-serif;color:var(--anatomy-muted)}.case-foot a{color:var(--anatomy-text)}
.rp-part{font-family:system-ui,"Microsoft YaHei",sans-serif!important}.iso-caption{font-family:system-ui,"Microsoft YaHei",sans-serif;line-height:1.9!important}
@media(max-width:480px){.case-nav{font-size:10px}.case-sub{font-size:12px}.case-tags span{font-size:9px}.case-help{font-size:10px}.case-head h1{font-size:27px}}
`;
const caption='这是 Anatomy 官方的 Raptor 2 发动机教学插图：富氧和富燃预燃室分别驱动两侧涡轮泵，两路燃气最终进入主燃烧室。拆解时查看泵、阀、喷管、冷却管路与控制线束；点火时观察尾焰、冲击波、喷淋与蒸汽。画面读数沿用原案例的示意模型与参数，不作为工程数据。';
for(const light of [false,true]){
  const source=`reference/anatomy-main/examples/raptor-engine/raptor-engine${light?'-light':''}.html`;
  let html=read(source).replace('lang="en"','lang="zh-CN"').replace('<title>Raptor 2</title>','<title>Anatomy 案例 · 火箭发动机拆解</title>');
  for(const [en,cn]of Object.entries(partNames))html=html.replaceAll(en,cn);
  for(const [en,cn]of [['Hover the engine to take it apart','悬停发动机，展开组件'],['Tap to take apart','轻触发动机，展开组件'],['Shut down','关闭引擎'],['Ignite','点火'],['Raptor 2 · test stand','Raptor 2 · 发动机试验台']])html=html.replaceAll(en,cn);
  html=html.replace(/<span class="iso-caption">[\s\S]*?<\/span>/,`<span class="iso-caption">${caption}</span>`);
  const header=`<header class="case-head"><nav class="case-nav"><span>ANATOMY / 官方标杆案例</span><span><a href="index.html">← 传送带</a>　 /　 <a href="raptor${light?'':'-light'}.html">${light?'深色':'浅色'}模式 ↗</a></span></nav><p class="case-eyebrow">CASE 02 / SVG + WEBGL</p><h1>拆开一台火箭发动机。</h1><p class="case-sub">一台发动机，11 个组件。圆曲面、密集管路、错开的拆解运动，以及嵌在立体结构里的尾焰与蒸汽——这是 Anatomy 能力的集中展示。</p><div class="case-tags"><span>精细实体绘图</span><span>弹簧拆解动画</span><span>逐帧遮挡排序</span><span>WebGL 尾焰</span><span>几何审计</span></div><p class="case-help">悬停查看拆解，点击下方组件查看局部。<kbd>空格</kbd> 拆解 / 组装 · <kbd>← →</kbd> 选择组件 · <kbd>I</kbd> 点火 / 关闭 · <kbd>Esc</kbd> 收起</p></header>`;
  html=html.replace('</head>',`<style>${css}</style></head>`).replace('<main class="iso-page">',`<main class="iso-page">${header}`).replace('</main>',`<footer class="case-foot">案例来源：<a href="https://github.com/wheresryan22/anatomy/tree/main/examples/raptor-engine" target="_blank" rel="noopener">Anatomy 官方 Raptor Engine 示例</a>，作者 Ryan，MIT 许可。这里增加了中文导览与组件名称；发动机几何、拆解机制和着色器来自原项目。</footer></main>`);
  html=html.replace('</body>',`<!-- ${read('reference/anatomy-main/LICENSE')} --></body>`);
  const out=`raptor${light?'-light':''}.html`;writeFileSync(new URL(out,root),html);console.log('Built',out);
}
