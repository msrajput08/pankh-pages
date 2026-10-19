/* PankhPages: zero dependency, on-device worksheet and A4 PDF creator. */
(()=>{'use strict';
const $=(s,ctx=document)=>ctx.querySelector(s);
const devaSwar=['अ','आ','इ','ई','उ','ऊ','ऋ','ए','ऐ','ओ','औ','अं','अः'];
const devaVyanjan=['क','ख','ग','घ','ङ','च','छ','ज','झ','ञ','ट','ठ','ड','ढ','ण','त','थ','द','ध','न','प','फ','ब','भ','म','य','र','ल','व','श','ष','स','ह','ळ','क्ष','ज्ञ'];
const hiVyanjan=devaVyanjan.filter(c=>c!=='ळ').concat('त्र');
const vowelMarks=['','ा','ि','ी','ु','ू','ृ','े','ै','ो','ौ','ं','ः'];
const caps='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');const lows='abcdefghijklmnopqrstuvwxyz'.split('');
const BYTES=new TextEncoder();
const settingsBox=$('#editor-fields');const root=$('.generator');
let state,template,previewPage=0,frames=[],answers=[];
const clean=(s)=>String(s??'').slice(0,140).replace(/[<>]/g,'');
const escapeHtml=(s)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>i+a);
const chunks=(arr,n)=>Array.from({length:Math.ceil(arr.length/n)},(_,i)=>arr.slice(i*n,i*n+n));
const seedRandom=(seed)=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const randInt=(rnd,a,b)=>a+Math.floor(rnd()*(b-a+1));
const label=(name,tip)=>`<label for="${name}">${tip||name}</label>`;
const select=(name,tip,choices,value)=>`<div class="field">${label(name,tip)}<select id="${name}" name="${name}">${choices.map(([v,t])=>`<option value="${escapeHtml(v)}" ${v===value?'selected':''}>${escapeHtml(t)}</option>`).join('')}</select></div>`;
const field=(name,tip,value,placeholder='',type='text',maxLength=80)=>`<div class="field">${label(name,tip)}<input id="${name}" name="${name}" type="${type}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" maxlength="${maxLength}" autocomplete="off"></div>`;
const slider=(name,tip,min,max,value,help)=>`<div class="field">${label(name,`${tip} <span id="${name}-label">${value}</span>`)}<input id="${name}" name="${name}" aria-label="${tip}" type="range" min="${min}" max="${max}" value="${value}" step="1"><div class="range-ends"><span>${help||min}</span><span>${max}</span></div></div>`;
const check=(name,title,help,on)=>`<label class="switch-row" for="${name}"><div><b>${title}</b><small>${help}</small></div><input type="checkbox" id="${name}" name="${name}" ${on?'checked':''} role="switch"></label>`;
function defaults(t){return { mode:t.mode, set:t.set??'', script:t.script??'mr', operation:t.operation??'addition', paper:t.paper??'four', student:'', grade:'2', text:t.set==='name'?'Aarav':t.script==='mr'?'आई, बाबा, घर, शाळा':t.script==='hi'?'घर, पानी, किताब, फूल':'cat, sun, tree, apple', consonant:'क', startLetter:'A', rowCount:9, fontSize:'medium', showGuides:true, fullSet:t.set==='alphabet'||t.set==='uppercase'||t.set==='lowercase'||t.set==='swar'||t.set==='vyanjan'||t.set==='barakhadi', questionCount:20, showAnswers:true, numberStart:1, spacing:'regular', seed:Math.floor(Math.random()*99999999)};}
function renderFields(){const {mode,set}=state;let html='';
 if(mode==='devanagari'){
   if(set==='barakhadi')html+=select('consonant','Choose a consonant',(state.script==='hi'?hiVyanjan:devaVyanjan).map(x=>[x,x]),state.consonant);
   if(set==='words')html+=field('text','Words to practice (separate with commas)',state.text, 'आई, बाबा, घर');
   if(set==='alphabet')html+=select('set','Letter collection', [['alphabet','Swar + Vyanjan'],['swar','Swar (vowels)'],['vyanjan','Vyanjan (consonants)'],['barakhadi','Barakhadi'],['words','Custom words']],state.set);
   if(set==='barakhadi'||set==='swar'||set==='vyanjan'||set==='alphabet')html+=check('fullSet',set==='barakhadi'?'Show all 13 combinations':'Include the full collection','May create more than one PDF page',state.fullSet);
   html+=select('fontSize','Tracing size',[['large','Large — beginners'],['medium','Medium — balanced'],['small','Small — compact']],state.fontSize);
   if(!state.fullSet && set!=='words')html+=slider('rowCount','Practice rows',5,12,state.rowCount,'5 rows');
   if(set==='words')html+=slider('rowCount','Practice rows',5,12,state.rowCount,'5 rows');
   html+=check('showGuides','Writing guide lines','Show baseline and midline',state.showGuides);
 }else if(mode==='english'){
   if(set==='alphabet') html+=select('set','Letter collection',[['alphabet','Uppercase + lowercase'],['uppercase','Uppercase A–Z'],['lowercase','Lowercase a–z'],['words','Custom words'],['name','Name tracing']],state.set);
   if(set==='words'||set==='name')html+=field('text',set==='name'?'Name to trace':'Words to trace (comma separated)',state.text,'Your practice text');
   if(!['words','name'].includes(set)){
     html+=select('startLetter','Start from letter',caps.map((v)=>[v,v]),state.startLetter);
     html+=check('fullSet','Include the full alphabet','Downloads may include multiple pages',state.fullSet);
   }
   html+=select('fontSize','Letter size',[['large','Large — beginners'],['medium','Medium — balanced'],['small','Small — compact']],state.fontSize);
   if(!state.fullSet || ['name','words'].includes(set))html+=slider('rowCount','Practice rows',5,12,state.rowCount,'5 rows');
   html+=check('showGuides','Four-line writing guides','Helpful top, mid and baseline',state.showGuides);
 }else if(mode==='math'||mode==='missing'){
   if(mode==='math'&&template.operation==='mixed')html+=select('operation','Maths activity',[['mixed','All four operations'],['addition','Addition (+)'],['subtraction','Subtraction (−)'],['multiplication','Multiplication (×)'],['division','Division (÷)']],state.operation);
   html+=select('grade','Difficulty level',[['1','Grade 1 · Easy'],['2','Grade 2 · Starter'],['3','Grade 3 · Intermediate'],['4','Grade 4 · Challenge'],['5','Grade 5 · Advanced']],state.grade);
   html+=slider('questionCount','Questions per worksheet',8,30,state.questionCount,'8 questions');
   html+=check('showAnswers','Include answer key','Adds a separate answer page',state.showAnswers);
 }else if(mode==='numbers'){
   html+=field('numberStart','Start at number',state.numberStart,'1','number',3);
   html+=check('fullSet','Trace all numbers through 100','Download multiple practice pages',state.fullSet);
   if(!state.fullSet)html+=slider('rowCount','Practice rows',5,12,state.rowCount,'5 rows');
   html+=select('fontSize','Number size',[['large','Large — beginners'],['medium','Medium — balanced'],['small','Small — compact']],state.fontSize);
   html+=check('showGuides','Show guide lines','Helps keep numbers aligned',state.showGuides);
 }else if(mode==='paper'){
   html+=select('paper','Paper style',[['four','Four-line handwriting'],['ruled','Simple ruled lines'],['graph','Square graph grid']],state.paper);
   html+=select('spacing','Line spacing',[['wide','Wide — early learners'],['regular','Regular'],['narrow','Narrow — more lines']],state.spacing);
 }
 html+=field('student','Name on sheet (optional)',state.student,'Student name');
 settingsBox.innerHTML=html;
 // Input listeners attach to current controls only; rebuilt controls get fresh listeners.
 [...settingsBox.querySelectorAll('input,select,textarea')].forEach(el=>{
  el.addEventListener('input',onInput);
  if(el.type==='checkbox')el.addEventListener('change',onInput);
 });
}
function onInput(e){const v=e.target.type==='checkbox'?e.target.checked:e.target.type==='range'||e.target.type==='number'?Number(e.target.value):e.target.value;const previous=state.set;state[e.target.name]=v;if(e.target.name==='set'&&previous!==v){state.fullSet=['alphabet','uppercase','lowercase','swar','vyanjan','barakhadi'].includes(v);}
 if(e.target.type==='range'&&$(`#${e.target.name}-label`))$(`#${e.target.name}-label`).textContent=v;
 if(['set','paper','fullSet'].includes(e.target.name)) {renderFields();}
 render();
}
function canvasCreate(){const c=document.createElement('canvas');c.width=1240;c.height=1754;return c;}
function basePage(title,description,student='',pageIndex=0,pageCount=1){const c=canvasCreate();const x=c.getContext('2d');
 x.fillStyle='#ffffff';x.fillRect(0,0,1240,1754);
 x.fillStyle='#246e4d';x.fillRect(0,0,1240,15);
 x.fillStyle='#356c50';x.font='700 26px Arial, sans-serif';x.fillText('pankhpages',88,92);
 x.font='20px Arial, sans-serif';x.fillStyle='#8ca692';x.fillText('✳  LITTLE LEARNING PAGES',280,92);
 x.strokeStyle='#d9e8dc';x.lineWidth=2;x.beginPath();x.moveTo(88,116);x.lineTo(1152,116);x.stroke();
 x.font='21px Arial,sans-serif';x.fillStyle='#6b8272';x.fillText('NAME',88,177);x.strokeStyle='#aebdb0';x.beginPath();x.moveTo(170,185);x.lineTo(565,185);x.stroke();
 if(student){x.fillStyle='#2c4434';x.font='25px NotoDev, Arial,sans-serif';x.fillText(student.slice(0,25),181,171,375)}
 x.fillStyle='#6b8272';x.font='21px Arial,sans-serif';x.fillText('DATE',727,177);x.beginPath();x.moveTo(793,185);x.lineTo(1150,185);x.stroke();
 x.fillStyle='#243c2e';x.font='700 47px NotoDev,Arial,sans-serif';x.fillText(title,88,276,1060);
 x.fillStyle='#708477';x.font='22px NotoDev,Arial,sans-serif';x.fillText(description,88,325,1050);
 x.strokeStyle='#e2e9df';x.beginPath();x.moveTo(88,1668);x.lineTo(1152,1668);x.stroke();
 x.font='19px Arial,sans-serif';x.fillStyle='#8ba18f';x.fillText('Practice a little. Grow a lot.',88,1704);x.textAlign='right';x.fillText(`${pageIndex+1} / ${pageCount}     •     A4 printable`,1152,1704);x.textAlign='left';
 return c;
}
function roundedRect(ctx,x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill()}
function lines(ctx,top,height,style){
 ctx.lineWidth=1.8;ctx.strokeStyle='#a9c8df';
 const mk=(at,dashed=false)=>{ctx.beginPath();ctx.setLineDash(dashed?[6,8]:[]);ctx.moveTo(95,at);ctx.lineTo(1145,at);ctx.stroke();ctx.setLineDash([])};
 if(style==='four'){mk(top+9);mk(top+height*.47,true);mk(top+height-11)}
 else{mk(top+height-11)}
}
function traceGlyph(ctx,text,x,y,size,maxWidth=175){ctx.save();ctx.font=`${size}px NotoDev,Arial,sans-serif`;ctx.textBaseline='alphabetic';ctx.fillStyle='#e9f0ea';ctx.fillText(text,x,y,maxWidth);ctx.strokeStyle='#8cae99';ctx.lineWidth=1.45;ctx.lineCap='round';ctx.setLineDash([1.4,5]);ctx.strokeText(text,x,y,maxWidth);ctx.setLineDash([]);ctx.restore();}
function writingPages(all,t){
 const isDev=t.mode==='devanagari';let set=t.set,words=[];
 const listWords=()=>t.text.split(/[,\n]+/).map(a=>a.trim()).filter(Boolean).slice(0,24);
 if(isDev){
   if(set==='barakhadi') words=vowelMarks.map(m=>t.consonant+m);
   else if(set==='swar') words=[...devaSwar];
   else if(set==='vyanjan') words=[...(t.script==='hi'?hiVyanjan:devaVyanjan)];
   else if(set==='words')words=listWords();
   else words=[...devaSwar,...(t.script==='hi'?hiVyanjan:devaVyanjan)];
 }else if(t.mode==='numbers'){
   const start=Math.max(0,Math.min(100,Number(t.numberStart)||1));
   words=range(start, t.fullSet?100:Math.min(100,start+Math.max(5,t.rowCount)-1)).map(String);
 }else{
   if(set==='name')words=Array.from({length:t.rowCount},()=>clean(t.text.trim()||'My name'));
   else if(set==='words')words=listWords();
   else{words=(set==='lowercase'?lows:set==='uppercase'?caps:caps.map((s,i)=>`${s} ${lows[i]}`));
     if(!t.fullSet){let offset=caps.indexOf(t.startLetter);words=[...words.slice(offset),...words.slice(0,offset)];}
   }
 }
 if(words.length===0)words=['Practice'];
 const limit=t.fullSet? (set==='barakhadi'?13:t.fontSize==='large'?8:10) : Math.max(5,Math.min(12,Number(t.rowCount)||9));
 const sheets=t.fullSet?chunks(words,limit):[words.slice(0,limit)];
 const pageCount=sheets.length;
 return sheets.map((rows,i)=>{
  const title= t.mode==='numbers'?'Number tracing':set==='barakhadi'?'बाराखडी लेखन सराव':set==='words'?'Word writing practice':set==='name'?'My name practice':isDev?(t.script==='hi'?'हिंदी लेखन अभ्यास':'मराठी लेखन सराव'):'Alphabet handwriting';
  const desc=t.mode==='numbers'?'Trace the number, then try writing it yourself.':isDev?'पहले देखें, फिर लिखें  •  Look, trace, write.':'Trace the letters, then write them on your own.';
  const c=basePage(title,desc,t.student,i,pageCount),ctx=c.getContext('2d');
  const max=rows.length; const rowHeight=Math.min(145,Math.floor(1190/Math.max(max,8)));const top=365;
  rows.forEach((value,j)=>{
   const y=top+j*rowHeight;const fs=t.fontSize==='large'?70:t.fontSize==='small'?52:61;
   if(j%2===0)roundedRect(ctx,88,y,1064,rowHeight-3,13,'#f6faf7');
   if(t.showGuides)lines(ctx,y+4,rowHeight-9,'four');
   ctx.font=`700 ${Math.min(fs,68)}px NotoDev,Arial,sans-serif`;ctx.fillStyle='#2d5941';ctx.textBaseline='alphabetic';
   const ty=y+rowHeight-28;
   const valueSize=value.length>10?39:value.length>5?49:fs;
   ctx.font=`${valueSize}px NotoDev,Arial,sans-serif`;
   ctx.fillText(value,107,ty,230);
   ctx.save();ctx.strokeStyle='#e1e7e1';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(350,y+15);ctx.lineTo(350,y+rowHeight-16);ctx.stroke();ctx.restore();
   let text=value;
   const wEstimate=ctx.measureText(text).width;
   const repeat = wEstimate<95?3:wEstimate<170?2:1;
   for(let k=0;k<repeat;k++)traceGlyph(ctx,text,385+k*(wEstimate<95?145:230),ty,valueSize,wEstimate<95?135:220);
   ctx.textBaseline='alphabetic';
  });
  return c;
 });
}
function numberProblems(t){const count=Math.max(8,Math.min(30,Number(t.questionCount)||20));const rnd=seedRandom(t.seed>>>0);const grade=Math.max(1,Math.min(5,Number(t.grade)||2));const ops=t.operation==='mixed'?['addition','subtraction','multiplication','division']:[t.operation];const res=[];
 for(let i=0;i<count;i++){
  const op=ops.length===4?ops[i%4]:ops[0];let a=0,b=0,ans=0,symbol='+';
  if(op==='addition'){const max=[0,9,25,99,999,9999][grade];a=randInt(rnd,1,max);b=randInt(rnd,1,max);ans=a+b;symbol='+';}
  if(op==='subtraction'){const max=[0,10,50,100,1000,9999][grade];a=randInt(rnd,1,max);b=randInt(rnd,0,a);ans=a-b;symbol='−';}
  if(op==='multiplication'){const max=[0,5,10,12,20,30][grade];a=randInt(rnd,1,max);b=randInt(rnd,1,grade>=4?20:12);ans=a*b;symbol='×';}
  if(op==='division'){b=randInt(rnd,2,[0,6,10,12,15,20][grade]);ans=randInt(rnd,1,[0,8,10,12,15,20][grade]);a=b*ans;symbol='÷';}
  const item={text:`${a} ${symbol} ${b} =`,answer:ans};
  if(!res.some(r=>r.text===item.text))res.push(item);else i--;
 }
 return res;
}
function missingProblems(t){const rnd=seedRandom(t.seed>>>0), count=t.questionCount,grade=Number(t.grade); const res=[];
 for(let i=0;i<count;i++) {const jump=grade<2?1:grade===2?randInt(rnd,1,3):grade===3?randInt(rnd,2,5):randInt(rnd,3,10);const start=randInt(rnd,1,grade*20);const blank=randInt(rnd,1,3);const nums=range(0,4).map(j=>start+j*jump);res.push({text:nums.map((n,j)=>j===blank?'___':String(n)).join('   '),answer:nums[blank],short:`${nums.map((n,j)=>j===blank?'__':String(n)).join(', ')}`});}
 return res;
}
function mathsPages(t){const problems=t.mode==='missing'?missingProblems(t):numberProblems(t);answers=problems;const key=t.showAnswers;const name=t.mode==='missing'?'Missing number challenge':t.operation==='mixed'?'Mixed maths practice':`${t.operation[0].toUpperCase()}${t.operation.slice(1)} practice`;const desc='Solve each question carefully. You can do it!';
 const c=basePage(name,desc,t.student,0,key?2:1);const x=c.getContext('2d');
 const rowCount=Math.ceil(problems.length/2),colWidth=500,colGap=50,rowH=Math.min(118,1165/Math.max(rowCount,9));
 problems.forEach((p,i)=>{const col=i>=rowCount?1:0,row=i%rowCount;const left=94+col*(colWidth+colGap),top=377+row*rowH;
   if(row%2===0)roundedRect(x,left-9,top-11,colWidth-8,rowH-5,9,'#f4f8f4');
   x.font=t.mode==='missing'?'26px Arial,sans-serif':'32px Arial,sans-serif';x.fillStyle='#345542';x.fillText(`${i+1}.`,left,top+43);
   x.font=t.mode==='missing'?'25px Arial,sans-serif':'34px Arial,sans-serif';x.fillStyle='#243f30';x.fillText(p.text,left+55,top+43,colWidth-110);
   if(t.mode!=='missing'){x.strokeStyle='#c1d2c5';x.lineWidth=2;x.beginPath();x.moveTo(left+colWidth-125,top+53);x.lineTo(left+colWidth-35,top+53);x.stroke();}
 });
 if(!key)return[c];
 const a=basePage('Answer key','Use this page to check your work after solving.',t.student,1,2),ax=a.getContext('2d');
 problems.forEach((p,i)=>{const rowCount=Math.ceil(problems.length/2);const col=i>=rowCount?1:0,row=i%rowCount;const left=95+col*550,top=382+row*(Math.min(118,1165/Math.max(rowCount,9)));
  if(row%2===0)roundedRect(ax,left-9,top-12,500,69,9,'#f4f8f4');
  ax.fillStyle='#425b4a';ax.font='27px Arial,sans-serif';ax.fillText(`${i+1}.`,left,top+32);
  ax.font='26px Arial,sans-serif';ax.fillStyle='#2d674c';ax.fillText(`${p.text}  ${p.answer}`,left+55,top+32,440);
 });
 return[c,a];
}
function paperPages(t){const type=t.paper,desc=type==='graph'?'Practice neat drawings and calculations.':type==='four'?'Four lines to help every letter find its place.':'Plenty of space to write your ideas.';
 const c=basePage(type==='four'?'Handwriting practice':type==='graph'?'Graph paper':'Ruled writing paper',desc,t.student),x=c.getContext('2d');
 const spacing=t.spacing==='wide'?1.4:t.spacing==='narrow'?.78:1;
 if(type==='graph'){
   const step=Math.round(42*spacing),left=92,right=1148,top=364,bottom=1639;
   x.lineWidth=1.2;x.strokeStyle='#cee2d8';
   for(let px=left;px<=right;px+=step){x.beginPath();x.moveTo(px,top);x.lineTo(px,bottom);x.stroke()}
   for(let py=top;py<=bottom;py+=step){x.beginPath();x.moveTo(left,py);x.lineTo(right,py);x.stroke()}
 }else{
   const row= Math.round((type==='four'?112:67)*spacing);
   for(let top=370;top+row<1648;top+=row){if(type==='four'){
       x.lineWidth=1.4;x.strokeStyle='#aacce6';x.setLineDash([]);
       for(const h of [4,row-7]){x.beginPath();x.moveTo(96,top+h);x.lineTo(1140,top+h);x.stroke()}
       x.setLineDash([7,8]);x.strokeStyle='#c5cdd9';x.beginPath();x.moveTo(96,top+row*.46);x.lineTo(1140,top+row*.46);x.stroke();x.setLineDash([]);
     }else{x.lineWidth=1.3;x.strokeStyle='#b9cde0';x.beginPath();x.moveTo(96,top+row-7);x.lineTo(1140,top+row-7);x.stroke()}
   }
 }
 return[c];}
