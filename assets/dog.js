/* Good Kamma — a dog runs along the header line, stops for a look, then runs on.
   Hover a nav link and it runs over to look at it; hover the headline while it's away and it comes back. */
(function start(){
  if(document.readyState!=='complete'){addEventListener('load',start,{once:true});return}  // wait so the sprite never delays the page
  var header=document.querySelector('header');if(!header)return;
  var track=document.createElement('div');track.className='dog-track';track.setAttribute('aria-hidden','true');
  var dog=document.createElement('div');dog.className='dog';track.appendChild(dog);header.appendChild(track);

  var CW=68,ANCHOR=35,HALF=22,FPS=14,SPEED=200,STEP=SPEED/FPS; // cell width, body centre within cell, half body width (CSS px), frames/s, px/s
  var START=[0,0,0,.15,.3,.45,.6,.75,.85,.95,1,1];          // frames 0-11: face us, turn side-on, pick up speed
  var LOOP=[12,13,14,15,16,17,18,19],CYCLE=LOOP.length*STEP; // seamless gallop; 11 and 19 both flow into 20
  var ENDS={front:[1,1,1,.95,.85,.7,.5,.35,.2,.08,0,0],     // frames 20-31: slow down, turn to face us
            look:[1,.95,.85,.7,.55,.4,.25,.1,0]};           // frames 20-27 then 2: slow down, stand side-on looking ahead
  var END_FRAMES={front:range(20,12),look:range(20,8).concat(2)};

  var W,gapX,x,dir=1,mode,seq,step,frame,hold=0,goal,acc=0,last=0,leaveTimer;
  function dist(v){return v.reduce(function(a,b){return a+b},0)*STEP}
  function range(a,n){var r=[];for(var i=0;i<n;i++)r.push(a+i);return r}
  function measure(){
    W=track.offsetWidth;
    var b=header.querySelector('.brand'),n=header.querySelector('nav'),h=track.getBoundingClientRect();
    gapX=b&&n?(b.getBoundingClientRect().right+n.getBoundingClientRect().left)/2-h.left:W/2;
  }
  function show(){
    dog.style.backgroundPosition=(-frame*CW)+'px 0';
    dog.style.transform='translateX('+(x-ANCHOR)+'px) scaleX('+dir+')';
  }

  // Goals: where to go, how to stand on arrival ('front', 'look', or null = keep running off-screen); rush = sprint there
  function gapGoal(){return{x:gapX,end:'front',hold:2.5+Math.random()*1.5,after:function(){go(exitGoal())}}}
  function exitGoal(){return{x:dir>0?W+CW+20:-CW-20,end:null}}
  function enter(side,g){x=side<0?-CW:W+CW;dir=-side;goal=g||gapGoal();mode='loop';step=-1}
  function go(g){goal=g;if(mode==='rest')depart();else if(mode==='away')enter(-1,g)}

  function play(frames,v,brake,then){mode='seq';seq={f:frames,v:v,b:brake,then:then};step=-1}
  function rest(){mode='rest';hold=goal.hold||0}
  function finish(brake){
    var g=goal;
    play(END_FRAMES[goal.end],ENDS[goal.end],brake,function(){if(goal===g)settle();else depart()});
  }
  function settle(){                                  // arrived: turn round if the thing to look at is behind
    var g=goal;
    if(g.face&&g.face!==dir)play([29,30,31],[0,0,0],1,function(){dir=g.face;play([0,1,2],[0,0,0],1,rest)});
    else rest();
  }
  function depart(){
    var d=goal.x-x,nd=d>=0?1:-1,side=frame>=2&&frame<=28;
    if(goal.end&&Math.abs(d)<6){settle();return}
    if(side&&nd!==dir){play([29,30,31],[0,0,0],1,depart);return}  // turn to face us, then set off the other way
    dir=nd;
    var from=side?2:0,v=START.slice(from),sd=dist(v),ed=goal.end?dist(ENDS[goal.end]):0,g=goal;
    if(goal.end&&Math.abs(d)<=sd+ed+CYCLE/2){        // short hop: speed up straight into slowing down
      var b=Math.abs(d)/(sd+ed);
      play(range(from,v.length),v,b,function(){if(goal===g)finish(b);else{mode='loop';step=-1;checkpoint()}});
    }else play(range(from,v.length),v,1,function(){mode='loop';step=-1;checkpoint()});
  }
  function checkpoint(){                              // only at the end of a gallop cycle, where frame 20 follows cleanly
    var left=(goal.x-x)*dir;
    if(left<=0){play(END_FRAMES.front,ENDS.front,.5,depart);return}  // goal is behind: pull up, turn, go back
    if(goal.end&&left<=dist(ENDS[goal.end])+CYCLE/2)finish(left/dist(ENDS[goal.end]));
  }

  function advance(){
    if(mode==='loop'){
      x+=STEP*dir;step=(step+1)%LOOP.length;frame=LOOP[step];
      if(dir>0?x>W+CW:x<-CW){mode='away';hold=3+Math.random()*4;return}
      if(step===LOOP.length-1)checkpoint();
    }else if(mode==='seq'){
      step++;
      if(step<seq.f.length){x+=seq.v[step]*seq.b*STEP*dir;frame=seq.f[step]}
      else{seq.then();if(mode==='seq'||mode==='loop')advance()}
    }
  }
  function tick(t){
    var dt=Math.min(.1,(t-last)/1000||0);last=t;
    if(mode==='rest'||mode==='away'){
      hold-=dt;
      if(hold<=0){if(mode==='away')enter(-1);else if(goal.after)goal.after()}
    }else{acc+=dt*(goal&&goal.rush?1.6:1);while(acc>=1/FPS&&mode!=='rest'&&mode!=='away'){acc-=1/FPS;advance()}}
    if(mode==='rest'||mode==='away')acc=0;
    show();requestAnimationFrame(tick);
  }

  measure();addEventListener('resize',measure);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){x=gapX;frame=31;show();return}

  // Hovering the logo or a nav link: run over and look at it. Leaving: wait a moment, then run off the way it's facing.
  var links=[].slice.call(header.querySelectorAll('.brand, nav a'));
  links.forEach(function(a){
    a.addEventListener('mouseenter',function(){
      clearTimeout(leaveTimer);
      var o=track.getBoundingClientRect().left,box=function(e){var r=e.getBoundingClientRect();return[r.left-o,r.right-o]};
      var me=box(a),c=(me[0]+me[1])/2,others=links.filter(function(l){return l!==a}).map(box);
      if(mode==='away')enter(c>W/2?1:-1,{x:0});
      // stand beside the link, preferring a spot clear of the other links, then the nearer one
      var spots=[me[0]-30,me[1]+30].filter(function(sx){return sx>HALF&&sx<W-HALF}).map(function(sx){
        var hit=others.some(function(b){return sx+HALF>b[0]&&sx-HALF<b[1]});
        return{x:sx,score:(hit?1e4:0)+Math.abs(sx-x)};
      }).sort(function(p,q){return p.score-q.score});
      var sx=spots.length?spots[0].x:me[0]-30;
      go({x:sx,end:'look',hold:Infinity,rush:true,face:sx<c?1:-1});
    });
    a.addEventListener('mouseleave',function(){
      clearTimeout(leaveTimer);
      leaveTimer=setTimeout(function(){if(goal.hold===Infinity)go(exitGoal())},1200);
    });
  });
  // Hovering the headline while the dog is off-screen calls it back.
  var h1=document.querySelector('main h1');
  if(h1)h1.addEventListener('mouseenter',function(){if(mode==='away'){var g=gapGoal();g.rush=true;enter(-1,g)}});

  enter(-1);show();requestAnimationFrame(tick);
})();
