/* ============ Utilidades ============ */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const store = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};

/* ============ SHA-256 (sin dependencias, funciona sin conexiÃ³n) ============ */
function sha256(str){
  const ascii = unescape(encodeURIComponent(str));
  const rr = (v,a) => (v>>>a)|(v<<(32-a));
  const maxWord = 2**32; let i,j,result='';
  const words=[]; const bitLen = ascii.length*8;
  let hash=[], k=[]; let pc=0; const comp={};
  for(let c=2; pc<64; c++){
    if(!comp[c]){
      for(i=0;i<313;i+=c) comp[i]=c;
      hash[pc]=(Math.pow(c,.5)*maxWord)|0;
      k[pc++]=(Math.pow(c,1/3)*maxWord)|0;
    }
  }
  let s = ascii + '\x80';
  while(s.length%64-56) s+='\x00';
  for(i=0;i<s.length;i++){ j=s.charCodeAt(i); words[i>>2] |= j<<((3-i)%4)*8; }
  words[words.length]=((bitLen/maxWord)|0);
  words[words.length]=bitLen;
  hash = hash.slice(0,8);
  for(j=0;j<words.length;){
    const w = words.slice(j, j+=16); const old = hash; hash = hash.slice(0,8);
    for(i=0;i<64;i++){
      const w15=w[i-15], w2=w[i-2], a=hash[0], e=hash[4];
      const t1 = hash[7] + (rr(e,6)^rr(e,11)^rr(e,25)) + ((e&hash[5])^((~e)&hash[6])) + k[i]
        + (w[i] = (i<16) ? w[i] : (w[i-16] + (rr(w15,7)^rr(w15,18)^(w15>>>3)) + w[i-7] + (rr(w2,17)^rr(w2,19)^(w2>>>10)))|0);
      const t2 = (rr(a,2)^rr(a,13)^rr(a,22)) + ((a&hash[1])^(a&hash[2])^(hash[1]&hash[2]));
      hash = [(t1+t2)|0].concat(hash); hash[4]=(hash[4]+t1)|0;
    }
    for(i=0;i<8;i++) hash[i]=(hash[i]+old[i])|0;
  }
  for(i=0;i<8;i++) for(j=3;j+1;j--){ const b=(hash[i]>>(j*8))&255; result+=((b<16)?0:'')+b.toString(16); }
  return result;
}

/* ============ NavegaciÃ³n y progreso ============ */
const MODS = ['inicio','m1','m2','m3','m4','m5','m6','m7','eval','recursos'];
let visited = new Set(store.get('ova-seg-visited', []));
function show(id){
  if(!MODS.includes(id)) id='inicio';
  $$('section.mod').forEach(s => s.classList.toggle('show', s.id===id));
  $$('#navlist a').forEach(a => a.classList.toggle('active', a.dataset.m===id));
  if(id!=='recursos'){ visited.add(id); store.set('ova-seg-visited',[...visited]); }
  updateProgress();
  const top = $('.layout').getBoundingClientRect().top + window.scrollY - 50;
  if(window.scrollY > top) window.scrollTo({top, behavior:'smooth'});
}
function updateProgress(){
  const tracked = MODS.filter(m=>m!=='recursos');
  const n = tracked.filter(m=>visited.has(m)).length;
  $('#bar').style.width = (n/tracked.length*100)+'%';
  $('#barTxt').textContent = n+' / '+tracked.length;
  $$('#navlist a').forEach(a => a.classList.toggle('done', visited.has(a.dataset.m)));
}
window.addEventListener('hashchange', ()=>show(location.hash.slice(1)));
document.addEventListener('click', e=>{
  const g = e.target.closest('[data-go]');
  if(g){ location.hash = g.dataset.go; }
});

/* ============ Videos de YouTube ============ */
const PLAY = '<svg width="30" height="30" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>';
$$('.video').forEach(v=>{
  const id=v.dataset.yt, url='https://www.youtube.com/watch?v='+id;
  v.innerHTML = `<div class="frame" style="background-image:url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)">
      <button class="play" aria-label="Reproducir: ${v.dataset.title}"><span>${PLAY}</span></button></div>
    <div class="cap"><span><b>${v.dataset.title}</b> Â· ${v.dataset.ch}</span><a href="${url}" target="_blank" rel="noopener">Ver en YouTube â†—</a></div>`;
  $('.play',v).addEventListener('click',()=>{
    // Abierto como archivo local, YouTube no permite incrustar: se abre en una pestaÃ±a nueva.
    if(location.protocol==='file:'){ window.open(url,'_blank','noopener'); return; }
    $('.frame',v).innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="${v.dataset.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
  });
});
const VMAP={XKZ52qVKfC0:'01',NojieeabIC8:'02',QOP9pQCIBqc:'02','5BYhdr5n3es':'04',RqhIjv6Lz4k:'05','6wdjNdpT6EI':'06'};
$$('.video').forEach(v=>{
  const tr=document.createElement('tr');
  tr.innerHTML=`<td>${VMAP[v.dataset.yt]}</td><td><a href="https://www.youtube.com/watch?v=${v.dataset.yt}" target="_blank" rel="noopener">${v.dataset.title}</a></td><td>${v.dataset.ch}</td>`;
  $('#vidTable').appendChild(tr);
});

