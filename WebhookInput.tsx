
import React from 'react';
import { HelpCircle } from 'lucide-react';

interface WebhookInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const WebhookInput: React.FC<WebhookInputProps> = ({ value, onChange, disabled }) => {
  return (
    <div className="mb-6">
      <label htmlFor="webhook-url" className="block text-sm font-medium text-base-content-secondary mb-2">
        N8N Webhook URL
      </label>
      <div className="relative group">
        <input
          id="webhook-url"
          type="password"
          value={value}
          onChange={onChange}
          placeholder="Paste your n8n 'Webhook' node URL here"
          disabled={disabled}
          className="w-full bg-base-200 border border-base-300 text-base-content rounded-lg p-3 pr-10 focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-help">
          <HelpCircle className="w-5 h-5 text-base-content-secondary" />
        </div>
        <div className="absolute hidden group-hover:block bg-base-300 text-white text-xs rounded py-1 px-2 -top-8 right-0 w-max z-10">
          Paste your n8n 'Webhook' node URL here.
        </div>
      </div>
    </div>
  );
};

export default WebhookInput;
