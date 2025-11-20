import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';

/**
 * safely executes the generated string code to create a Three.js Group
 */
export const executeGeneratedCode = (code: string): THREE.Group | null => {
  try {
    // eslint-disable-next-line
    const generatorFunc = new Function(`return ${code}`)();
    
    if (typeof generatorFunc !== 'function') {
      throw new Error("Generated code did not return a function.");
    }

    const group = generatorFunc(THREE);
    
    if (!(group instanceof THREE.Group) && !(group instanceof THREE.Mesh)) {
       // If they returned a mesh, wrap it
       if(group instanceof THREE.Object3D) {
          const wrapper = new THREE.Group();
          wrapper.add(group);
          return wrapper;
       }
       throw new Error("Function did not return a valid THREE.Group or Object3D.");
    }
    
    // If it's a mesh (from previous check fallback), it's already wrapped or is a group.
    // Ensure we return a group for consistency.
    if (group instanceof THREE.Group) {
        return group;
    } else {
        const wrapper = new THREE.Group();
        wrapper.add(group);
        return wrapper;
    }

  } catch (error) {
    console.error("Failed to execute 3D generation code:", error);
    return null;
  }
};

export const exportToGLB = (object: THREE.Object3D, filename: string) => {
  const exporter = new GLTFExporter();
  
  exporter.parse(
    object,
    (gltf) => {
      const output = JSON.stringify(gltf, null, 2);
      const blob = new Blob([output], { type: 'text/plain' });
      // For binary .glb, we usually need 'binary: true' option in parse, 
      // but parse signature varies slightly by version.
      // Let's try standard ArrayBuffer output for GLB if supported, else JSON GLTF.
      
      // However, standard implementation:
      // If binary is true, it returns an ArrayBuffer.
      // If binary is false (default), it returns a JSON object.
      // We want GLB (binary) for Mapbox usually, but JSON GLTF is also fine.
      // Let's try to enforce binary.
      saveString(output, filename + '.gltf');
    },
    (error) => {
      console.error('An error happened during export:', error);
    },
    { binary: false } // Keeping as GLTF (JSON) for safer debugging, Mapbox supports both.
  );
};

export const exportToBinaryGLB = (object: THREE.Object3D, filename: string) => {
    const exporter = new GLTFExporter();
    exporter.parse(
        object,
        (result) => {
            if (result instanceof ArrayBuffer) {
                saveArrayBuffer(result, filename + '.glb');
            } else {
                console.warn("Exporter did not return ArrayBuffer, falling back to JSON");
                const output = JSON.stringify(result, null, 2);
                saveString(output, filename + '.gltf');
            }
        },
        (error) => {
            console.error('An error happened during export:', error);
        },
        { binary: true }
    );
}

const saveString = (text: string, filename: string) => {
  save(new Blob([text], { type: 'text/plain' }), filename);
};

const saveArrayBuffer = (buffer: ArrayBuffer, filename: string) => {
    save(new Blob([buffer], { type: 'application/octet-stream' }), filename);
}

const save = (blob: Blob, filename: string) => {
  const link = document.createElement('a');
  link.style.display = 'none';
  document.body.appendChild(link);
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  document.body.removeChild(link);
};