/* ============ Tarjetas desplegables ============ */
document.addEventListener('click', e=>{
  const f=e.target.closest('button.flip'); if(f) f.classList.toggle('open');
});

/* ============ Ejercicio genÃ©rico de clasificaciÃ³n ============ */
function classify(boxId, options, items){
  const box=$('#'+boxId);
  items.forEach(it=>{
    const d=document.createElement('div'); d.className='scen';
    d.innerHTML=`<div>${it.q}</div><div class="opts"></div><div class="fb"></div>`;
    const o=$('.opts',d), fb=$('.fb',d);
    options.forEach(op=>{
      const b=document.createElement('button'); b.className='opt'; b.textContent=op;
      b.onclick=()=>{
        $$('.opt',o).forEach(x=>x.classList.remove('right','wrong'));
        if(op===it.a){ b.classList.add('right'); fb.className='fb show ok'; fb.innerHTML='<b>Â¡Correcto!</b> '+it.why; }
        else{ b.classList.add('wrong'); fb.className='fb show no'; fb.innerHTML='<b>No es '+op.toLowerCase()+'.</b> '+(it.hint||'Vuelve a intentarlo.'); }
      };
      o.appendChild(b);
    });
    box.appendChild(d);
  });
}

classify('act1',['Confidencialidad','Integridad','Disponibilidad','Robo de servicio','Denegación de servicio'],[
  {q:'Un empleado copia la lista de clientes con sus cédulas y la vende.',a:'Confidencialidad',why:'Los datos no se alteraron ni se borraron: alguien los <b>leyó</b> sin autorización.',hint:'Pregúntate: ¿los datos cambiaron, desaparecieron o solo alguien los vio?'},
  {q:'Un atacante cambia el número de cuenta destino en las facturas de un proveedor.',a:'Integridad',why:'Se <b>modificaron</b> datos sin autorización, aunque el sistema siga funcionando.',hint:'Fíjate en que la información sigue ahí, pero ya no es la original.'},
  {q:'Alguien usa los servidores de la universidad para minar criptomonedas por las noches.',a:'Robo de servicio',why:'No se roban ni alteran datos: se <b>usan recursos</b> (CPU, energía) sin permiso.',hint:'¿Qué se está tomando aquí? No son datos.'},
  {q:'Miles de equipos zombis saturan el portal de pagos el día del cierre y nadie puede pagar.',a:'Denegación de servicio',why:'El objetivo es <b>impedir el uso legítimo</b> del sistema saturándolo.',hint:'Nadie robó ni cambió nada; ¿qué pasó con los usuarios?'},
  {q:'Un ransomware borra los respaldos de una clínica.',a:'Disponibilidad',why:'Se <b>destruyen</b> datos: dejan de estar disponibles para quien los necesita.',hint:'¿Los datos siguen existiendo después del ataque?'}
]);

classify('act2',['Caballo de Troya','Puerta trasera','Bomba lógica','Desbordamiento de búfer'],[
  {q:'Un “juego gratis” descargado de un foro, además de funcionar, envía tus archivos a un servidor externo.',a:'Caballo de Troya',why:'Aparenta ser legítimo y abusa de los permisos de quien lo ejecuta.'},
  {q:'El código del sistema de nómina acepta el usuario <code>soporte_x</code> con una contraseña fija que nadie más conoce.',a:'Puerta trasera',why:'El propio diseñador dejó un acceso escondido que se salta la autenticación.'},
  {q:'Una rutina en el ERP borra la base de datos el 1 de enero si el usuario “jperez” ya no existe.',a:'Bomba lógica',why:'Permanece inactiva hasta que se cumple una condición (fecha + usuario eliminado).'},
  {q:'Un servidor recibe un nombre de usuario de 600 caracteres y termina ejecutando código del atacante.',a:'Desbordamiento de búfer',why:'La entrada excede el tamaño del arreglo y sobrescribe la dirección de retorno en la pila.'}
]);

classify('act3',['Virus','Gusano'],[
  {q:'Se propaga solo de servidor en servidor aprovechando una vulnerabilidad del servicio SMB, sin que nadie abra nada.',a:'Gusano',why:'Viaja por la red por sí mismo; no necesita un programa huésped.'},
  {q:'Está escondido dentro de un macro de un documento de Word y se activa cuando lo abres.',a:'Virus',why:'Necesita un huésped (el documento) y que el usuario lo ejecute.'},
  {q:'El programa de Morris de 1988, que entraba por finger, rsh y sendmail.',a:'Gusano',why:'Es el ejemplo clásico de gusano del libro: se copiaba solo de máquina en máquina.'},
  {q:'Modifica el sector de arranque del disco para cargarse antes que el sistema operativo.',a:'Virus',why:'Es un virus de arranque: se adhiere a un huésped (el sector de arranque).'}
]);

