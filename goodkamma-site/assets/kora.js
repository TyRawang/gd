/* Good Kamma — kora walk. She circles the line, plants seeds, and the garden grows a little every round. */
(function(){
  var track=document.querySelector('.walk-track');if(!track)return;
  var walker=track.querySelector('.walker'),bubble=walker.querySelector('.bubble'),garden=track.querySelector('.garden');
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var KEY='gk-garden',stage=0;try{stage=+localStorage.getItem(KEY)||0}catch(e){}
  var sayings=[['Small steps, every day.'],['What you plant comes back to you.'],['Good work takes its time.'],['Kindness always returns.']];
  var greet=['Tashi delek!','Blessings and good fortune'];
  var colours=['#b8483b','#d0a03c','#3f6f8e','#d58a94','#e2b13c','#8a5a8f'];
  var W,H,WW,x,dist=0,pass=0,plants=[],stopped=0,talked=false,hover=false,sayIdx=0,last=0,visible=true;

  function size(){W=track.offsetWidth;H=walker.offsetHeight;WW=walker.offsetWidth}
  function plantSVG(c,lean,flip){
    return '<svg viewBox="0 0 40 48" width="100%" height="100%" style="transform:scaleX('+flip+')">'+
    '<path class="mound" d="M12 47.5Q20 43 28 47.5" fill="none" stroke="#7a6a55" stroke-width="1.4" stroke-linecap="round"/>'+
    '<g class="grow"><g transform="rotate('+lean+' 20 47)" stroke="#2f4f3c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'+
    '<path d="M20 47C20 38 19 30 21 16" fill="none"/>'+
    '<g class="l1"><path d="M20 38C15 37 11 33 10 29C15 29 19 32 20 38Z" fill="#a9bfa6"/><path d="M20 35C25 33 29 29 30 25C25 25 21 29 20 35Z" fill="#a9bfa6"/></g>'+
    '<g class="l2"><path d="M20.5 26C16 25 13 21 12.5 18C17 18.5 20 21.5 20.5 26Z" fill="#c3d3bf"/><path d="M20.6 23C24 21 27 18 27.5 15C24 15.5 21.5 19 20.6 23Z" fill="#c3d3bf"/></g>'+
    '<ellipse class="bud" cx="21" cy="13.5" rx="2.6" ry="3.6" fill="'+c+'"/>'+
    '<g class="flower" fill="'+c+'"><circle cx="21" cy="9" r="3.4"/><circle cx="25.3" cy="12.3" r="3.4"/><circle cx="23.6" cy="17.2" r="3.4"/><circle cx="18.4" cy="17.2" r="3.4"/><circle cx="16.7" cy="12.3" r="3.4"/><circle cx="21" cy="13.6" r="2.3" fill="#f3e3b0"/></g>'+
    '</g></g></svg>';
  }
  function build(){
    garden.innerHTML='';plants=[];
    var gap=Math.max(H*.85,70),n=Math.floor((W-40)/gap);
    for(var i=0;i<n;i++){
      var fx=(i+.5+(Math.sin(i*12.9898)*43758.5453%1)*.15)/n;
      var el=document.createElement('div');el.className='plant';
      var sc=.82+((i*37)%7)/20;el.style.transform='scale('+sc+')';el.style.transformOrigin='50% 100%';
      el.innerHTML=plantSVG(colours[i%colours.length],((i*53)%11)-5,i%3?1:-1);
      garden.appendChild(el);
      var p={el:el,fx:fx,s:stage,done:false};if(stage)el.dataset.s=stage;plants.push(p);
    }
    place();
  }
  function place(){plants.forEach(function(p){p.x=p.fx*W;p.el.style.left=p.x+'px'})}
  function say(lines){bubble.innerHTML=lines[0]+(lines[1]?'<small>'+lines[1]+'</small>':'');walker.classList.add('talking')}
  function hush(){walker.classList.remove('talking')}
  function nextSaying(){var s=sayings[sayIdx%sayings.length];sayIdx++;return s}
  function dropLeaf(p){
    var leaf=document.createElement('div');leaf.className='falling-leaf';
    leaf.innerHTML='<svg viewBox="0 0 12 12"><path d="M1 11C1 5 5 1 11 1C11 7 7 11 1 11Z" fill="#a9bfa6" stroke="#2f4f3c" stroke-width="1"/></svg>';
    var sx=x+WW*.55,sy=H*.5;leaf.style.left=sx+'px';leaf.style.bottom=sy+'px';track.appendChild(leaf);
    var a=leaf.animate([{transform:'translate(0,0) rotate(0)'},{transform:'translate('+(p.x-sx-6)*.5+'px,'+sy*.55+'px) rotate(140deg)',offset:.6},{transform:'translate('+(p.x-sx-6)+'px,'+(sy-2)+'px) rotate(220deg)',opacity:.9}],{duration:1100,easing:'ease-in'});
    a.onfinish=function(){leaf.remove();grow(p)};
  }
  function grow(p){p.s=Math.min(4,p.s+1);p.el.dataset.s=p.s}
  function frame(i){walker.style.backgroundPosition=(-i*WW)+'px 0'}

  function startPass(){x=-WW;pass++;talked=false;plants.forEach(function(p){p.done=false})}
  function endPass(){stage=Math.min(4,stage+1);try{localStorage.setItem(KEY,stage)}catch(e){}startPass()}

  function tick(t){
    var dt=Math.min(.05,(t-last)/1000||0);last=t;
    if(visible){
      if(stopped>0){stopped-=dt;if(stopped<=0&&!hover)hush()}
      else if(!hover){
        var v=H*.42/1.05;x+=v*dt;dist+=v*dt;
        frame(Math.floor(dist/(H*.42/7))%7);
        var stopAt=W*(W<640?.5:.58);
        if(!talked&&x+WW/2>=stopAt){talked=true;stopped=3.4;frame(0);say(pass===1?greet:nextSaying())}
        plants.forEach(function(p){
          if(!p.done&&x+WW*.45>=p.x){p.done=true;if(p.s===0)dropLeaf(p);else if(p.s<4)setTimeout(function(){grow(p)},300)}
        });
        if(x>W+10)endPass();
      }
      walker.style.transform='translateX('+x+'px)';
    }
    requestAnimationFrame(tick);
  }

  walker.addEventListener('mouseenter',function(){hover=true;frame(0);say(nextSaying())});
  walker.addEventListener('mouseleave',function(){hover=false;stopped=.6});
  walker.addEventListener('click',function(){stopped=3;frame(0);say(nextSaying())});
  addEventListener('resize',function(){var ow=W;size();if(Math.abs(ow-W)>120)build();else place()});
  if('IntersectionObserver' in window)new IntersectionObserver(function(e){visible=e[0].isIntersecting}).observe(track);

  size();
  if(reduce){stage=4;build();x=W*.72;frame(0);walker.style.transform='translateX('+x+'px)';return}
  build();startPass();requestAnimationFrame(tick);
})();
