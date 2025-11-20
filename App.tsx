import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Terminal, Download, Box, Code, Sparkles, Loader2, History, Eye, Cuboid, Upload, Trash2, Square } from 'lucide-react';
import { generate3DModelCode } from './services/geminiService';
import ScenePreview from './components/ScenePreview';
import ModelViewer from './components/ModelViewer';
import { exportToBinaryGLB } from './utils/threeHelpers';
import { GenerationStatus, HistoryItem } from './types';

const SUGGESTIONS = [
  "A futuristic cyberpunk skyscraper with neon lights",
  "A low-poly pine tree with snow on top",
  "A modern geometric coffee table",
  "A red sci-fi drone with 4 rotors",
  "A stone castle tower with a flag"
];

const App: React.FC = () => {
  // Mode State
  const [mode, setMode] = useState<'generator' | 'viewer'>('generator');

  // Generator State
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [currentModel, setCurrentModel] = useState<THREE.Group | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showCode, setShowCode] = useState(false);
  
  // Abort Controller to handle Stop
  const abortControllerRef = useRef<AbortController | null>(null);

  // Viewer State
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // Cleanup object URL on unmount or change
  useEffect(() => {
    return () => {
      if (uploadedFileUrl) {
        URL.revokeObjectURL(uploadedFileUrl);
      }
    };
  }, [uploadedFileUrl]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    // Cancel previous request if active
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setStatus(GenerationStatus.GENERATING);
    setGeneratedCode(''); // Clear previous
    setCurrentModel(null);

    try {
      // Note: We pass the signal logic implicitly by checking aborted status after await
      const code = await generate3DModelCode(prompt);
      
      if (controller.signal.aborted) {
          return;
      }

      setGeneratedCode(code);
      setStatus(GenerationStatus.SUCCESS);
      
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        prompt: prompt,
        code: code,
        createdAt: Date.now()
      };
      setHistory(prev => [newItem, ...prev]);

    } catch (error) {
      if (controller.signal.aborted) {
          return;
      }
      console.error(error);
      setStatus(GenerationStatus.ERROR);
    } finally {
        if (abortControllerRef.current === controller) {
            abortControllerRef.current = null;
        }
    }
  };

  const handleStop = () => {
      if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
          setStatus(GenerationStatus.IDLE);
      }
  };

  const handleDownload = () => {
    if (currentModel) {
        // Sanitize filename
        const filename = prompt.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 20) || 'model';
        exportToBinaryGLB(currentModel, filename);
    }
  };

  const loadHistory = (item: HistoryItem) => {
      setPrompt(item.prompt);
      setGeneratedCode(item.code);
      setStatus(GenerationStatus.SUCCESS);
      setMode('generator');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (uploadedFileUrl) URL.revokeObjectURL(uploadedFileUrl);
        const url = URL.createObjectURL(file);
        setUploadedFileUrl(url);
        setUploadedFileName(file.name);
    }
  };

  const clearUploadedFile = () => {
      if (uploadedFileUrl) URL.revokeObjectURL(uploadedFileUrl);
      setUploadedFileUrl(null);
      setUploadedFileName('');
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-96 flex flex-col border-r border-gray-800 bg-gray-950/50 backdrop-blur-md z-10">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-2">
             <Box className="w-6 h-6 text-blue-500" />
             <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
               Gen3D
             </h1>
          </div>
          <p className="text-xs text-gray-500">Mapbox-ready GLB Generator</p>
        </div>

        {/* Mode Toggle */}
        <div className="p-4 grid grid-cols-2 gap-2 border-b border-gray-800 bg-gray-950/30">
            <button 
                onClick={() => setMode('generator')}
                className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${mode === 'generator' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
            >
                <Cuboid className="w-3.5 h-3.5" /> Generator
            </button>
            <button 
                onClick={() => setMode('viewer')}
                className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${mode === 'viewer' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
            >
                <Eye className="w-3.5 h-3.5" /> Viewer
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {mode === 'generator' ? (
            <>
              {/* Input Section */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">Prompt</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none h-32 transition-all placeholder-gray-600"
                  placeholder="Describe a 3D object..."
                />
                
                {status === GenerationStatus.GENERATING ? (
                    <button
                        onClick={handleStop}
                        className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all bg-red-900/30 text-red-400 border border-red-900/50 hover:bg-red-900/50 hover:text-red-300"
                    >
                        <Square className="w-4 h-4 fill-current" />
                        Stop Generation
                    </button>
                ) : (
                    <button
                        onClick={handleGenerate}
                        disabled={!prompt.trim()}
                        className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                             !prompt.trim()
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                        }`}
                    >
                        <Sparkles className="w-4 h-4" />
                        Generate Model
                    </button>
                )}
              </div>

              {/* Suggestions */}
              <div className="space-y-2">
                 <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Suggestions</p>
                 <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map(s => (
                        <button 
                            key={s}
                            onClick={() => setPrompt(s)}
                            className="text-xs bg-gray-900 hover:bg-gray-800 text-gray-400 px-3 py-1.5 rounded-full border border-gray-800 transition-colors text-left"
                        >
                            {s}
                        </button>
                    ))}
                 </div>
              </div>

              {/* History */}
              {history.length > 0 && (
                  <div className="space-y-2 pt-4 border-t border-gray-800">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                        <History className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Recent</span>
                    </div>
                    <div className="space-y-2">
                        {history.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => loadHistory(item)}
                                className="w-full text-left p-3 rounded-lg bg-gray-900/50 hover:bg-gray-800 border border-transparent hover:border-gray-700 transition-all group"
                            >
                                <p className="text-xs text-gray-300 line-clamp-2 group-hover:text-white">{item.prompt}</p>
                                <span className="text-[10px] text-gray-600 mt-1 block">
                                    {new Date(item.createdAt).toLocaleTimeString()}
                                </span>
                            </button>
                        ))}
                    </div>
                  </div>
              )}
            </>
          ) : (
            /* Viewer Mode Sidebar Content */
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Upload File</label>
                    <div className="relative border-2 border-dashed border-gray-700 hover:border-purple-500 hover:bg-gray-900/50 transition-all rounded-xl p-8 flex flex-col items-center justify-center text-center group">
                        <input 
                            type="file" 
                            accept=".glb,.gltf" 
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="bg-gray-800 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                            <Upload className="w-6 h-6 text-purple-400" />
                        </div>
                        <p className="text-sm text-gray-200 font-medium">Click or Drop file</p>
                        <p className="text-xs text-gray-500 mt-1">Supports .GLB & .GLTF</p>
                    </div>
                </div>

                {uploadedFileName && (
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500 uppercase">Active Model</span>
                            <button 
                                onClick={clearUploadedFile}
                                className="text-gray-500 hover:text-red-400 transition-colors p-1"
                                title="Remove file"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Box className="w-4 h-4 text-purple-500 shrink-0" />
                            <p className="text-sm text-gray-200 truncate font-mono" title={uploadedFileName}>
                                {uploadedFileName}
                            </p>
                        </div>
                    </div>
                )}

                <div className="p-4 bg-blue-900/20 border border-blue-900/50 rounded-lg">
                    <h3 className="text-blue-400 text-xs font-bold mb-2 uppercase">Mapbox Integration</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        Use standard <strong>GLB</strong> files for Mapbox 3D layers. 
                        Ensure models are centered at (0,0,0) and scale is appropriate (1 unit ≈ 1 meter).
                    </p>
                </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-950">
             <div className="text-[10px] text-gray-600 text-center">
                Powered by Gemini 3.0 Pro Preview
             </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        
        {mode === 'generator' ? (
            <>
                {/* Header Controls (Generator) */}
                <div className="absolute top-4 right-4 z-20 flex gap-2">
                <button 
                    onClick={() => setShowCode(!showCode)}
                    className={`p-2 rounded-full backdrop-blur-md border transition-colors ${showCode ? 'bg-white text-black border-white' : 'bg-black/50 text-white border-white/20 hover:bg-black/70'}`}
                    title="View Generated Code"
                    >
                    <Code className="w-5 h-5" />
                </button>
                {currentModel && (
                    <button 
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-full font-medium shadow-lg shadow-green-900/20 transition-all"
                    >
                        <Download className="w-4 h-4" />
                        Download .GLB
                    </button>
                )}
                </div>

                {/* Generator Split View */}
                <div className="flex-1 flex overflow-hidden">
                    <div className={`flex-1 relative transition-all duration-300 ${showCode ? 'w-1/2' : 'w-full'}`}>
                        {/* Loading Overlay */}
                         {status === GenerationStatus.GENERATING && (
                            <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center">
                                <div className="bg-gray-900/90 p-6 rounded-xl border border-gray-700 flex flex-col items-center gap-4 shadow-2xl">
                                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                                    <div className="text-center">
                                        <p className="text-white font-medium">Generating 3D Logic...</p>
                                        <p className="text-xs text-gray-400 mt-1">This may take a few seconds</p>
                                    </div>
                                </div>
                            </div>
                         )}
                        <ScenePreview 
                            code={generatedCode} 
                            onModelReady={(group) => setCurrentModel(group)} 
                        />
                    </div>

                    <div className={`bg-gray-900 border-l border-gray-800 transition-all duration-300 flex flex-col ${showCode ? 'w-[500px] translate-x-0' : 'w-0 translate-x-full hidden'}`}>
                        <div className="p-4 border-b border-gray-800 flex items-center gap-2 bg-gray-900 sticky top-0">
                            <Terminal className="w-4 h-4 text-green-500" />
                            <span className="font-mono text-sm font-bold">Generated Logic</span>
                        </div>
                        <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-gray-300">
                            {generatedCode ? (
                                <pre className="whitespace-pre-wrap">{generatedCode}</pre>
                            ) : (
                                <div className="text-gray-600 italic">No code generated yet...</div>
                            )}
                        </div>
                    </div>
                </div>
            </>
        ) : (
            /* Viewer Mode Main Area */
            <div className="flex-1 relative bg-gray-950">
                 <ModelViewer fileUrl={uploadedFileUrl} />
            </div>
        )}
      </div>
    </div>
  );
};

export default App;