classify('act4',['Clave pública del destinatario','Clave privada del destinatario','Mi clave privada','Clave simétrica compartida'],[
  {q:'Quiero enviarle a Laura un mensaje que solo ella pueda leer. ¿Con qué lo cifro?',a:'Clave pública del destinatario',why:'Cualquiera puede cifrar con la pública de Laura, pero solo ella lo descifra con su privada.',hint:'Piensa en el buzón con ranura: ¿qué parte puede usar cualquiera?'},
  {q:'Quiero firmar un documento para que todos verifiquen que lo envié yo. ¿Con qué firmo?',a:'Mi clave privada',why:'Solo tú tienes tu privada; todos verifican la firma con tu pública.',hint:'La firma debe ser algo que solo tú puedas producir.'},
  {q:'Laura recibe mi mensaje cifrado. ¿Con qué lo descifra?',a:'Clave privada del destinatario',why:'Lo cifrado con la pública de Laura solo se abre con la privada de Laura.'},
  {q:'Ya intercambiamos una clave de sesión y queremos cifrar rápido un video de 2 GB. ¿Qué usamos?',a:'Clave simétrica compartida',why:'El cifrado simétrico (como AES) es mucho más rápido; por eso se usa el esquema híbrido.'}
]);

classify('act5',['Algo que sabes','Algo que tienes','Algo que eres'],[
  {q:'El código de 6 dígitos que muestra la app autenticadora de tu celular.',a:'Algo que tienes',why:'Demuestra que tienes el dispositivo; el código cambia cada pocos segundos.',hint:'Ese código no lo memorizas: ¿de dónde sale?'},
  {q:'Desbloquear el portátil con la huella.',a:'Algo que eres',why:'Es una característica biométrica.'},
  {q:'El PIN de la tarjeta débito.',a:'Algo que sabes',why:'Es un secreto memorizado.'},
  {q:'El carné con chip que acercas al torniquete de la universidad.',a:'Algo que tienes',why:'Es un objeto físico que posees.'}
]);

classify('act7',['D','C1','C2','B1','A1'],[
  {q:'MS-DOS: cualquier usuario puede leer y modificar todo; no hay cuentas.',a:'D',why:'Protección mínima: sistemas evaluados que no cumplen ningún otro nivel.'},
  {q:'El sistema permite cuentas individuales con control de acceso por usuario y <b>registra auditoría</b> de cada acción.',a:'C2',why:'C2 agrega a C1 el control a nivel de usuario individual y la auditoría.'},
  {q:'Cada archivo lleva una etiqueta como “secreto” o “alto secreto” y el sistema impide que un usuario de nivel “confidencial” lo lea.',a:'B1',why:'B1 introduce etiquetas de sensibilidad (seguridad multinivel).'},
  {q:'El diseño del sistema fue verificado con métodos matemáticos formales.',a:'A1',why:'A1 equivale a B3 pero con diseño y especificación verificados formalmente.'}
]);

/* ============ Niveles de seguridad ============ */
const LVL=[
  ['Físico','Los centros de datos y equipos deben estar protegidos contra la entrada de intrusos. <b>Ej.:</b> si alguien entra al cuarto de servidores y se lleva el disco, ninguna contraseña lo detiene.'],
  ['Humano','Hay que controlar a quién se le da acceso y prevenir la <b>ingeniería social</b>: <i>phishing</i> (correos o páginas falsas que piden datos), revisar la basura buscando claves (<i>dumpster diving</i>) o convencer a alguien de que comparta su contraseña. Suele ser el eslabón más débil.'],
  ['Sistema operativo','El SO debe protegerse de sí mismo y de ataques accidentales o intencionales: un desbordamiento de pila que lance un proceso no autorizado, una puerta trasera, servicios innecesarios activos.'],
  ['Red','Los datos viajan por líneas privadas, Internet o wifi. Interceptarlos o interrumpir las comunicaciones puede ser tan grave como un ataque local.']
];
$$('#levels .lvl').forEach(b=>b.onclick=()=>{
  $$('#levels .lvl').forEach(x=>x.classList.remove('on')); b.classList.add('on');
  const [t,d]=LVL[b.dataset.i]; $('#lvlOut').innerHTML='<span class="ttl">Nivel '+t+'</span>'+d;
});

/* ============ Tipos de virus ============ */
const VIR=[
  ['De archivo','Se agrega al final de un ejecutable y altera el inicio del programa para saltar a su código; luego le devuelve el control para no levantar sospechas. Llamado también <i>parásito</i>.'],
  ['De arranque','Infecta el sector de arranque y se ejecuta cada vez que se inicia el sistema, antes que el SO. Busca otros medios arrancables para infectarlos.'],
  ['De macro','Escrito en un lenguaje de macros (como Visual Basic para aplicaciones) y escondido en documentos u hojas de cálculo. Se ejecuta al abrir el archivo.'],
  ['De código fuente','Busca código fuente y lo modifica para incluirse en él y propagarse cuando se compila.'],
  ['Polimórfico','Cambia cada vez que se instala para no coincidir con la <b>firma</b> que usan los antivirus. El comportamiento es el mismo; el aspecto, no.'],
  ['Cifrado','Viaja cifrado para evitar la detección e incluye el código de descifrado que lo activa.'],
  ['De ocultación (stealth)','Modifica partes del sistema para no ser detectado; por ejemplo, altera la llamada <code>read</code> para que al leer un archivo infectado se devuelva la versión original.'],
  ['Tunelización','Se instala en la cadena de rutinas de interrupción o en los drivers para pasar por debajo del antivirus.'],
  ['Multiparte','Infecta varias partes del sistema a la vez (sector de arranque, memoria y archivos), lo que dificulta eliminarlo.'],
  ['Acorazado (armored)','Está ofuscado y comprimido a propósito para que los investigadores no puedan desensamblarlo ni entenderlo.']
];
VIR.forEach(([t,d])=>{
  const b=document.createElement('button'); b.className='flip';
  b.innerHTML=`<span class="t">${t}</span><span class="s">Toca para ver</span><span class="more">${d}</span>`;
  $('#virus').appendChild(b);
});

