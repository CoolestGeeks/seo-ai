import React from 'react';
import { RankTrackerState, RankTrackerResult } from '../types';
import WebhookInput from './ui/WebhookInput';
import Card from './ui/Card';
import Spinner from './ui/Spinner';
import { TrendingUp, ArrowUp, ArrowDown, Minus, AlertCircle } from 'lucide-react';

interface Props {
  state: RankTrackerState;
  updateState: (newState: Partial<RankTrackerState>) => void;
}

const RankTrackerTool: React.FC<Props> = ({ state, updateState }) => {
  const { webhook, domain, keyword, result, isLoading, error, rawResponse } = state;

  const handleSubmit = async () => {
    if (!webhook || !domain || !keyword) {
      updateState({ error: 'Webhook URL, domain, and keyword are required.' });
      return;
    }
    updateState({ isLoading: true, error: null, result: null, rawResponse: null });

    try {
      const response = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, keyword }),
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      updateState({ rawResponse: data });

      // The new format is an array with a single object: [{ current_rank: ..., previous_rank: ... }]
      const responseData = data?.[0];
      
      // Validate the data structure
      if (
        !responseData || 
        typeof responseData.current_rank === 'undefined' || 
        typeof responseData.previous_rank === 'undefined'
      ) {
          throw new Error('Invalid data structure in webhook response. Expected an array with one object like: [{ "current_rank": number, "previous_rank": number }].');
      }

      // Map the webhook response to the state structure. A rank of 0 is treated as "not found".
      const newResult: RankTrackerResult = {
        "Current Rank": responseData.current_rank === 0 ? 'Not Found' : responseData.current_rank,
        "Previous Rank": responseData.previous_rank === 0 ? 'N/A' : responseData.previous_rank,
      };

      updateState({ result: newResult });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      updateState({ error: `Failed to check rank: ${errorMessage}` });
    } finally {
      updateState({ isLoading: false });
    }
  };

  const renderResult = () => {
    if (!result) return null;

    const current = result["Current Rank"];
    const previous = result["Previous Rank"];
    
    let TrendIcon = Minus;
    let trendColor = 'text-gray-400';
    let trendText = "No change";

    if (typeof current === 'number' && typeof previous === 'number') {
        if (current < previous) {
            TrendIcon = ArrowUp;
            trendColor = 'text-green-400';
            trendText = `Up by ${previous - current}`;
        } else if (current > previous) {
            TrendIcon = ArrowDown;
            trendColor = 'text-red-400';
            trendText = `Down by ${current - previous}`;
        }
    }


    return (
      <Card>
        <h3 className="text-lg font-bold text-white mb-4">Ranking Result</h3>
        <div className="flex flex-col sm:flex-row gap-6 items-center justify-around text-center">
            <div className="flex-1">
                <p className="text-base-content-secondary text-sm">Current Rank</p>
                <p className="text-5xl font-bold text-white">{String(current)}</p>
            </div>
            <div className="flex-1">
                <p className="text-base-content-secondary text-sm">Previous Rank</p>
                <p className="text-5xl font-light text-base-content-secondary">{String(previous)}</p>
            </div>
            <div className="flex-1">
                <p className="text-base-content-secondary text-sm">Trend</p>
                <div className={`flex items-center justify-center gap-2 ${trendColor}`}>
                    <TrendIcon className="w-8 h-8"/>
                    <span className="text-2xl font-bold">{trendText}</span>
                </div>
            </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-bold text-white mb-4">Rank Tracker</h2>
        <WebhookInput value={webhook} onChange={(e) => updateState({ webhook: e.target.value })} disabled={isLoading} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <label htmlFor="domain-input" className="block text-sm font-medium text-base-content-secondary">
                    Domain
                </label>
                <input
                  id="domain-input"
                  type="text"
                  value={domain}
                  onChange={(e) => updateState({ domain: e.target.value })}
                  placeholder="e.g., example.com"
                  disabled={isLoading}
                  className="w-full bg-base-200 border border-base-300 text-base-content rounded-lg p-3 focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition"
                />
            </div>
             <div className="space-y-2">
                <label htmlFor="keyword-input" className="block text-sm font-medium text-base-content-secondary">
                    Keyword
                </label>
                <input
                  id="keyword-input"
                  type="text"
                  value={keyword}
                  onChange={(e) => updateState({ keyword: e.target.value })}
                  placeholder="e.g., AI automation"
                  disabled={isLoading}
                  className="w-full bg-base-200 border border-base-300 text-base-content rounded-lg p-3 focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition"
                />
            </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isLoading || !webhook || !domain || !keyword}
          className="mt-4 w-full flex justify-center items-center gap-2 bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-secondary transition-colors disabled:bg-base-300 disabled:cursor-not-allowed"
        >
          <TrendingUp className="w-5 h-5" />
          Check Rank
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

export default RankTrackerTool;
