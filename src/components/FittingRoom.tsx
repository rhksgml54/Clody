import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { PageData, ClothingItem } from '../types';

interface FittingRoomProps {
  pageData: PageData;
}

// Publicly available GLB models for demonstration purposes
const AVATAR_MALE_URL = 'https://models.readyplayer.me/6580556952771964df453240.glb';
const AVATAR_FEMALE_URL = 'https://models.readyplayer.me/669e75af809a135a29813c2c.glb';
const MODELS_URL = {
    short_sleeve_top: 'https://cdn.jsdelivr.net/gh/sun-s-world/3d-assets@main/short_sleeve_top.glb',
    long_sleeve_top: 'https://cdn.jsdelivr.net/gh/sun-s-world/3d-assets@main/long_sleeve_top.glb',
    sweatshirt_knit: 'https://cdn.jsdelivr.net/gh/sun-s-world/3d-assets@main/long_sleeve_top.glb',
    light_outerwear: 'https://cdn.jsdelivr.net/gh/sun-s-world/3d-assets@main/light_outerwear.glb',
    coat: 'https://cdn.jsdelivr.net/gh/sun-s-world/3d-assets@main/light_outerwear.glb',
    puffer: 'https://cdn.jsdelivr.net/gh/sun-s-world/3d-assets@main/light_outerwear.glb',
    long_pants: 'https://cdn.jsdelivr.net/gh/sun-s-world/3d-assets@main/long_pants.glb',
    shorts: 'https://cdn.jsdelivr.net/gh/sun-s-world/3d-assets@main/shorts.glb',
    skirt: 'https://cdn.jsdelivr.net/gh/sun-s-world/3d-assets@main/skirt.glb',
    dress: 'https://cdn.jsdelivr.net/gh/sun-s-world/3d-assets@main/dress.glb'
};

export const FittingRoom: React.FC<FittingRoomProps> = ({ pageData }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;
    
    // --- Scene, Camera, Renderer ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827); // bg-gray-900

    const camera = new THREE.PerspectiveCamera(50, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.2, 2.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // FIX: `outputEncoding` and `THREE.sRGBEncoding` are deprecated.
    // Use `outputColorSpace` and `THREE.SRGBColorSpace` for color space management.
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    currentMount.appendChild(renderer.domElement);
    
    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
    scene.add(hemisphereLight);

    // --- Controls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 1.9;
    controls.minPolarAngle = Math.PI / 2.5;
    controls.minDistance = 2;
    controls.maxDistance = 4;
    
    // --- Loaders ---
    const gltfLoader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous'); // Fix for CORS issue with external images

    // --- Load Avatar ---
    const avatarUrl = pageData.profile?.gender === 'male' ? AVATAR_MALE_URL : AVATAR_FEMALE_URL;
    gltfLoader.load(avatarUrl, (gltf) => {
        const avatar = gltf.scene;
        avatar.position.y = 0;

        // Scale based on height
        const baseHeight = 1.75; // meters
        const userHeight = (pageData.profile?.height || 165) / 100; // cm to meters
        const scale = userHeight / baseHeight;
        avatar.scale.set(scale, scale, scale);

        scene.add(avatar);
        
        // --- Load Clothes ---
        const recommendedItems = Object.values(pageData.recommendation).filter(item => item !== null) as ClothingItem[];
        recommendedItems.forEach(item => {
            const modelUrl = MODELS_URL[item.category as keyof typeof MODELS_URL];
            if(!modelUrl) return;

            gltfLoader.load(modelUrl, (clothGltf) => {
                const clothing = clothGltf.scene;
                
                // Apply texture
                textureLoader.load(item.image_path, (texture) => {
                    // FIX: `encoding` and `THREE.sRGBEncoding` are deprecated.
                    // Use `colorSpace` and `THREE.SRGBColorSpace` for color space management.
                    texture.colorSpace = THREE.SRGBColorSpace;
                    texture.flipY = false; 
                    
                    clothing.traverse((child) => {
                        if ((child as THREE.Mesh).isMesh) {
                            const mesh = child as THREE.Mesh;
                            const material = mesh.material as THREE.MeshStandardMaterial;
                            material.map = texture;
                            material.needsUpdate = true;
                        }
                    });
                });
                
                // Position and add to avatar
                clothing.scale.set(scale, scale, scale);
                avatar.add(clothing); // Add clothing as a child of the avatar
            });
        });
    });

    // --- Animation Loop ---
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // --- Handle Resize ---
    const handleResize = () => {
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // --- Cleanup ---
    return () => {
      window.removeEventListener('resize', handleResize);
      currentMount.removeChild(renderer.domElement);
      renderer.dispose();
      // Dispose geometries and materials if necessary
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageData]);

  return <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />;
};
