import{r as f,j as d,g as y}from"./index-L2vrCyeu.js";import{C as E,aQ as C,L as g,u as k,A as U,aB as b}from"./react-three-fiber.esm-C0v5C9ej.js";const A=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,j=`
  varying vec2 vUv;

  uniform sampler2D uTextMask;
  uniform sampler2D uTrail;
  uniform float uTime;
  uniform float uReveal;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 p) {
    float sum = 0.0;
    float amp = 0.55;
    float freq = 1.0;
    for (int i = 0; i < 5; i++) {
      sum += amp * noise(p * freq);
      freq *= 2.0;
      amp *= 0.5;
    }
    return sum;
  }

  vec3 nebulaColor(vec2 uv) {
    float cloudA = fbm(uv * 3.1 + vec2(-uTime * 0.05, uTime * 0.03));
    float cloudB = fbm(uv * 6.8 + vec2(uTime * 0.08, -uTime * 0.02));
    float spark = pow(max(0.0, fbm(uv * 16.0 + vec2(uTime * 0.18, uTime * 0.06)) - 0.72), 7.0);

    vec3 deep = vec3(0.05, 0.01, 0.11);
    vec3 violet = vec3(0.68, 0.24, 0.96);
    vec3 cyan = vec3(0.23, 0.56, 1.0);

    vec3 cloud = mix(deep, violet, cloudA);
    cloud += cyan * cloudB * 0.2;
    cloud += spark * vec3(1.4, 1.2, 2.0);
    return cloud;
  }

  void main() {
    float textMask = texture2D(uTextMask, vUv).a;
    float trailMask = texture2D(uTrail, vUv).r;

    float reveal = smoothstep(0.09, 0.88, trailMask * (0.35 + uReveal * 0.9));
    float alpha = textMask * reveal;

    vec3 cosmic = nebulaColor(vUv * 1.9 + vec2(-0.15, 0.08));
    gl_FragColor = vec4(cosmic, alpha);
  }
`;function F({active:l,lines:v,size:i,wandRef:x}){const[c,u,h]=f.useMemo(()=>{const o=document.createElement("canvas"),r=document.createElement("canvas"),e=new C(o),t=new C(r);return e.minFilter=g,e.magFilter=g,t.minFilter=g,t.magFilter=g,[e,t,{uTextMask:{value:e},uTrail:{value:t},uTime:{value:0},uReveal:{value:0}}]},[]),p=f.useRef({value:0});return f.useEffect(()=>{const o=y.to(p.current,{value:l?1:0,duration:l?.45:1.8,ease:l?"power3.out":"power2.out"});return()=>{o.kill()}},[l]),f.useEffect(()=>{const o=Math.min(window.devicePixelRatio||1,2),r=Math.max(1,Math.floor(i.width*o)),e=Math.max(1,Math.floor(i.height*o)),t=c.image,s=u.image;t.width=r,t.height=e,s.width=r,s.height=e;const a=t.getContext("2d"),m=s.getContext("2d");if(!a||!m)return;a.clearRect(0,0,r,e),a.save(),a.scale(o,o),a.fillStyle="#ffffff",a.textAlign="center",a.textBaseline="middle";let n=Math.max(42,Math.floor(i.height*.28));for(a.font=`700 ${n}px "Space Grotesk", sans-serif`;n>28&&!(Math.max(...v.map(S=>a.measureText(S).width))<=i.width*.96);)n-=4,a.font=`700 ${n}px "Space Grotesk", sans-serif`;const w=n*.92,R=w*v.length;let T=(i.height-R)*.5+w*.5;for(const M of v)a.fillText(M,i.width*.5,T),T+=w;a.restore(),m.fillStyle="rgba(0, 0, 0, 1)",m.fillRect(0,0,r,e),c.needsUpdate=!0,u.needsUpdate=!0},[v,i.height,i.width,c,u]),k((o,r)=>{h.uTime.value+=r,h.uReveal.value=p.current.value;const e=u.image,t=e.getContext("2d");if(!t||e.width===0||e.height===0)return;t.fillStyle="rgba(0, 0, 0, 0.035)",t.fillRect(0,0,e.width,e.height);const s=b.clamp(x.current.x,0,1)*e.width,a=b.clamp(x.current.y,0,1)*e.height,m=Math.max(30,Math.min(e.width,e.height)*.16),n=t.createRadialGradient(s,a,0,s,a,m);n.addColorStop(0,`rgba(255, 255, 255, ${l?.72:.2})`),n.addColorStop(.45,`rgba(214, 154, 255, ${l?.35:.12})`),n.addColorStop(1,"rgba(0, 0, 0, 0)"),t.globalCompositeOperation="lighter",t.fillStyle=n,t.beginPath(),t.arc(s,a,m,0,Math.PI*2),t.fill(),t.globalCompositeOperation="source-over",u.needsUpdate=!0}),d.jsxs("mesh",{children:[d.jsx("planeGeometry",{args:[2,2]}),d.jsx("shaderMaterial",{uniforms:h,vertexShader:A,fragmentShader:j,transparent:!0,depthWrite:!1,blending:U})]})}function B({active:l,lines:v,wandRef:i}){const x=f.useRef(null),[c,u]=f.useState({width:0,height:0});return f.useLayoutEffect(()=>{const h=x.current;if(!h)return;const p=()=>{const r=h.getBoundingClientRect();u({width:Math.max(1,r.width),height:Math.max(1,r.height)})};p();const o=new ResizeObserver(p);return o.observe(h),()=>o.disconnect()},[]),d.jsx("div",{ref:x,className:"absolute inset-0 pointer-events-none",children:c.width>0&&c.height>0&&d.jsx(E,{orthographic:!0,dpr:[1,1.5],gl:{alpha:!0,antialias:!0,powerPreference:"high-performance"},camera:{position:[0,0,1],zoom:1},children:d.jsx(F,{active:l,lines:v,size:c,wandRef:i})})})}export{B as CosmicTextReveal};
