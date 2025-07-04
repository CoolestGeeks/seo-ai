import React from 'react';
import { KeywordGeneratorState, Keyword } from '../types';
import WebhookInput from './ui/WebhookInput';
import Card from './ui/Card';
import Spinner from './ui/Spinner';
import { KeyRound, Download, AlertCircle } from 'lucide-react';

interface Props {
  state: KeywordGeneratorState;
  updateState: (newState: Partial<KeywordGeneratorState>) => void;
}

const KeywordGeneratorTool: React.FC<Props> = ({ state, updateState }) => {
  const { webhook, topic, result, isLoading, error, rawResponse } = state;

  const handleSubmit = async () => {
    if (!webhook || !topic) {
      updateState({ error: 'Webhook URL and topic are required.' });
      return;
    }
    updateState({ isLoading: true, error: null, result: null, rawResponse: null });

    try {
      const response = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      updateState({ rawResponse: data });
      
      // Expected format: [{ "keywords": [...] }]
      const keywordsData = data?.[0]?.keywords;
      
      if (!Array.isArray(keywordsData)) {
          throw new Error('Invalid data structure in webhook response. Expected an array with one object like: [{ "keywords": [...] }].');
      }
      
      // Basic validation of the inner structure
      if (keywordsData.length > 0 && (
          typeof keywordsData[0].keyword === 'undefined' ||
          typeof keywordsData[0].intent === 'undefined'
      )) {
          throw new Error('Keyword objects in the response are missing required properties like "keyword" or "intent".');
      }
      
      updateState({ result: keywordsData });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      updateState({ error: `Failed to generate keywords: ${errorMessage}` });
    } finally {
      updateState({ isLoading: false });
    }
  };

  const copyAsCsv = () => {
    if (!result) return;
    const headers = "Keyword,Intent,Volume,Type";
    const rows = result.map(k => `"${k.keyword}","${k.intent}","${k.volumeCategory}","${k.type}"`);
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'keywords.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const renderResult = () => {
    if (!result) return null;
    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Generated Keywords</h3>
                <button
                  onClick={copyAsCsv}
                  className="flex items-center gap-2 bg-base-300 text-white font-bold py-2 px-3 rounded-lg hover:bg-brand-secondary transition-colors text-sm"
                >
                    <Download className="w-4 h-4"/>
                    Copy as CSV
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-base-300">
                        <tr>
                            <th className="p-3">Keyword</th>
                            <th className="p-3">Intent</th>
                            <th className="p-3">Volume</th>
                            <th className="p-3">Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        {result.map((kw, index) => (
                            <tr key={index} className="border-b border-base-300 hover:bg-base-100">
                                <td className="p-3">{kw.keyword}</td>
                                <td className="p-3 capitalize">{kw.intent}</td>
                                <td className="p-3 capitalize">{kw.volumeCategory}</td>
                                <td className="p-3 capitalize">{kw.type}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-bold text-white mb-4">Keyword Generator</h2>
        <WebhookInput value={webhook} onChange={(e) => updateState({ webhook: e.target.value })} disabled={isLoading} />
        <div className="space-y-2">
            <label htmlFor="keyword-topic" className="block text-sm font-medium text-base-content-secondary">
                Topic
            </label>
            <input
              id="keyword-topic"
              type="text"
              value={topic}
              onChange={(e) => updateState({ topic: e.target.value })}
              placeholder="Enter a topic (e.g., 'AI automation')"
              disabled={isLoading}
              className="w-full bg-base-200 border border-base-300 text-base-content rounded-lg p-3 focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition"
            />
        </div>
        <button
          onClick={handleSubmit}
          disabled={isLoading || !webhook || !topic}
          className="mt-4 w-full flex justify-center items-center gap-2 bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-secondary transition-colors disabled:bg-base-300 disabled:cursor-not-allowed"
        >
          <KeyRound className="w-5 h-5" />
          Generate Keywords
        </button>
      </Card>

      {error && (
        <Card className="bg-red-900 border border-red-700">
            <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-300"/>
                <p className="text-red-200 font-semibold">{error}</p>
            </div>
        </Card>
      )}

      {isLoading && <Spinner />}
      {result && renderResult()}

      {rawResponse && (
        <details className="mt-6 bg-base-200 rounded-lg p-4">
          <summary className="cursor-pointer font-semibold text-base-content-secondary hover:text-white">
            View Raw Webhook Response
          </summary>
          <pre className="text-xs whitespace-pre-wrap break-words bg-base-100 p-4 rounded-md mt-2 overflow-auto max-h-96">
            <code>{JSON.stringify(rawResponse, null, 2)}</code>
          </pre>
        </details>
      )}
    </div>
  );
};

export default KeywordGeneratorTool;