async function createAll(){await document.fonts.load('60px NotoDev');await document.fonts.ready;
 if(state.mode==='math'||state.mode==='missing')return mathsPages(state);
 if(state.mode==='paper')return paperPages(state);
 return writingPages([],state);
}
function preview(){const c=$('#worksheet-preview');if(!c||!frames.length)return;const d=c.getContext('2d');d.clearRect(0,0,c.width,c.height);d.drawImage(frames[previewPage],0,0);$('#page-info').textContent=`Page ${previewPage+1} of ${frames.length}`;$('#prev-page').disabled=previewPage===0;$('#next-page').disabled=previewPage===frames.length-1;const z=$('#zoom-canvas');if(z){z.getContext('2d').clearRect(0,0,z.width,z.height);z.getContext('2d').drawImage(frames[previewPage],0,0)}}
let renderGeneration=0;
async function render(){const id=++renderGeneration;try{const a=await createAll();if(id!==renderGeneration)return;frames=a;previewPage=Math.min(previewPage,frames.length-1);preview();$('#error-message').hidden=true}catch(err){console.error('Preview error',err);$('#error-message').textContent='Preview could not be generated. Try another setting.';$('#error-message').hidden=false}}
function arrayConcat(parts){let len=parts.reduce((n,b)=>n+b.length,0),out=new Uint8Array(len),p=0;for(const b of parts){out.set(b,p);p+=b.length}return out}
function pdfFromCanvases(canvases){const imgs=canvases.map(c=>{const data=c.toDataURL('image/jpeg',.96).split(',')[1];const bin=atob(data),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return bytes});
 const total=2+3*imgs.length;const parts=[];const pos=new Array(total+1).fill(0);let offset=0;
 function append(b){let v=typeof b==='string'?BYTES.encode(b):b;parts.push(v);offset+=v.length;}
 function obj(n,...body){pos[n]=offset;append(`${n} 0 obj\n`);for(const b of body)append(b);append('\nendobj\n')}
 append('%PDF-1.4\n%âãÏÓ\n');
 obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
 obj(2,`<< /Type /Pages /Kids [${imgs.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] /Count ${imgs.length} >>`);
 imgs.forEach((bytes,i)=>{
  let id=3+i*3,cmd='q 595.28 0 0 841.89 0 0 cm /Im0 Do Q';
  obj(id,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ${id+2} 0 R >> >> /Contents ${id+1} 0 R >>`);
  obj(id+1,`<< /Length ${BYTES.encode(cmd).length} >>\nstream\n${cmd}\nendstream`);
  obj(id+2,`<< /Type /XObject /Subtype /Image /Width 1240 /Height 1754 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`,bytes,'\nendstream');
 });
 const xref=offset;append(`xref\n0 ${total+1}\n0000000000 65535 f \n`);
 for(let i=1;i<=total;i++)append(`${String(pos[i]).padStart(10,'0')} 00000 n \n`);
 append(`trailer\n<< /Size ${total+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
 return new Blob(parts,{type:'application/pdf'});
}
function toast(message){let el=$('#toast');if(!el){el=document.createElement('div');el.id='toast';el.setAttribute('role','status');document.body.append(el)}el.textContent=message;el.hidden=false;clearTimeout(window.__leafToast);window.__leafToast=setTimeout(()=>el.hidden=true,3200)}
async function download(){const btn=$('#download-btn');if(!frames.length)return;btn.disabled=true;const text=btn.querySelector('span');const original=text.textContent;text.textContent='Creating PDF…';try{await document.fonts.ready;const pdf=pdfFromCanvases(frames),url=URL.createObjectURL(pdf),a=document.createElement('a');a.href=url;a.download=`pankhpages-${root.dataset.template}-${new Date().toISOString().slice(0,10)}.pdf`;a.style.display='none';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),12000);toast(`Your ${frames.length}-page worksheet PDF is ready!`)}catch(e){console.error(e);toast('Sorry, could not create the PDF. Try the print button.')}finally{btn.disabled=false;text.textContent=original}}
function printPages(){if(!frames.length)return;const frame=document.createElement('iframe');frame.style.position='fixed';frame.style.left='-100000px';frame.style.width='1px';frame.style.height='1px';frame.title='Worksheet print preview';document.body.append(frame);
 const images=frames.map(c=>`<img src="${c.toDataURL('image/png')}" alt="A4 worksheet">`).join('');
 frame.onload=()=>{try{frame.contentWindow.focus();frame.contentWindow.print()}catch(e){toast('Print preview blocked. Use Download PDF instead.')}setTimeout(()=>frame.remove(),10000)};
 frame.srcdoc=`<!doctype html><html><head><title>PankhPages worksheet</title><style>@page{size:A4 portrait;margin:0}html,body{margin:0;padding:0}img{width:210mm;height:297mm;display:block;page-break-after:always;break-after:page}img:last-child{page-break-after:auto;break-after:auto}</style></head><body>${images}</body></html>`;
}
function init(){const mobile=$('.mobile-menu-toggle');if(mobile){mobile.addEventListener('click',()=>{const nav=$('#mobile-navigation');nav.hidden=!nav.hidden;mobile.setAttribute('aria-expanded',String(!nav.hidden));mobile.setAttribute('aria-label',nav.hidden?'Open navigation':'Close navigation')})}
 if(!root)return;
 template={slug:root.dataset.template,mode:root.dataset.mode,script:root.dataset.template.startsWith('hindi')?'hi':'mr',set:'',operation:'addition',paper:'four'};
 const id=template.slug;
 if(id.includes('barakhadi'))template.set='barakhadi';else if(id.includes('swar'))template.set='swar';else if(id.includes('vyanjan'))template.set='vyanjan';else if(id.includes('name-tracing'))template.set='name';else if(id.includes('word-tracing')||id.includes('handwriting-practice')&&id!=='four-line-handwriting-paper')template.set='words';else if(id.includes('uppercase'))template.set='uppercase';else if(id.includes('lowercase'))template.set='lowercase';else template.set='alphabet';
 if(id==='marathi-mulakshare-worksheet')template.set='alphabet';
 if(id==='marathi-worksheets'||id==='hindi-worksheets')template.set='alphabet';
 if(id==='blank-ruled-paper')template.paper='ruled';else if(id==='printable-graph-paper')template.paper='graph';
 if(id==='maths-worksheets'||id==='mixed-maths-worksheets')template.operation='mixed';else if(id.includes('subtraction'))template.operation='subtraction';else if(id.includes('multiplication'))template.operation='multiplication';else if(id.includes('division'))template.operation='division';
 state=defaults(template);renderFields();render();const refreshLabel=state.mode==='math'||state.mode==='missing'?'Fresh questions':state.mode==='paper'?'Change paper':state.set==='barakhadi'?'Next consonant':state.set==='name'||state.set==='words'?'Change letter size':'Different practice';$('#refresh-btn').innerHTML=`<span class="btn-icon">↻</span> ${refreshLabel}`;
 $('#download-btn').addEventListener('click',download);
 $('#refresh-btn').addEventListener('click',()=>{if(state.mode==='paper'){const choices=['four','ruled','graph'];state.paper=choices[(choices.indexOf(state.paper)+1)%choices.length];const el=$('#paper');if(el)el.value=state.paper;toast('Paper style changed.')}else if(state.set==='barakhadi'){const consonants=state.script==='hi'?hiVyanjan:devaVyanjan;state.consonant=consonants[(consonants.indexOf(state.consonant)+1)%consonants.length];const el=$('#consonant');if(el)el.value=state.consonant;}else if(state.mode==='math'||state.mode==='missing'){state.seed=Math.floor(Math.random()*4294967295)}else if(state.set==='name'||state.set==='words'){state.fontSize=state.fontSize==='medium'?'large':state.fontSize==='large'?'small':'medium';const el=$('#fontSize');if(el)el.value=state.fontSize;}else if(state.set==='alphabet'||state.set==='swar'||state.set==='vyanjan'||state.set==='uppercase'||state.set==='lowercase'){if(state.fullSet){state.fullSet=false;renderFields()}else{state.startLetter=caps[(caps.indexOf(state.startLetter)+7)%26];const el=$('#startLetter');if(el)el.value=state.startLetter;}}
 render()});
 $('#prev-page').addEventListener('click',()=>{if(previewPage>0){previewPage--;preview()}});
 $('#next-page').addEventListener('click',()=>{if(previewPage<frames.length-1){previewPage++;preview()}});
 $('#zoom-btn').addEventListener('click',()=>{$('#zoom-dialog').showModal();preview()});
 $('#zoom-close').addEventListener('click',()=>$('#zoom-dialog').close());
 $('#zoom-dialog').addEventListener('click',e=>{if(e.target===$('#zoom-dialog'))$('#zoom-dialog').close()});
 $('#print-btn').addEventListener('click',printPages);
 window.__pankhpages={getState:()=>({...state}),getPageCount:()=>frames.length,makePDF:()=>pdfFromCanvases(frames),render};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
