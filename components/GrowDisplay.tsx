// components/GrowDisplay.tsx (หรือ app/components/GrowDisplay.tsx)
// อย่าลืมเพิ่ม 'use client'; ที่ด้านบนสุดของไฟล์สำหรับ App Router

'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const GrowDisplay: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [values, setValues] = useState([580, 480, 690]); // ค่าตัวเลขที่แสดงใต้ฐาน

  // ประกาศตัวแปร Three.js ที่ scope นอก useEffect เพื่อให้เข้าถึงได้ใน cleanup
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let controls: OrbitControls | null = null;
  const objects: THREE.Mesh[] = []; // เก็บ reference ของ objects 3D ทั้งหมด

  useEffect(() => {
    if (!mountRef.current) return;

    setIsMounted(true);

    const init = () => {
      // Scene
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a202c); // สีพื้นหลังเข้ม

      // Camera
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 1.5, 4); // ปรับตำแหน่งกล้องให้เห็นภาพรวม

      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // alpha: true เพื่อให้พื้นหลังโปร่งใสถ้าต้องการ
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      mountRef.current?.appendChild(renderer.domElement);

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // แสงโดยรอบ
      scene.add(ambientLight);

      const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.7); // แสงทิศทางหลัก
      directionalLight1.position.set(5, 10, 5).normalize();
      scene.add(directionalLight1);

      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4); // แสงทิศทางรอง
      directionalLight2.position.set(-5, -5, -5).normalize();
      scene.add(directionalLight2);

      // --- Create 3D Pods ---
      const podPositions = [
        { x: -1.8, y: 0, z: 0 },
        { x: 0, y: 0.5, z: -0.5 }, // ตำแหน่งกลางอยู่สูงกว่าเล็กน้อยและอยู่ด้านหลัง
        { x: 1.8, y: 0, z: 0 },
      ];

      podPositions.forEach((pos, index) => {
        // Coin Geometry (ใช้ CylinderGeometry สำหรับเหรียญ)
        const coinGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 32);
        const coinMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xFF1493, // สีชมพู/ม่วงนีออน
          metalness: 0.8,
          roughness: 0.2,
          clearcoat: 1,
          clearcoatRoughness: 0.1,
        });
        const coin = new THREE.Mesh(coinGeometry, coinMaterial);
        coin.position.set(pos.x, pos.y + 0.7, pos.z); // วางเหรียญบนฐาน
        coin.rotation.x = Math.PI / 2; // หมุนเหรียญให้ตั้งตรง
        scene?.add(coin);
        objects.push(coin);

        // Dome Geometry (ใช้ SphereGeometry สำหรับโดมใส)
        const domeGeometry = new THREE.SphereGeometry(1, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2); // ครึ่งวงกลม
        const domeMaterial = new THREE.MeshPhysicalMaterial({
          color: 0x87CEEB,        // สีฟ้าอ่อนใส
          metalness: 0,
          roughness: 0.1,
          transmission: 0.9,
          ior: 1.5,               // Index of Refraction (แก้ว)
          thickness: 0.1,
          transparent: true,
          opacity: 0.5,           // ความโปร่งใส
          clearcoat: 1,
          clearcoatRoughness: 0.1
        });
        const dome = new THREE.Mesh(domeGeometry, domeMaterial);
        dome.position.set(pos.x, pos.y + 0.5, pos.z); // วางโดมคลุมเหรียญ
        scene?.add(dome);
        objects.push(dome);

        // Pedestal Geometry (ฐานรอง)
        const pedestalGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 32);
        const pedestalMaterial = new THREE.MeshStandardMaterial({
          color: 0xFF007F, // สีชมพูเข้ม
          emissive: 0xFF007F, // เรืองแสงสีชมพู
          emissiveIntensity: 0.5, // ความเข้มของการเรืองแสง
          roughness: 0.5,
          metalness: 0.1
        });
        const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
        pedestal.position.set(pos.x, pos.y, pos.z);
        scene?.add(pedestal);
        objects.push(pedestal);
      });

      // OrbitControls (สำหรับการควบคุมกล้องด้วยเมาส์)
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.screenSpacePanning = false;
      controls.minDistance = 2;
      controls.maxDistance = 8;
      controls.maxPolarAngle = Math.PI / 2;

      // Event Listener สำหรับปรับขนาดหน้าจอ
      window.addEventListener('resize', onWindowResize, false);
    };

    const onWindowResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };

    const animate = () => {
      requestAnimationFrame(animate);

      // Animation: หมุน objects ทั้งหมดอย่างช้าๆ
      objects.forEach(obj => {
        obj.rotation.y += 0.003;
      });

      if (controls) {
        controls.update();
      }
      
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    };

    init();
    animate();

    // Cleanup function when component unmounts
    return () => {
      window.removeEventListener('resize', onWindowResize, false);
      if (mountRef.current && renderer) {
        mountRef.current.removeChild(renderer.domElement);
        renderer.dispose();
      }
      // ปล่อยทรัพยากร
      scene?.clear();
      scene = null;
      camera = null;
      renderer = null;
      controls = null;
      objects.length = 0; // Clear array
    };
  }, [isMounted]);

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 to-pink-900 text-white font-sans">
      {/* Header Section */}
      <div className="absolute top-0 left-0 w-full p-6 z-20 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Grow</h1>
        <button className="p-2 rounded-full bg-white bg-opacity-10 hover:bg-opacity-20 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        </button>
      </div>

      {/* Main 3D Container */}
      <div id="webgl-container" ref={mountRef} className="absolute inset-0 w-full h-full z-10">
        {/* Three.js canvas will be appended here */}
      </div>

      {/* Value Display Pods (Text overlays) */}
      <div className="absolute bottom-[20%] flex space-x-8 z-20">
        {values.map((value, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="bg-pink-700 bg-opacity-70 backdrop-blur-sm p-3 rounded-full text-white text-2xl font-bold mb-2 shadow-lg border border-pink-500">
              {/* Icon Placeholder - You can replace with actual coin icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-infinity"><path d="M12 12c-2-2.5-4-6-6-6s-4 1.5-6 6c2 2.5 4 6 6 6s4-1.5 6-6c-2-2.5-4-6-6-6s-4 1.5-6 6"/><path d="M12 12c2 2.5 4 6 6 6s4-1.5 6-6c-2-2.5-4-6-6-6s-4 1.5-6 6"/></svg>
            </div>
            <p className="text-4xl font-extrabold text-white text-shadow-glow" style={{ textShadow: '0 0 8px #FF007F, 0 0 15px #FF007F' }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom Text/Info (Placeholder) */}
      <div className="absolute bottom-[5%] text-center z-20">
        <p className="text-lg text-gray-300">The Rockstar <span className="text-pink-500 text-2xl font-bold">12%</span> per year</p>
      </div>
    </div>
  );
};

export default GrowDisplay;