/* ============ Simulador de desbordamiento de búfer ============ */
function renderStack(){
  const s=$('#bofIn').value; const bytes=[...s];
  const rows=[
    {lab:'dirección de retorno',from:12,cls:'ret',def:['0x','08','04','84']},
    {lab:'frame pointer guardado',from:8,cls:'',def:['0x','bf','ff','f0']},
    {lab:'char buffer[8]',from:0,cls:'',def:null,len:8}
  ];
  let html='';
  rows.forEach(r=>{
    const len=r.len||4; let cells='';
    for(let i=0;i<len;i++){
      const idx=r.from+i; const ch=bytes[idx];
      let cls='cell', txt;
      if(ch!==undefined){ cls+= idx>=8?' bad':' fill'; txt=ch===' '?'␣':ch; }
      else txt = r.def? r.def[i] : '·';
      cells+=`<div class="${cls}">${txt.replace(/</g,'&lt;')}</div>`;
    }
    if(len===4) cells+='<div></div><div></div><div></div><div></div>';
    html+=`<div class="srow ${r.cls}"><div class="lab">${r.lab}</div><div class="cells">${cells}</div></div>`;
  });
  $('#stack').innerHTML = '<div class="srow"><div class="lab" style="font-size:.72rem">direcciones altas ↑</div><div></div></div>' + html + '<div class="srow"><div class="lab" style="font-size:.72rem">direcciones bajas ↓</div><div></div></div>';
  const m=$('#bofMsg'); const n=bytes.length;
  if(n<=7){ m.className='fb show ok'; m.innerHTML=`Copiaste ${n} caracteres (+1 del terminador <code>\\0</code>). Caben en el búfer: la pila está intacta.`; }
  else if(n<=11){ m.className='fb show no'; m.innerHTML=`<b>¡Desbordamiento!</b> ${n} caracteres no caben en 8 bytes. Ya se sobrescribió el <i>frame pointer</i> guardado: el programa probablemente se caiga al retornar.`; }
  else{ m.className='fb show no'; m.innerHTML=`<b>¡La dirección de retorno fue sobrescrita!</b> Al terminar la función, la CPU saltará a la dirección formada por <code>${bytes.slice(12,16).join('')||'?'}</code>. Un atacante pondría ahí la dirección de su propio código (por ejemplo, uno que abre una shell con los privilegios del programa).`; }
}
$('#bofIn').addEventListener('input',renderStack); renderStack();

/* ============ Inundación SYN ============ */
let slots=Array(10).fill(null);
function renderSlots(msg,ok){
  $('#slots').innerHTML=slots.map(s=>`<div class="slot ${s||''}">${s==='fake'?'SYN ?':s==='real'?'cliente':'libre'}</div>`).join('');
  if(msg){ const m=$('#synMsg'); m.className='fb show '+(ok?'ok':'no'); m.innerHTML=msg; }
}
$('#synFake').onclick=()=>{
  let added=0; for(let i=0;i<10&&added<3;i++) if(!slots[i]){ slots[i]='fake'; added++; }
  const free=slots.filter(s=>!s).length;
  renderSlots(free? `El servidor reservó espacio para ${added} conexiones falsas y espera un ACK que nunca llegará. Quedan <b>${free}</b> espacios libres.` : '<b>Tabla llena.</b> El servidor ya no acepta conexiones nuevas: los usuarios legítimos quedan por fuera. Eso es una denegación de servicio.', free>0);
};
$('#synReal').onclick=()=>{
  const i=slots.indexOf(null);
  if(i<0){ renderSlots('<b>Conexión rechazada.</b> El cliente legítimo no consigue espacio porque los SYN falsos ocupan toda la tabla.',false); return; }
  slots[i]='real'; renderSlots('El cliente completó el handshake (SYN → SYN-ACK → ACK). Conexión establecida.',true);
};
$('#synReset').onclick=()=>{ slots=Array(10).fill(null); renderSlots('Tabla del servidor: 10 espacios para conexiones pendientes.',true); };
renderSlots();

