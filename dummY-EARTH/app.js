import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- 1. Scene Setup ---
const container = document.getElementById('earth-canvas-container');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 0, 3.8); 

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// --- 2. Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.enableZoom = false;
controls.minPolarAngle = Math.PI / 2; 
controls.maxPolarAngle = Math.PI / 2;

// --- 3. Textures & Shaders ---
const textureLoader = new THREE.TextureLoader();
const dayTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg');
const nightTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_lights_2048.png');

const earthShader = {
    uniforms: {
        dayTexture: { value: dayTexture },
        nightTexture: { value: nightTexture },
        sunDirection: { value: new THREE.Vector3(1, 0.2, 0).normalize() } 
    },
    vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D dayTexture;
        uniform sampler2D nightTexture;
        uniform vec3 sunDirection;
        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
            vec3 dayColor = texture2D(dayTexture, vUv).rgb;
            vec3 lightMap = texture2D(nightTexture, vUv).rgb;
            
            vec3 ambientNight = dayColor * vec3(0.02, 0.04, 0.12); 
            vec3 sharpLights = pow(lightMap, vec3(3.0));
            vec3 cityLights = sharpLights * vec3(1.0, 0.85, 0.5) * 8.0; 
            vec3 nightColor = ambientNight + cityLights;
            
            float intensity = dot(normalize(vNormal), sunDirection);
            float mixFactor = smoothstep(-0.2, 0.2, intensity); 
            
            vec3 finalColor = mix(nightColor, dayColor, mixFactor);
            gl_FragColor = vec4(finalColor, 1.0);
        }
    `
};

const earthMaterial = new THREE.ShaderMaterial(earthShader);
const radius = 1;
const segments = 64;
const geometry = new THREE.SphereGeometry(radius, segments, segments);
const earth = new THREE.Mesh(geometry, earthMaterial);
earth.rotation.z = 16 * Math.PI / 180; 
scene.add(earth);

// --- 4. Atmospheric Glow ---
const atmosphereMaterial = new THREE.ShaderMaterial({
    vertexShader: `
        varying vec3 vNormal;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec3 vNormal;
        void main() {
            float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
            gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
        }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true
});
const atmosphere = new THREE.Mesh(geometry, atmosphereMaterial);
atmosphere.scale.set(1.15, 1.15, 1.15); 
scene.add(atmosphere);

// --- 5. Custom Color Light Flares & Data ---
// Added 'clientsServed' data to feed the tooltip
const clients = [
    { name: 'New York', lat: 40.7128, lon: -74.0060, clientsServed: 142 },
    { name: 'London', lat: 51.5074, lon: -0.1278, clientsServed: 89 },
    { name: 'Jodhpur', lat: 26.2389, lon: 73.0243, clientsServed: 215 },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503, clientsServed: 64 },
    { name: 'Sydney', lat: -33.8688, lon: 151.2093, clientsServed: 38 }
];

function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));
    return new THREE.Vector3(x, y, z);
}

// Procedural gradient updated to your specific brand color (#8f1341)
function createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    
    // Core is hot white/pink, blending out into deep magenta #8f1341
    gradient.addColorStop(0, 'rgba(255, 230, 240, 1.0)');     
    gradient.addColorStop(0.15, 'rgba(143, 19, 65, 0.9)');    
    gradient.addColorStop(0.4, 'rgba(143, 19, 65, 0.4)');     
    gradient.addColorStop(1.0, 'rgba(143, 19, 65, 0.0)');     
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
}

const glowTexture = createGlowTexture();
const markerSprites = [];

