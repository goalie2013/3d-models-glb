import React, { useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Stage, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { executeGeneratedCode } from '../utils/threeHelpers';
import { Cuboid, RotateCw, Grid3x3 } from 'lucide-react';

// Workaround for TS error: Property 'primitive' does not exist on type 'JSX.IntrinsicElements'.
const Primitive = 'primitive' as any;

interface ScenePreviewProps {
  code: string;
  onModelReady: (group: THREE.Group) => void;
}

// Helper to set background color
const SceneBackground = ({ color }: { color: string }) => {
  const { scene } = useThree();
  useEffect(() => {
    scene.background = new THREE.Color(color);
  }, [scene, color]);
  return null;
};

// Component to manage object traversal and wireframe toggle
const ModelObject = ({ group, wireframe }: { group: THREE.Group, wireframe: boolean }) => {
    useEffect(() => {
        group.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                 // Handle material array or single material
                 const materials = Array.isArray(child.material) ? child.material : [child.material];
                 materials.forEach((mat: any) => {
                     mat.wireframe = wireframe;
                     mat.needsUpdate = true;
                 });
            }
        });
    }, [group, wireframe]);

    return <Primitive object={group} />;
};

const GeneratedObject: React.FC<{ code: string; onLoaded: (obj: THREE.Group) => void; wireframe: boolean }> = ({ code, onLoaded, wireframe }) => {
  const [group, setGroup] = useState<THREE.Group | null>(null);

  useEffect(() => {
    if (!code) return;

    const generatedGroup = executeGeneratedCode(code);

    if (generatedGroup) {
      setGroup(generatedGroup);
      onLoaded(generatedGroup);

      return () => {
        generatedGroup.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach((m: THREE.Material) => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
      };
    }
  }, [code, onLoaded]);

  if (group) {
    return <ModelObject group={group} wireframe={wireframe} />;
  }
  return null;
};

const ScenePreview: React.FC<ScenePreviewProps> = ({ code, onModelReady }) => {
  const [autoRotate, setAutoRotate] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [wireframe, setWireframe] = useState(false);

  return (
    <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden relative">
       {!code && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 z-10 pointer-events-none">
            <p>Enter a prompt to generate a 3D model</p>
        </div>
       )}
       
       {/* View Controls */}
       <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-gray-900/80 backdrop-blur-md p-1.5 rounded-full border border-gray-700">
            <button 
                onClick={() => setAutoRotate(!autoRotate)}
                className={`p-2 rounded-full transition-all ${autoRotate ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                title="Toggle Auto-Rotate"
            >
                <RotateCw className="w-4 h-4" />
            </button>
            <button 
                onClick={() => setShowGrid(!showGrid)}
                className={`p-2 rounded-full transition-all ${showGrid ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                title="Toggle Grid"
            >
                <Grid3x3 className="w-4 h-4" />
            </button>
            <button 
                onClick={() => setWireframe(!wireframe)}
                className={`p-2 rounded-full transition-all ${wireframe ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                title="Toggle Wireframe"
            >
                <Cuboid className="w-4 h-4" />
            </button>
       </div>

      <Canvas 
        shadows 
        dpr={[1, 2]} 
        camera={{ position: [4, 4, 4], fov: 50 }}
        gl={{ logarithmicDepthBuffer: true }} // Fixes Z-fighting/glitching for small details
      >
        <SceneBackground color="#111" />
        <Stage environment="city" intensity={0.6} adjustCamera={true}>
             {code && <GeneratedObject code={code} onLoaded={onModelReady} wireframe={wireframe} />}
        </Stage>
        {showGrid && (
            <Grid 
                renderOrder={-1} 
                position={[0, -0.1, 0]} 
                infiniteGrid 
                cellSize={1} 
                sectionSize={3} 
                fadeDistance={30} 
                sectionColor="#4f4f4f" 
                cellColor="#2a2a2a" 
            />
        )}
        <OrbitControls autoRotate={autoRotate} makeDefault />
      </Canvas>
    </div>
  );
};

export default ScenePreview;