// app/start/page.tsx (สำหรับ App Router)
// หรือ pages/start.tsx (สำหรับ Pages Router)
'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { useRouter } from 'next/navigation'; // สำหรับ Next.js App Router
// หากใช้ Pages Router ให้ใช้: import { useRouter } from 'next/router';

const StartPage3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // ประกาศตัวแปร Three.js ที่ scope นอก useEffect เพื่อให้เข้าถึงได้ใน cleanup
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let controls: OrbitControls | null = null;
  let composer: EffectComposer | null = null; // เพิ่ม composer
  let mainGroup: THREE.Group | null = null; // โมเดลหลัก

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize Three.js components
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a192f); // Dark Blue background
    scene.fog = new THREE.FogExp2(0x0a192f, 0.08); // ปรับหมอกให้จางลงเล็กน้อยและไกลขึ้น

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 4); // ถอยกล้องออกไปอีกเล็กน้อย
    camera.lookAt(0, 0, 0); // ให้กล้องมองตรงไปที่จุดศูนย์กลาง

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // สำคัญสำหรับ 4K
    renderer.toneMapping = THREE.ACESFilmicToneMapping; // เพิ่ม Tone Mapping เพื่อภาพที่สมจริงขึ้น
    renderer.toneMappingExposure = 1.5; // ปรับความสว่างของ Tone Mapping ให้สว่างขึ้น
    mountRef.current.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.3)); // แสงโดยรอบ
    scene.add(new THREE.HemisphereLight(0x0000ff, 0x000000, 0.2)); // แสงซอฟต์จากฟ้า

    // Directional lights
    const directional1 = new THREE.DirectionalLight(0xADD8E6, 0.7); // Light Blue
    directional1.position.set(5, 5, 5);
    scene.add(directional1);

    const directional2 = new THREE.DirectionalLight(0x87CEEB, 0.3); // Sky Blue
    directional2.position.set(-5, -5, -5);
    scene.add(directional2);

    // Point Light (Accent Light - simulating glow from within)
    const pointLight = new THREE.PointLight(0x00FFFF, 2.5, 50); // Cyan glow, เพิ่มความเข้ม
    pointLight.position.set(0, 0.5, 0); // วางใกล้ศูนย์กลางโมเดล
    scene.add(pointLight);

    // SpotLight เพื่อสร้างไฮไลท์ที่คมชัด
    const spotLight = new THREE.SpotLight(0x00BFFF, 2.0, 10, Math.PI * 0.25, 0.6, 1); // Deep Sky Blue, ปรับมุมและ penumbra
    spotLight.position.set(3, 3, 3); // ขยับตำแหน่ง SpotLight
    spotLight.target.position.set(0, 0, 0);
    scene.add(spotLight);
    scene.add(spotLight.target);

    // *** เพิ่ม PointLight อีก 2 ดวงเพื่อเพิ่มมิติของแสง ***
    const accentLight1 = new THREE.PointLight(0xEE82EE, 1.0, 30); // Violet
    accentLight1.position.set(-2, 1, 2);
    scene.add(accentLight1);

    const accentLight2 = new THREE.PointLight(0x40E0D0, 1.0, 30); // Turquoise
    accentLight2.position.set(2, -1, -2);
    scene.add(accentLight2);


    // Post-processing (Bloom Effect)
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.8, // strength: เพิ่มความเข้มของ Bloom
      0.8, // radius: เพิ่มรัศมีของ Bloom
      0.8 // threshold: ปรับ threshold ให้วัตถุที่สว่างขึ้นเรืองแสง
    );
    composer.addPass(bloomPass);

    // Stars (Background elements)
    const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const starGroup = new THREE.Group(); // Group for stars to animate them together
    for (let i = 0; i < 500; i++) { // เพิ่มจำนวนดาวเป็น 500
      const star = new THREE.Mesh(new THREE.SphereGeometry(0.01 + Math.random() * 0.02, 6, 6), starMaterial); // ขนาดดาวหลากหลายขึ้น
      star.position.set(
        (Math.random() - 0.5) * 80, // ขยายขอบเขตดาว
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 80
      );
      star.userData.speed = Math.random() * 0.05 + 0.01; // Individual speed for Z movement
      starGroup.add(star);
    }
    scene.add(starGroup);


    // --- Core 3D Model ---
    mainGroup = new THREE.Group();

    // Core Sphere (Inner Water Body / Crystal)
    const coreGeometry = new THREE.SphereGeometry(0.8, 64, 64);
    const coreMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00BFFF, // Deep Sky Blue
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.99, // เกือบโปร่งใสสมบูรณ์
      ior: 1.33, // Water IOR
      thickness: 0.3, // เพิ่มความหนา
      transparent: true,
      opacity: 0.95, // เพิ่ม opacity เล็กน้อยเพื่อให้มีเนื้อ
      clearcoat: 1,
      clearcoatRoughness: 0.005, // เคลือบเงาให้เรียบเนียนยิ่งขึ้น
      emissive: 0x00BFFF, // Subtle glow
      emissiveIntensity: 0.25, // เพิ่ม glow
    });
    const coreSphere = new THREE.Mesh(coreGeometry, coreMaterial);
    mainGroup.add(coreSphere);

    // Flowing Torus Knots (representing energy flow)
    const knotMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x4169E1, // Royal Blue
      metalness: 0.6, // เพิ่มความเป็นโลหะ
      roughness: 0.2, // ลดความหยาบ
      transmission: 0.95, // เพิ่ม transmission
      ior: 1.33,
      thickness: 0.15, // เพิ่มความหนาเล็กน้อย
      transparent: true,
      opacity: 0.8, // เพิ่ม opacity
      clearcoat: 0.9,
      clearcoatRoughness: 0.05,
      emissive: 0x4169E1,
      emissiveIntensity: 0.3, // เพิ่ม glow
    });

    const knot1 = new THREE.Mesh(new THREE.TorusKnotGeometry(0.7, 0.1, 120, 32), knotMaterial); // เพิ่ม segments
    knot1.rotation.x = Math.PI / 2;
    knot1.position.y = 0.2;
    mainGroup.add(knot1);

    const knot2 = new THREE.Mesh(new THREE.TorusKnotGeometry(0.9, 0.08, 120, 32), knotMaterial); // เพิ่ม segments
    knot2.rotation.set(Math.PI / 2, Math.PI / 4, 0);
    knot2.position.y = -0.2;
    mainGroup.add(knot2);

    const knot3 = new THREE.Mesh(new THREE.TorusKnotGeometry(0.5, 0.06, 80, 16), knotMaterial); // Knot 3
    knot3.rotation.set(Math.PI / 3, Math.PI / 6, Math.PI / 9);
    knot3.position.set(0.5, 0.5, 0.5);
    mainGroup.add(knot3);

    // Crystal structure (Dodecahedron)
    const dodecahedronGeometry = new THREE.DodecahedronGeometry(1.2, 0); // ขนาดใหญ่ขึ้นเล็กน้อย
    const dodecahedronMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00FFFF, // Cyan
      transmission: 0.9,
      ior: 1.6, // Glass-like
      transparent: true,
      opacity: 0.4, // โปร่งใสมาก
      clearcoat: 1,
      clearcoatRoughness: 0.01,
      emissive: 0x00FFFF,
      emissiveIntensity: 0.1,
    });
    const dodecahedron = new THREE.Mesh(dodecahedronGeometry, dodecahedronMaterial);
    mainGroup.add(dodecahedron);


    // Floating Shards/Fragments (Abstract Crystal/Water Particles)
    const shardMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x87CEEB, // Sky Blue
      transmission: 0.99, // Very transparent
      ior: 1.5, // More glass-like
      transparent: true,
      opacity: 0.8, // เพิ่ม opacity
      clearcoat: 1,
      clearcoatRoughness: 0.005, // เรียบเนียนยิ่งขึ้น
      emissive: 0x87CEEB,
      emissiveIntensity: 0.4, // More noticeable glow for shards
    });

    // Add multiple shards with varied positions and sizes
    for (let i = 0; i < 30; i++) { // เพิ่มจำนวน shards เป็น 30 ชิ้น
      const geo = new THREE.IcosahedronGeometry(0.05 + Math.random() * 0.15, 1); // ปรับขนาดให้เล็กลงและหลากหลายขึ้น
      const shard = new THREE.Mesh(geo, shardMaterial);
      shard.position.set(
        (Math.random() - 0.5) * 6, // ขยายขอบเขตการลอย
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6
      );
      shard.userData.rotationSpeed = Math.random() * 0.01 + 0.005; // Individual rotation speed
      shard.userData.offset = Math.random() * Math.PI * 2; // For bobbing animation
      mainGroup.add(shard);
    }

    scene.add(mainGroup);

    // Controls (หมุนอัตโนมัติเท่านั้น)
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = false; // ปิดการหมุนด้วยเมาส์
    controls.enablePan = false;   // ปิดการแพนด้วยเมาส์
    controls.enableZoom = false;  // ปิดการซูมด้วยเมาส์
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.7; // เพิ่มความเร็วในการหมุนอัตโนมัติเล็กน้อย

    // Event Listener for resize
    const onResize = () => {
      if (camera && renderer && composer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', onResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      if (mainGroup) {
        mainGroup.rotation.y += 0.005;
        mainGroup.rotation.x += 0.001;

        // Animate individual shards and other children
        mainGroup.children.forEach(child => {
          if (child instanceof THREE.Mesh) {
            // Animate only objects that have userData.rotationSpeed (shards)
            if (child.userData.rotationSpeed) {
                child.rotation.y += child.userData.rotationSpeed;
                child.rotation.x += child.userData.rotationSpeed / 2;
                child.position.y += Math.sin(Date.now() * 0.0015 + child.userData.offset) * 0.008; // ปรับความเร็วและระยะ bobbing
            }
            // Animate dodecahedron separately
            if (child === dodecahedron) {
                child.rotation.y += 0.002;
                child.rotation.z += 0.001;
            }
          }
        });
      }
      
      // Animate stars in the background
    if (starGroup) {
  starGroup.children.forEach(star => {
    if (star instanceof THREE.Mesh && star.userData.speed) {
      star.position.z += star.userData.speed; // Move stars towards camera 
      if (camera && star.position.z > camera.position.z) { // Reset if too close
        star.position.z = (Math.random() - 0.5) * 80;
      }
    }
  });
}

      // Camera bobbing motion
      if (camera) {
        camera.position.y = Math.sin(Date.now() * 0.0005) * 0.05; // Subtle up/down movement
      }

      if (controls) {
        controls.update();
      }
      
      if (composer) { // ใช้ composer.render() แทน renderer.render()
        composer.render();
      }
    };

    animate();

    // Cleanup function when component unmounts
    return () => {
      window.removeEventListener('resize', onResize);
      if (mountRef.current && renderer) {
        mountRef.current.removeChild(renderer.domElement);
        renderer.dispose();
      }
      // ปล่อยทรัพยากรของ composer
      if (composer) {
        composer.passes.forEach(pass => pass.dispose && pass.dispose());
        composer = null;
      }
      scene?.clear();
      scene = null;
      camera = null;
      renderer = null;
      controls = null;
      mainGroup = null;
    };
  }, []); // Empty dependency array means this effect runs once on mount

  const handleEnterWebsite = () => {
    router.push('/homeweb/Home');
  };

  const handleGoToAdmin = () => {
    router.push('/admin/login');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden text-white font-sans">
      {/* Main 3D Container */}
      <div ref={mountRef} className="absolute inset-0 z-10" />

      {/* Overlay UI */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center p-4">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-shadow-glow" style={{ textShadow: '0 0 10px #00BFFF, 0 0 20px #00FFFF' }}>
          AquaFlow
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl">
          ระบบจัดการและติดตามนํ้า เพื่ออนาคตที่ยั่งยืน
        </p>
        <div className="backdrop-blur-sm bg-black/30 px-10 py-6 rounded-xl shadow-lg space-y-4 md:space-y-0 md:space-x-6 flex flex-col md:flex-row">
          <button
            onClick={handleEnterWebsite}
            className="px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xl font-bold rounded-full shadow-glow transform hover:scale-110 transition-all duration-300"
          >
            เข้าสู่เว็บไซต์
          </button>
          <button
            onClick={handleGoToAdmin}
            className="px-10 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xl font-bold rounded-full shadow-lg transform hover:scale-110 transition-all duration-300"
          >
            ไปหน้า Admin
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartPage3D;