clients.forEach(client => {
    const position = latLonToVector3(client.lat, client.lon, radius + 0.015);
    const spriteMaterial = new THREE.SpriteMaterial({ 
        map: glowTexture, 
        color: 0xffffff, 
        transparent: true, 
        blending: THREE.AdditiveBlending,
        depthWrite: false 
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(position);
    
    // Increased base scale to make them "a little big" as requested
    const baseScale = 0.14; 
    sprite.scale.set(baseScale, baseScale, baseScale);
    
    // Attach the actual data directly to the 3D object for the Raycaster to read
    sprite.userData = { 
        name: client.name,
        clientsServed: client.clientsServed,
        stagger: Math.random() * Math.PI * 2, 
        baseScale: baseScale 
    };

    earth.add(sprite);
    markerSprites.push(sprite);
});

// --- 6. Raycaster (Hover Interactions) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');
let isHovering = false;
let hoveredSprite = null;

// Track the mouse over the container
container.addEventListener('mousemove', (event) => {
    const rect = container.getBoundingClientRect();
    
    // Calculate normalized device coordinates (-1 to +1) for Three.js
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Move the HTML tooltip to follow the mouse
    tooltip.style.left = event.clientX + 'px';
    tooltip.style.top = event.clientY + 'px';
});

// --- 7. UI Controls ---
// --- 7. Control Panel Logic ---
const uiControls = {
    tilt: document.getElementById('axial-tilt'),
    tiltValue: document.getElementById('axial-tilt-value'),
    sun: document.getElementById('sun-position'),
    sunValue: document.getElementById('sun-position-value'),
    speed: document.getElementById('rotation-speed'),
    speedValue: document.getElementById('rotation-speed-value'),
    markers: document.getElementById('client-markers')
};

// Ensure the controls actually exist before attaching listeners
if (uiControls.tilt) {
    
    // 1. Axial Tilt: Updates the Z-rotation of the Earth
    uiControls.tilt.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        earth.rotation.z = val * Math.PI / 180;
        uiControls.tiltValue.textContent = val;
    });

    // 2. Sun Position: Updates the active material's shader uniform
    uiControls.sun.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        // We update earthMaterial directly so the shader recalculates the light
        earthMaterial.uniforms.sunDirection.value.set(-val, 0.2, 0).normalize();
        uiControls.sunValue.textContent = val;
    });

    // 3. Rotation Speed: Just updates the text label 
    // (The actual speed logic is safely inside the animate() loop)
    uiControls.speed.addEventListener('input', (e) => {
        uiControls.speedValue.textContent = e.target.value;
    });

    // 4. Client Markers Toggle: Loops through sprites and hides/shows them
    uiControls.markers.addEventListener('change', (e) => {
        markerSprites.forEach(sprite => {
            sprite.visible = e.target.checked;
        });
    });
}

// --- 8. Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    // 1. Raycast every frame to see if we are hitting a marker
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(markerSprites);

    if (intersects.length > 0 && intersects[0].object.visible) {
        // We are hovering over a marker
        isHovering = true;
        document.body.style.cursor = 'pointer'; // Change cursor to hand
        
        const currentHover = intersects[0].object;
        if (hoveredSprite !== currentHover) {
            hoveredSprite = currentHover;
            const data = hoveredSprite.userData;
            
            // Inject the data into the HTML and fade it in
            tooltip.innerHTML = `<h3>${data.name}</h3><p>${data.clientsServed} Clients Served</p>`;
            tooltip.style.opacity = 1;
        }
    } else {
        // We are NOT hovering over a marker
        isHovering = false;
        document.body.style.cursor = 'default';
        if (hoveredSprite) {
            hoveredSprite = null;
            tooltip.style.opacity = 0; // Fade out tooltip
        }
    }

    // 2. Only rotate the Earth if we are NOT hovering over a point
    if (!isHovering) {
        const currentSpeed = uiControls.speed ? parseFloat(uiControls.speed.value) : 0.2;
        earth.rotation.y += currentSpeed * 0.005; 
    }
    
    // 3. Keep the light flares pulsing
    const time = Date.now() * 0.0015;
    markerSprites.forEach(sprite => {
        const scale = sprite.userData.baseScale + Math.sin(time + sprite.userData.stagger) * 0.02;
        sprite.scale.set(scale, scale, scale);
        sprite.material.opacity = 0.6 + Math.sin(time + sprite.userData.stagger) * 0.4;
    });

    controls.update();
    renderer.render(scene, camera);
}

// Handle Window Resize
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

animate();