/* ============ César ============ */
function caesar(){
  const k=+$('#cK').value; $('#cKv').textContent=k;
  const A='abcdefghijklmnopqrstuvwxyz';
  $('#cOut').textContent=[...$('#cIn').value].map(ch=>{
    const lo=ch.toLowerCase(), i=A.indexOf(lo);
    if(i<0) return ch; const r=A[(i+k)%26]; return ch===lo?r:r.toUpperCase();
  }).join('');
}
$('#cIn').addEventListener('input',caesar); $('#cK').addEventListener('input',caesar); caesar();

/* ============ Mini RSA ============ */
function rsa(){
  let m=Math.round(+$('#rsaM').value); if(!(m>=2&&m<=32)){ $('#rsaE').innerHTML='Usa un número entre 2 y 32.'; $('#rsaD').innerHTML=''; return; }
  const p3=m**3, c=p3%33, q1=Math.floor(p3/33);
  $('#rsaE').innerHTML=`c = m<sup>e</sup> mod N<br>c = ${m}<sup>3</sup> mod 33<br>${m}<sup>3</sup> = ${p3}<br>${p3} = 33 · ${q1} + ${c}<br><b style="color:#35d98a">c = ${c}</b>`;
  const p7=c**7, back=p7%33, q2=Math.floor(p7/33);
  $('#rsaD').innerHTML=`m = c<sup>d</sup> mod N<br>m = ${c}<sup>7</sup> mod 33<br>${c}<sup>7</sup> = ${p7.toLocaleString('es-CO')}<br>${p7.toLocaleString('es-CO')} = 33 · ${q2.toLocaleString('es-CO')} + ${back}<br><b style="color:#35d98a">m = ${back}</b> ${back===m?'✓ recuperamos el mensaje':''}`;
}
$('#rsaM').addEventListener('input',rsa); rsa();

/* ============ Hash ============ */
function hashDemo(){ $('#hOut').textContent=sha256($('#hIn').value); }
$('#hIn').addEventListener('input',hashDemo); hashDemo();

/* ============ Salt ============ */
const rndSalt=()=>Array.from({length:4},()=>'0123456789abcdef'[Math.floor(Math.random()*16)]).join('')+Array.from({length:4},()=>'0123456789abcdef'[Math.floor(Math.random()*16)]).join('');
let salts=[rndSalt(),rndSalt()], noSalt=false;
function saltDemo(){
  const pw=$('#sPw').value;
  $('#sa1').textContent=noSalt?'(ninguno)':salts[0]; $('#sa2').textContent=noSalt?'(ninguno)':salts[1];
  const h1=sha256((noSalt?'':salts[0])+pw), h2=sha256((noSalt?'':salts[1])+pw);
  $('#sh1').textContent=h1; $('#sh2').textContent=h2;
  const m=$('#sMsg'); m.className='fb show '+(h1===h2?'no':'ok');
  m.innerHTML = h1===h2 ? '<b>Sin salt, los hashes son idénticos.</b> Quien vea el archivo sabe que ana y luis usan la misma contraseña, y una tabla precalculada la revelaría de una vez.' : '<b>Con salt, los hashes son distintos</b> aunque la contraseña sea la misma. El atacante tendría que atacar cada cuenta por separado.';
}
$('#sPw').addEventListener('input',saltDemo);
$('#sNew').onclick=()=>{ salts=[rndSalt(),rndSalt()]; noSalt=false; $('#sNoSalt').textContent='Ver sin salt'; saltDemo(); };
$('#sNoSalt').onclick=()=>{ noSalt=!noSalt; $('#sNoSalt').textContent=noSalt?'Ver con salt':'Ver sin salt'; saltDemo(); };
saltDemo();

/* ============ Fuerza de contraseña ============ */
const COMMON=['123456','12345678','123456789','password','contraseña','qwerty','111111','abc123','colombia','admin','iloveyou','000000','1234567890','teamo'];
function fmtTime(s){
  if(s<1) return 'menos de 1 segundo';
  const u=[['siglos',3153600000],['años',31536000],['días',86400],['horas',3600],['minutos',60],['segundos',1]];
  for(const [n,v] of u) if(s>=v){ const x=s/v; return (x>1e6? x.toExponential(1).replace('e+',' × 10^') : Math.round(x).toLocaleString('es-CO'))+' '+n; }
}
$('#pw').addEventListener('input',()=>{
  const p=$('#pw').value; const out=$('#pwOut'), bar=$('#pwBar');
  if(!p){ out.textContent='Escribe una contraseña para ver el análisis.'; bar.style.width='0'; return; }
  let cs=0, parts=[];
  if(/[a-z]/.test(p)){cs+=26;parts.push('minúsculas');}
  if(/[A-Z]/.test(p)){cs+=26;parts.push('mayúsculas');}
  if(/[0-9]/.test(p)){cs+=10;parts.push('números');}
  if(/[^a-zA-Z0-9]/.test(p)){cs+=33;parts.push('símbolos');}
  const bits=p.length*Math.log2(cs);
  const common=COMMON.includes(p.toLowerCase());
  const secs=common?0:Math.pow(2,bits)/2/1e10;
  const pct=common?4:Math.min(100,bits/90*100);
  bar.style.width=pct+'%';
  bar.style.background=pct<40?'var(--danger)':pct<70?'var(--warn)':'linear-gradient(90deg,var(--usb),var(--neon))';
  out.innerHTML = common ? 'Esta contraseña está en las listas de las más usadas: un ataque de <b>diccionario</b> la encuentra al instante.'
    : `Longitud: ${p.length} · Conjunto: ${parts.join(', ')} (${cs} símbolos)<br>Entropía aproximada: ${bits.toFixed(1)} bits<br>Tiempo promedio por fuerza bruta: <b>${fmtTime(secs)}</b>`;
});

