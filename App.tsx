import React, { useState } from 'react';
import { Tool, AppState } from './types';
import Sidebar from './components/Sidebar';
import OnPageSeoTool from './components/OnPageSeoTool';
import KeywordGeneratorTool from './components/KeywordGeneratorTool';
import BlogPostWriterTool from './components/BlogPostWriterTool';
import RankTrackerTool from './components/RankTrackerTool';

const LOCAL_STORAGE_KEY = 'n8n-seo-tool-webhooks';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<Tool>(Tool.OnPageSEO);
  
  // Initialize state with webhooks from localStorage if available.
  // This function runs only once on the initial render.
  const [appState, setAppState] = useState<AppState>(() => {
    try {
      const savedWebhooks = localStorage.getItem(LOCAL_STORAGE_KEY);
      const initialWebhooks = savedWebhooks ? JSON.parse(savedWebhooks) : {};
      
      return {
        [Tool.OnPageSEO]: { webhook: initialWebhooks[Tool.OnPageSEO] || '', url: '', result: null, isLoading: false, error: null, rawResponse: null },
        [Tool.KeywordGenerator]: { webhook: initialWebhooks[Tool.KeywordGenerator] || '', topic: '', result: null, isLoading: false, error: null, rawResponse: null },
        [Tool.BlogPostWriter]: { webhook: initialWebhooks[Tool.BlogPostWriter] || '', topic: '', result: null, isLoading: false, error: null, rawResponse: null },
        [Tool.RankTracker]: { webhook: initialWebhooks[Tool.RankTracker] || '', domain: '', keyword: '', result: null, isLoading: false, error: null, rawResponse: null },
      };
    } catch (error) {
        console.error("Failed to parse webhooks from localStorage", error);
        // Fallback to a clean state if localStorage is corrupt
        return {
             [Tool.OnPageSEO]: { webhook: '', url: '', result: null, isLoading: false, error: null, rawResponse: null },
            [Tool.KeywordGenerator]: { webhook: '', topic: '', result: null, isLoading: false, error: null, rawResponse: null },
            [Tool.BlogPostWriter]: { webhook: '', topic: '', result: null, isLoading: false, error: null, rawResponse: null },
            [Tool.RankTracker]: { webhook: '', domain: '', keyword: '', result: null, isLoading: false, error: null, rawResponse: null },
        }
    }
  });

  // Persist webhook changes to localStorage
  const updateToolState = <T extends Tool,>(tool: T, newState: Partial<AppState[T]>) => {
    // If the webhook is being updated, save it to localStorage
    if (newState.webhook !== undefined) {
      try {
        const savedWebhooks = localStorage.getItem(LOCAL_STORAGE_KEY);
        const webhooks = savedWebhooks ? JSON.parse(savedWebhooks) : {};
        webhooks[tool] = newState.webhook;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(webhooks));
      } catch (error) {
        console.error("Failed to save webhook to localStorage", error);
      }
    }
    
    setAppState(prevState => ({
      ...prevState,
      [tool]: { ...prevState[tool], ...newState }
    }));
  };

  const renderActiveTool = () => {
    switch (activeTool) {
      case Tool.OnPageSEO:
        return <OnPageSeoTool state={appState[Tool.OnPageSEO]} updateState={(s) => updateToolState(Tool.OnPageSEO, s)} />;
      case Tool.KeywordGenerator:
        return <KeywordGeneratorTool state={appState[Tool.KeywordGenerator]} updateState={(s) => updateToolState(Tool.KeywordGenerator, s)} />;
      case Tool.BlogPostWriter:
        return <BlogPostWriterTool state={appState[Tool.BlogPostWriter]} updateState={(s) => updateToolState(Tool.BlogPostWriter, s)} />;
      case Tool.RankTracker:
        return <RankTrackerTool state={appState[Tool.RankTracker]} updateState={(s) => updateToolState(Tool.RankTracker, s)} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-base-100 text-base-content">
      <Sidebar activeTool={activeTool} setActiveTool={setActiveTool} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {renderActiveTool()}
      </main>
    </div>
  );
};

export default App;