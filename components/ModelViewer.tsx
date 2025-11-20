import React, { useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Stage, Grid, Gltf, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { RotateCw, Grid3x3, Cuboid } from 'lucide-react';

interface ModelViewerProps {
  fileUrl: string | null;
}

const SceneBackground = ({ color }: { color: string }) => {
  const { scene } = useThree();
  useEffect(() => {
    scene.background = new THREE.Color(color);
  }, [scene, color]);
  return null;
};

const ModelViewer: React.FC<ModelViewerProps> = ({ fileUrl }) => {
  const [autoRotate, setAutoRotate] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [wireframe, setWireframe] = useState(false);

  // Reset state when file changes
  useEffect(() => {
      setAutoRotate(false);
      setWireframe(false);
  }, [fileUrl]);

  return (
    <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden relative">
      {!fileUrl && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 z-10 pointer-events-none">
            <p className="font-medium">No model loaded</p>
            <p className="text-xs opacity-70">Upload a .GLB or .GLTF file from the sidebar</p>
        </div>
      )}

       {/* View Controls (Only visible if file is loaded) */}
       {fileUrl && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-gray-900/80 backdrop-blur-md p-1.5 rounded-full border border-gray-700">
                <button 
                    onClick={() => setAutoRotate(!autoRotate)}
                    className={`p-2 rounded-full transition-all ${autoRotate ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                    title="Toggle Auto-Rotate"
                >
                    <RotateCw className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => setShowGrid(!showGrid)}
                    className={`p-2 rounded-full transition-all ${showGrid ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                    title="Toggle Grid"
                >
                    <Grid3x3 className="w-4 h-4" />
                </button>
                 {/* Wireframe support for GLTF requires traversing the loaded scene, simpler to just offer grid/rotate for imported files for now, 
                     but we can attempt wireframe via a custom component wrapping Gltf if needed. 
                     Keeping it simple for viewer for now as Gltf component is black box-ish unless we load manually.
                 */}
        </div>
       )}

      <Canvas 
        shadows 
        dpr={[1, 2]} 
        gl={{ logarithmicDepthBuffer: true }} // Fixes rendering artifacts
      >
        <PerspectiveCamera makeDefault position={[4, 4, 4]} fov={50} />
        <SceneBackground color="#111" />
        {fileUrl && (
            <Stage environment="city" intensity={0.6} adjustCamera={true}>
                <Gltf src={fileUrl} />
            </Stage>
        )}
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

export default ModelViewer;