/* ============ Cortafuegos ============ */
const PKTS=[
  {d:'TCP 181.52.8.4:51000 → 200.1.1.10:443',a:true,why:'Coincide con la regla 1: tráfico HTTPS hacia el servidor web de la DMZ.'},
  {d:'TCP 181.52.8.4:51022 → 10.0.0.25:22',a:false,why:'No coincide con la regla 1 ni con la 2 (el origen no es interno); coincide con la regla 3: nadie de afuera entra a la red interna.'},
  {d:'TCP 10.0.0.25:40000 → 200.1.1.10:22',a:true,why:'Coincide con la regla 2: SSH desde la red interna está permitido.'},
  {d:'UDP 45.33.2.1:5353 → 200.1.1.10:53',a:false,why:'No es TCP 443 ni SSH interno, y el destino no es la red interna: cae en la regla 4 (bloquear todo lo demás).'},
  {d:'TCP 181.52.8.4:51040 → 200.1.1.10:80',a:false,why:'Es el servidor web, pero por el puerto 80, no el 443. Ninguna regla lo permite: regla 4.'}
];
let fwDone=0, fwOk=0;
PKTS.forEach(p=>{
  const d=document.createElement('div'); d.className='pkt';
  d.innerHTML=`<span>${p.d}</span><span class="acts"><button class="btn sm">Permitir</button><button class="btn sm" style="background:var(--danger)">Bloquear</button></span><span class="why"></span>`;
  const [ok,no]=$$('button',d);
  const answer=v=>{
    const right=v===p.a; d.classList.add(right?'ok':'no');
    $('.why',d).innerHTML=(right?'<b>¡Bien!</b> ':'<b>Incorrecto.</b> Debía '+(p.a?'permitirse':'bloquearse')+'. ')+p.why;
    ok.disabled=no.disabled=true; ok.style.opacity=no.style.opacity=.5;
    fwDone++; if(right) fwOk++;
    if(fwDone===PKTS.length){ const s=$('#fwScore'); s.className='fb show '+(fwOk>=4?'ok':'no'); s.innerHTML=`Resultado: <b>${fwOk} de ${PKTS.length}</b> paquetes bien filtrados. ${fwOk===5?'Eres un cortafuegos impecable.':'Recuerda: gana la <b>primera</b> regla que coincide, y lo que no se permite explícitamente se bloquea.'}`; }
  };
  ok.onclick=()=>answer(true); no.onclick=()=>answer(false);
  $('#fwList').appendChild(d);
});

/* ============ TCSEC ============ */
const TC=[
  ['A1','#07351a','Diseño verificado','Funcionalmente equivalente a B3, pero el diseño y la especificación se verifican con técnicas formales.'],
  ['B3','#0d5a27','Dominios de seguridad','Permite crear listas de control de acceso por usuario o grupo, monitoriza eventos que puedan indicar una violación y la TCB es más pequeña y estructurada.'],
  ['B2','#11713a','Protección estructurada','Extiende las etiquetas de sensibilidad a todos los recursos del sistema, incluidos dispositivos, y exige detectar y auditar canales encubiertos.'],
  ['B1','#178a3d','Protección con etiquetas','Cada objeto tiene una etiqueta de sensibilidad (confidencial, secreto, alto secreto). Seguridad multinivel: un usuario solo accede a lo que su nivel permite.'],
  ['C2','#2bb673','Acceso controlado','Agrega a C1 el control de acceso a nivel de usuario individual y la auditoría de eventos. Ej.: algunas versiones seguras de UNIX; Windows NT fue evaluado en este nivel.'],
  ['C1','#5ccf93','Protección discrecional','Usuarios que cooperan y acceden a datos del mismo nivel de sensibilidad; los usuarios controlan el acceso a sus propios archivos. La mayoría de versiones de UNIX son C1.'],
  ['D','#9aa9a0','Protección mínima','Sistemas evaluados que no cumplen los requisitos de ninguna otra clase. Ej.: MS-DOS y Windows 3.1.']
];
TC.forEach(([c,col,t,x])=>{
  const b=document.createElement('button'); b.className='rung';
  b.innerHTML=`<span class="c" style="background:${col}">${c}</span><span class="d"><b>${t}</b><span class="x">${x}</span></span>`;
  b.onclick=()=>b.classList.toggle('on');
  $('#ladder').appendChild(b);
});

