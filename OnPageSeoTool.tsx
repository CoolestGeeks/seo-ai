import React from 'react';
import { OnPageSeoState } from '../types';
import WebhookInput from './ui/WebhookInput';
import Card from './ui/Card';
import Spinner from './ui/Spinner';
import { Search, AlertCircle } from 'lucide-react';

interface Props {
  state: OnPageSeoState;
  updateState: (newState: Partial<OnPageSeoState>) => void;
}

// Simple utility to check for RTL characters (like Arabic, Persian, Hebrew)
const containsRtlChars = (text: string): boolean => {
  if (!text) return false;
  const rtlRegex = /[\u0600-\u06FF\u0590-\u05FF]/;
  return rtlRegex.test(text);
};

// A more robust parser that escapes HTML within code blocks (`...`) before rendering other markdown.
const parseMarkdown = (text: string): string => {
  if (!text) return '';

  const escapeHtml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const processLine = (line: string) => {
    // First, process and escape code blocks to prevent inner HTML rendering
    let processedLine = line.replace(/`(.*?)`/g, (match, codeContent) => {
      return `<code>${escapeHtml(codeContent)}</code>`;
    });
    // Then, process other markdown like bold text
    processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return processedLine;
  };

  return text.split('\n\n').map(block => {
    // Handle lists
    if (block.trim().startsWith('* ')) {
      const items = block.split('\n').map(item => {
        const content = processLine(item.replace(/^\*   ?/, ''));
        return `<li>${content}</li>`;
      }).join('');
      return `<ul>${items}</ul>`;
    }
    // Handle headings
    if (block.startsWith('## ')) {
      return `<h2>${processLine(block.substring(3))}</h2>`;
    }
    // Handle paragraphs and line breaks
    return `<p>${processLine(block.replace(/\n/g, '<br />'))}</p>`;
  }).join('');
};


const OnPageSeoTool: React.FC<Props> = ({ state, updateState }) => {
  const { webhook, url, result, isLoading, error, rawResponse } = state;

  const handleSubmit = async () => {
    if (!webhook || !url) {
      updateState({ error: 'Webhook URL and page URL are required.' });
      return;
    }
    updateState({ isLoading: true, error: null, result: null, rawResponse: null });

    try {
      // The fetch call has no timeout and will wait for the n8n webhook to complete.
      const response = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      updateState({ rawResponse: data });
      
      const reportData = data?.[0]?.blog_post_html;

      if (typeof reportData !== 'string' || reportData.trim() === '') {
        throw new Error('Invalid or empty content in webhook response. Expected [{ "blog_post_html": "<string>" }].');
      }
      
      updateState({ result: reportData });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      updateState({ error: `Failed to fetch analysis: ${errorMessage}` });
    } finally {
      updateState({ isLoading: false });
    }
  };

  const renderResult = () => {
    if (!result) return null;

    const htmlResult = parseMarkdown(result);
    const isRtl = containsRtlChars(result);

    return (
      <Card>
        <h3 className="text-lg font-bold text-white mb-4">On-Page SEO Analysis Report</h3>
        <article
          dir={isRtl ? 'rtl' : 'ltr'}
          className={`prose prose-invert prose-lg max-w-none bg-base-100 p-6 rounded-md ${isRtl ? 'text-right' : 'text-left'}`}
          dangerouslySetInnerHTML={{ __html: htmlResult }}
        />
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-bold text-white mb-4">On-Page SEO Analyzer</h2>
        <WebhookInput value={webhook} onChange={(e) => updateState({ webhook: e.target.value })} disabled={isLoading} />
        <div className="space-y-2">
            <label htmlFor="page-url" className="block text-sm font-medium text-base-content-secondary">
                Page URL to Analyze
            </label>
            <input
              id="page-url"
              type="text"
              value={url}
              onChange={(e) => updateState({ url: e.target.value })}
              placeholder="Enter a full URL (e.g., https://www.example.com/page)"
              disabled={isLoading}
              className="w-full bg-base-200 border border-base-300 text-base-content rounded-lg p-3 focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition"
            />
        </div>
        <button
          onClick={handleSubmit}
          disabled={isLoading || !webhook || !url}
          className="mt-4 w-full flex justify-center items-center gap-2 bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-secondary transition-colors disabled:bg-base-300 disabled:cursor-not-allowed"
        >
          <Search className="w-5 h-5" />
          Analyze Page
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

      {isLoading && (
        <Card>
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <Spinner />
            <h3 className="text-xl font-bold text-white">Performing In-Depth Analysis...</h3>
            <p className="max-w-md text-base-content-secondary">
              This can take several minutes. The application will wait for the process to complete and will not time out.
              <br />
              Please keep this page open.
            </p>
          </div>
        </Card>
      )}

      {!isLoading && result && renderResult()}
      
      {!isLoading && rawResponse && (
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

export default OnPageSeoTool;