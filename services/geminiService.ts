import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are an expert 3D Graphics Engineer specializing in Three.js and Procedural Generation.
Your task is to write a JavaScript function that creates a 3D object based on a user's description.

**Requirements:**
1.  **Output Format:** Return ONLY raw JavaScript code. Do not wrap it in markdown blocks (e.g., no \`\`\`javascript). Do not include explanations.
2.  **Function Signature:** The code must evaluate to a function with this signature:
    \`(THREE) => { ... return group; }\`
    - It receives the \`THREE\` namespace object as an argument.
    - It must create a \`THREE.Group\`.
    - It must add all generated meshes to this group.
    - It must return the \`THREE.Group\`.
3.  **Content:**
    - Use standard Three.js geometries (BoxGeometry, SphereGeometry, CylinderGeometry, CapsuleGeometry, IcosahedronGeometry, etc.).
    - Use standard Materials (MeshStandardMaterial, MeshPhysicalMaterial).
    - Use \`vertexColors\` or hex colors.
    - **DO NOT** load external textures (no \`TextureLoader\`).
    - **DO NOT** use external models (no \`GLTFLoader\`).
    - Construct the shape procedurally. For complex shapes (like trees, buildings, cars), compose them of multiple primitives.
    - **Characters/People:** If generating a person or character, **DO NOT** create stick figures (thin lines/cylinders). Create stylized, volumetric "low-poly" characters.
        - Use \`CapsuleGeometry\` or thick \`BoxGeometry\` for limbs and torso.
        - Differentiate clothing colors from skin tone.
        - Model distinct body parts (head, torso, arms, legs, hands, feet).
    - Ensure the model is centered at (0,0,0) and sits on the XZ plane (y >= 0).
    - Scale should be roughly 1 unit = 1 meter. Keep the model within a reasonable size (e.g., 2-10 units).
4.  **Aesthetics:** Make it look "production-ready" by using nice colors, roughness, and metalness values.
5.  **Technical Best Practices:**
    - **Avoid Z-Fighting:** When placing objects on surfaces (e.g., stones on a wall, windows on a building), ALWAYS add a tiny offset (e.g., 0.005 to 0.01) to the position so faces do not perfectly overlap. This is critical for rendering quality.
    - **Segment Count:** Use appropriate segment counts for spheres and cylinders (e.g., 32) to look smooth but performant.

**Example Output:**
(THREE) => {
  const group = new THREE.Group();
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.y = 0.5;
  group.add(cube);
  return group;
}
`;

export const generate3DModelCode = async (prompt: string): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key is missing");
    }

    const ai = new GoogleGenAI({ apiKey });

    const model = 'gemini-3-pro-preview'; 
    // Using the pro model for better reasoning and coding capabilities necessary for complex 3D logic.

    const response = await ai.models.generateContent({
      model: model,
      contents: `Create a high-quality, detailed Three.js procedural generator for: ${prompt}. Ensure characters are volumetric and stylized (not stick figures).`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7, // Slightly creative but adhering to logic
        maxOutputTokens: 8192, // Allow enough space for complex code
      },
    });

    let code = response.text;

    // Cleanup: Remove markdown if the model accidentally includes it
    if (code) {
        code = code.replace(/```javascript/g, '').replace(/```js/g, '').replace(/```/g, '').trim();
        // Ensure it starts with the function definition if there's intro text (though system prompt forbids it)
        const funcStart = code.indexOf('(THREE)');
        if (funcStart > -1) {
            code = code.substring(funcStart);
        }
    }

    return code || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};