/* ============ Evaluación ============ */
const Q=[
  {q:'Un estudiante modifica sin permiso su nota en el sistema académico. ¿Qué tipo de violación es?',o:['Violación de confidencialidad','Violación de integridad','Robo de servicio','Denegación de servicio'],a:1,e:'Se modificaron datos sin autorización: eso afecta la integridad.',m:'m1'},
  {q:'¿Cuál de estos niveles de seguridad suele ser el más débil según el libro?',o:['Físico','Humano','Sistema operativo','Red'],a:1,e:'La ingeniería social y el phishing explotan a las personas, que suelen ser el eslabón más débil.',m:'m1'},
  {q:'Un programa imita la pantalla de inicio de sesión para robar contraseñas. ¿Qué es?',o:['Bomba lógica','Gusano','Caballo de Troya','Virus de arranque'],a:2,e:'Es el emulador de login del libro: un caballo de Troya. Se combate con una secuencia no interceptable como Ctrl+Alt+Supr.',m:'m2'},
  {q:'En un desbordamiento de pila, ¿qué busca sobrescribir el atacante?',o:['El contador de programa del kernel','La dirección de retorno de la función','La tabla de páginas','El sector de arranque'],a:1,e:'Al controlar la dirección de retorno, decide qué código se ejecuta cuando la función termina.',m:'m2'},
  {q:'Un virus que cambia su forma en cada infección para no coincidir con las firmas del antivirus es:',o:['Acorazado','Polimórfico','De ocultación','Multiparte'],a:1,e:'Los polimórficos cambian su aspecto para evadir la detección por firmas.',m:'m2'},
  {q:'¿Cuál es la diferencia principal entre un virus y un gusano?',o:['El gusano solo afecta a Windows','El virus necesita un programa huésped; el gusano se propaga solo','El gusano siempre está cifrado','No hay diferencia'],a:1,e:'El gusano usa la red para copiarse por sí mismo; el virus vive dentro de otro programa o documento.',m:'m3'},
  {q:'Un ataque de inundación SYN busca principalmente:',o:['Robar contraseñas','Llenar la tabla de conexiones medio abiertas del servidor','Descifrar el tráfico HTTPS','Instalar una puerta trasera'],a:1,e:'Es una denegación de servicio que agota los recursos reservados para conexiones TCP pendientes.',m:'m3'},
  {q:'¿Cuál es el principal problema del cifrado simétrico?',o:['Es demasiado lento','La distribución segura de la clave','No sirve para archivos grandes','Requiere dos claves'],a:1,e:'Ambas partes necesitan la misma clave, y hacerla llegar sin que la intercepten es el reto.',m:'m4'},
  {q:'Para que solo Laura pueda leer un mensaje, debo cifrarlo con:',o:['Mi clave privada','La clave privada de Laura','La clave pública de Laura','Un hash SHA-256'],a:2,e:'Lo cifrado con la clave pública de Laura solo se descifra con su clave privada.',m:'m4'},
  {q:'¿Para qué sirve el salt en el almacenamiento de contraseñas?',o:['Para cifrar la contraseña con AES','Para que contraseñas iguales produzcan hashes distintos y frustrar diccionarios precalculados','Para que la contraseña caduque','Para comprimir el archivo de contraseñas'],a:1,e:'El salt aleatorio por usuario hace que el mismo password genere hashes distintos.',m:'m5'},
  {q:'Un IDS que aprende el comportamiento normal y alerta ante desviaciones usa detección:',o:['Por firmas','De anomalías','Por tunelización','Por certificados'],a:1,e:'La detección de anomalías puede encontrar ataques nuevos, pero genera más falsos positivos.',m:'m6'},
  {q:'En el Libro Naranja, ¿qué nivel introduce las etiquetas de sensibilidad (secreto, alto secreto)?',o:['C1','C2','B1','D'],a:2,e:'B1 introduce las etiquetas y la seguridad multinivel.',m:'m7'}
];
let qs=store.get('ova-seg-quiz',{});
function renderQuiz(){
  const box=$('#quiz'); box.innerHTML='';
  Q.forEach((it,i)=>{
    const d=document.createElement('div'); d.className='q';
    d.innerHTML=`<div class="qt"><span>${String(i+1).padStart(2,'0')}</span>${it.q}</div><div class="choices"></div><div class="fb"></div>`;
    const ch=$('.choices',d), fb=$('.fb',d);
    it.o.forEach((op,j)=>{
      const b=document.createElement('button'); b.textContent=op;
      b.onclick=()=>{ qs[i]=j; store.set('ova-seg-quiz',qs); paint(); };
      ch.appendChild(b);
    });
    const paint=()=>{
      if(qs[i]===undefined) return;
      $$('button',ch).forEach((b,j)=>{ b.disabled=true; if(j===it.a) b.classList.add('right'); if(j===qs[i]&&j!==it.a) b.classList.add('wrong'); });
      const ok=qs[i]===it.a; fb.className='fb show '+(ok?'ok':'no');
      fb.innerHTML=(ok?'<b>¡Correcto!</b> ':'<b>Incorrecto.</b> ')+it.e+(ok?'':` <a href="#${it.m}">Repasa el módulo ${it.m.slice(1)}</a>.`);
      updateScore();
    };
    paint(); box.appendChild(d);
  });
  updateScore();
}
function updateScore(){
  const ans=Object.keys(qs).length, ok=Q.filter((it,i)=>qs[i]===it.a).length;
  $('#answered').textContent=ans; $('#scoreBig').textContent=ok+'/12';
  if(ans===12){
    const nota=(ok/12*5).toFixed(1);
    $('#scoreTxt').innerHTML=`Nota equivalente: <b>${nota.replace('.',',')} / 5,0</b>. ${ok>=10?'Excelente dominio del tema.':ok>=7?'Buen trabajo; repasa los módulos marcados en las preguntas falladas.':'Te recomiendo repasar los módulos indicados y volver a intentarlo.'}`;
  } else $('#scoreTxt').textContent='Responde todas para ver tu resultado.';
}
$('#quizReset').onclick=()=>{ qs={}; store.set('ova-seg-quiz',qs); renderQuiz(); };
renderQuiz();

