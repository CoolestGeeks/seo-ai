import React, { useState, useRef, useEffect } from 'react';
import { BlogPostWriterState } from '../types';
import WebhookInput from './ui/WebhookInput';
import Card from './ui/Card';
import Spinner from './ui/Spinner';
import { FileText, Copy, Check, AlertCircle } from 'lucide-react';

interface Props {
  state: BlogPostWriterState;
  updateState: (newState: Partial<BlogPostWriterState>) => void;
}

// Simple utility to check for RTL characters (like Arabic, Persian, Hebrew)
const containsRtlChars = (text: string): boolean => {
  const rtlRegex = /[\u0600-\u06FF\u0590-\u05FF]/;
  return rtlRegex.test(text);
};


const BlogPostWriterTool: React.FC<Props> = ({ state, updateState }) => {
  const { webhook, topic, result, isLoading, error, rawResponse } = state;
  const [copied, setCopied] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);

  // Local state to hold separated content, styles, and text direction
  const [blogContent, setBlogContent] = useState('');
  const [blogStyles, setBlogStyles] = useState('');
  const [isRtl, setIsRtl] = useState(false);

  // When the webhook result arrives, separate content/styles and detect direction
  useEffect(() => {
    if (result) {
      const styleRegex = /<style>([\s\S]*?)<\/style>/gi;
      const styleMatch = result.match(styleRegex);
      
      const css = styleMatch ? styleMatch.join('\n').replace(/<\/?style>/gi, '') : '';
      const content = result.replace(styleRegex, '').trim();
      
      setBlogStyles(css);
      setBlogContent(content);
      // Detect language direction from the content
      setIsRtl(containsRtlChars(content));

    } else {
      // Clear local state if result is cleared
      setBlogStyles('');
      setBlogContent('');
      setIsRtl(false);
    }
  }, [result]);


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
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      updateState({ rawResponse: data });

      // Expecting format: [{ "blog_post_html": "<h2>...</h2><p>...</p><style>...</style>" }]
      const htmlResult = data?.[0]?.blog_post_html;

      if (typeof htmlResult !== 'string' || htmlResult.trim() === '') {
        throw new Error('Invalid or empty HTML content in webhook response. Expected [{ "blog_post_html": "<html_string>" }].');
      }

      updateState({ result: htmlResult });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      updateState({ error: `Failed to write blog post: ${errorMessage}` });
    } finally {
      updateState({ isLoading: false });
    }
  };

  const copyToClipboard = () => {
    if (!blogContent) return;

    // Construct a full HTML snippet with styles for rich-text copying
    const htmlToCopy = `
        <style>${blogStyles}</style>
        ${blogContent}
    `;

    try {
      // Use the modern Clipboard API to write HTML
      const blob = new Blob([htmlToCopy], { type: 'text/html' });
      const data = [new ClipboardItem({ 'text/html': blob })];

      navigator.clipboard.write(data).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch (err) {
      console.error('Failed to copy rich text, falling back to plain text.', err);
      // Fallback for older browsers: copy plain text
      if (articleRef.current) {
        navigator.clipboard.writeText(articleRef.current.innerText).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }
    }
  };


  const renderResult = () => {
    if (!blogContent) return null;
    return (
      <Card>
        {/* Inject the extracted styles into the DOM via a <style> tag */}
        {blogStyles && <style>{blogStyles}</style>}
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Generated Blog Post</h3>
            <button 
              onClick={copyToClipboard} 
              className="flex items-center gap-2 bg-base-300 text-white font-bold py-2 px-3 rounded-lg hover:bg-brand-secondary transition-colors text-sm disabled:bg-base-300 disabled:cursor-default"
              disabled={copied}
            >
                {copied ? <Check className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}
                {copied ? 'Copied!' : 'Copy Formatted Text'}
            </button>
        </div>
        <article 
          dir={isRtl ? 'rtl' : 'ltr'}
          className={`prose prose-invert prose-lg max-w-none bg-base-100 p-6 rounded-md ${isRtl ? 'text-right' : 'text-left'}`}
        >
            <h1 className="capitalize !mb-6">{topic}</h1>
            <div 
              ref={articleRef}
              dangerouslySetInnerHTML={{ __html: blogContent }} 
            />
        </article>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-bold text-white mb-4">Blog Post Writer</h2>
        <WebhookInput value={webhook} onChange={(e) => updateState({ webhook: e.target.value })} disabled={isLoading} />
        <div className="space-y-2">
            <label htmlFor="blog-topic" className="block text-sm font-medium text-base-content-secondary">
                Blog Topic or Keyword
            </label>
            <input
              id="blog-topic"
              type="text"
              value={topic}
              onChange={(e) => updateState({ topic: e.target.value })}
              placeholder="Enter a blog topic or keyword..."
              disabled={isLoading}
              className="w-full bg-base-200 border border-base-300 text-base-content rounded-lg p-3 focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition"
            />
        </div>
        <button
          onClick={handleSubmit}
          disabled={isLoading || !webhook || !topic}
          className="mt-4 w-full flex justify-center items-center gap-2 bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-secondary transition-colors disabled:bg-base-300 disabled:cursor-not-allowed"
        >
          <FileText className="w-5 h-5" />
          Write Blog Post
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

export default BlogPostWriterTool;
