import{r as f,g as T,j as e}from"./index-L2vrCyeu.js";import{C as B,V as L,u as P,T as U,A as C}from"./react-three-fiber.esm-C0v5C9ej.js";import{s as F}from"./Star2-CXl0uTrW.js";const _=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,q=`
  varying vec2 vUv;

  uniform float uTime;
  uniform vec2 uPointer;

  float hash(vec2 p) {
    p = fract(p * vec2(123.4, 456.7));
    p += dot(p, p + 78.23);
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
    float total = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for (int i = 0; i < 6; i++) {
      total += amp * noise(p * freq);
      amp *= 0.52;
      freq *= 2.0;
    }
    return total;
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    vec2 drift = uPointer * 0.12;
    float t = uTime * 0.05;

    float cloudA = fbm(uv * 1.8 + drift + vec2(-t, t * 0.7));
    float cloudB = fbm(uv * 3.9 - drift * 0.5 + vec2(t * 0.8, -t * 0.4));
    float field = smoothstep(0.1, 0.95, cloudA + cloudB * 0.5);

    float stars = pow(max(0.0, fbm(uv * 10.0 + vec2(t * 2.2, -t * 1.3)) - 0.75), 7.0);
    float bloom = pow(stars, 0.62);

    vec3 space = vec3(0.01, 0.008, 0.035);
    vec3 violet = vec3(0.22, 0.08, 0.48);
    vec3 magenta = vec3(0.58, 0.2, 0.82);
    vec3 cyan = vec3(0.16, 0.5, 0.92);

    vec3 color = mix(space, violet, field);
    color = mix(color, magenta, cloudB * 0.38);
    color += cyan * cloudA * 0.13;
    color += vec3(1.1, 1.0, 1.6) * bloom;

    gl_FragColor = vec4(color, 1.0);
  }
`;function z({pointerRef:n}){const s=f.useMemo(()=>({uTime:{value:0},uPointer:{value:new L(0,0)}}),[]),v=f.useMemo(()=>new L(0,0),[]);return P((h,o)=>{s.uTime.value+=o,v.set(n.current.x,n.current.y),s.uPointer.value.lerp(v,.08)}),e.jsxs("mesh",{position:[0,0,-4],scale:[24,14,1],children:[e.jsx("planeGeometry",{args:[1,1]}),e.jsx("shaderMaterial",{uniforms:s,vertexShader:_,fragmentShader:q})]})}function N({pointerRef:n}){const s=f.useRef(null),v=f.useRef(null),h=f.useMemo(()=>new U().load(F),[]),{positions:o,basePositions:c,seeds:d}=f.useMemo(()=>{const r=new Float32Array(3600),u=new Float32Array(1200*3),m=new Float32Array(1200);for(let l=0;l<1200;l+=1){const a=l*3,i=2+Math.random()*3.4,t=Math.random()*Math.PI*2,p=Math.acos(2*Math.random()-1),M=i*Math.sin(p)*Math.cos(t),y=i*.6*Math.cos(p),g=i*Math.sin(p)*Math.sin(t);r[a]=M,r[a+1]=y,r[a+2]=g,u[a]=M,u[a+1]=y,u[a+2]=g,m[l]=Math.random()*Math.PI*2}return{positions:r,basePositions:u,seeds:m}},[]);return P((x,r)=>{const u=v.current;if(!u)return;const m=x.clock.getElapsedTime(),l=n.current.x*3.6,a=n.current.y*2.4;for(let i=0;i<d.length;i+=1){const t=i*3,p=d[i],M=c[t],y=c[t+1],g=c[t+2];let j=M+Math.sin(m*.5+p)*.16,A=y+Math.cos(m*.35+p*.7)*.1;const R=g+Math.sin(m*.28+p*1.4)*.14,b=l-o[t],w=a-o[t+1],S=b*b+w*w+.14,E=Math.min(.14,.36/S);j+=b*E,A+=w*E,o[t]+=(j-o[t])*(.05+r*2),o[t+1]+=(A-o[t+1])*(.05+r*2),o[t+2]+=(R-o[t+2])*(.045+r*1.8)}u.needsUpdate=!0,s.current&&(s.current.rotation.y+=r*.02)}),e.jsxs("points",{ref:s,children:[e.jsx("bufferGeometry",{children:e.jsx("bufferAttribute",{ref:v,attach:"attributes-position",args:[o,3]})}),e.jsx("pointsMaterial",{color:"#d8c4ff",map:h,alphaMap:h,size:.07,sizeAttenuation:!0,transparent:!0,alphaTest:.08,depthWrite:!1,opacity:.88,blending:C})]})}function V({pointerRef:n}){return e.jsxs(e.Fragment,{children:[e.jsx("fog",{attach:"fog",args:["#04030a",4,20]}),e.jsx("ambientLight",{intensity:.22}),e.jsx("directionalLight",{position:[2.5,3.5,2.8],intensity:.5,color:"#d5b8ff"}),e.jsx(z,{pointerRef:n}),e.jsx(N,{pointerRef:n})]})}function Y(){const n=f.useRef({x:0,y:0}),s=f.useRef({});return f.useEffect(()=>{s.current.x=T.quickTo(n.current,"x",{duration:.48,ease:"power3.out"}),s.current.y=T.quickTo(n.current,"y",{duration:.48,ease:"power3.out"});const v=(c,d)=>{var l,a,i,t;const x=Math.max(window.innerWidth,1),r=Math.max(window.innerHeight,1),u=c/x*2-1,m=-(d/r*2-1);(a=(l=s.current).x)==null||a.call(l,u),(t=(i=s.current).y)==null||t.call(i,m)},h=c=>v(c.clientX,c.clientY),o=c=>{const d=c.touches[0];d&&v(d.clientX,d.clientY)};return window.addEventListener("mousemove",h,{passive:!0}),window.addEventListener("touchmove",o,{passive:!0}),()=>{window.removeEventListener("mousemove",h),window.removeEventListener("touchmove",o)}},[]),e.jsx("div",{className:"fixed inset-0 z-0 pointer-events-none",children:e.jsx(B,{dpr:[1,1.5],gl:{antialias:!0,alpha:!0,powerPreference:"high-performance"},camera:{position:[0,.55,6],fov:42,near:.1,far:50},children:e.jsx(V,{pointerRef:n})})})}export{Y as GlobalCosmicBackdrop};