/* Relación */
const MATCH=[
  ['Tripwire','Verifica la integridad de archivos comparando hashes'],
  ['DMZ','Zona para servidores públicos separada de la red interna'],
  ['Certificado digital','Clave pública firmada por una autoridad de confianza'],
  ['Gancho de arranque','Programa pequeño que usaba el gusano de Morris para descargar el resto'],
  ['Token de acceso','Estructura de Windows con el SID del usuario, sus grupos y privilegios'],
  ['Desafío-respuesta','Esquema de contraseñas de un solo uso']
];
const defs=MATCH.map(m=>m[1]).sort((a,b)=>a.localeCompare(b));
MATCH.forEach(([t],i)=>{
  const r=document.createElement('div'); r.className='match';
  r.innerHTML=`<span class="mt">${t}</span><select data-i="${i}" aria-label="Definición de ${t}"><option value="">— Elige la definición —</option>${defs.map(d=>`<option>${d}</option>`).join('')}</select>`;
  $('#matchBox').appendChild(r);
});
$('#matchCheck').onclick=()=>{
  let ok=0;
  $$('#matchBox select').forEach(s=>{ const right=s.value===MATCH[s.dataset.i][1]; s.classList.toggle('ok',right); s.classList.toggle('no',!right); if(right) ok++; });
  const f=$('#matchFb'); f.className='fb show '+(ok===MATCH.length?'ok':'no');
  f.innerHTML= ok===MATCH.length ? '<b>¡Todas correctas!</b> Relacionaste los 6 conceptos.' : `Tienes <b>${ok} de ${MATCH.length}</b>. Las que están en rojo aún no corresponden; cámbialas y vuelve a revisar.`;
};

/* ============ Glosario ============ */
const G=[
  ['Amenaza','Posibilidad de una violación de seguridad.'],['Ataque','Intento real de violar la seguridad.'],
  ['Autoridad de certificación (CA)','Entidad de confianza que firma certificados digitales.'],
  ['Bomba lógica','Código que causa daño solo cuando se cumple una condición.'],
  ['Caballo de Troya','Programa aparentemente legítimo que abusa de los permisos de quien lo ejecuta.'],
  ['Cifrado asimétrico','Usa una clave pública para cifrar y una privada para descifrar (ej. RSA).'],
  ['Cifrado simétrico','Usa la misma clave para cifrar y descifrar (ej. AES).'],
  ['Cortafuegos','Dispositivo o software que filtra el tráfico entre redes según reglas.'],
  ['DDoS','Denegación de servicio distribuida, lanzada desde muchos equipos a la vez.'],
  ['DMZ','Zona desmilitarizada: segmento de red para servidores públicos.'],
  ['Firma digital','Hash cifrado con la clave privada del autor; se verifica con su pública.'],
  ['Gusano','Programa que se copia a sí mismo por la red sin necesitar huésped.'],
  ['Hash','Resumen de tamaño fijo de un mensaje, resistente a colisiones.'],
  ['IDS','Sistema de detección de intrusiones.'],
  ['Ingeniería social','Engañar a personas para obtener accesos o información (ej. phishing).'],
  ['MAC','Código de autenticación de mensajes, calculado con una clave simétrica.'],
  ['Puerta trasera','Acceso oculto dejado intencionalmente por el diseñador del software.'],
  ['Salt','Valor aleatorio que se añade a la contraseña antes de calcular su hash.'],
  ['SID','Identificador de seguridad único de cada usuario o grupo en Windows.'],
  ['TCB','Base de computación confiable: todos los mecanismos que hacen cumplir la política de seguridad.'],
  ['Virus','Código que se incrusta en un programa legítimo y se autorreplica.'],
  ['Zombi','Equipo comprometido que el atacante usa para lanzar ataques sin ser rastreado.']
];

function renderGloss(){
  const q=$('#gq').value.trim().toLowerCase();
  $('#gloss').innerHTML=G.filter(([t,d])=>!q||(t+' '+d).toLowerCase().includes(q)).map(([t,d])=>`<div><b>${t}</b>${d}</div>`).join('')||'<div>No hay tÃ©rminos que coincidan.</div>';
}
$('#gq').addEventListener('input',renderGloss); renderGloss();

/* ============ Arranque ============ */
show(location.hash.slice(1)||'inicio');
