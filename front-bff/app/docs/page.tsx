'use client';

import { useState } from 'react';
import { ApiReferenceReact } from '@scalar/api-reference-react';
import '@scalar/api-reference-react/style.css';

const specs = [
  { name: 'Bucket API', url: '/openapi/openapi-bucket.yaml' },
  { name: 'Menu API', url: '/openapi/openapi-menu.yaml' },
  { name: 'Overview API', url: '/openapi/openapi-overview.yaml' },
  { name: 'Settings API', url: '/openapi/openapi-settings.yaml' },
];

export default function ApiDocsPage() {
  const [selectedSpec, setSelectedSpec] = useState(specs[0].url);

  return (
    <div className="flex flex-col h-screen">
      <div className="px-4 py-2 bg-white border-b flex items-center gap-2 text-sm">
        <span className="text-gray-500 font-medium">Module:</span>
        <select
          value={selectedSpec}
          onChange={(e) => setSelectedSpec(e.target.value)}
          className="bg-transparent border-none focus:ring-0 cursor-pointer text-gray-800 font-semibold py-1 pr-8"
        >
          {specs.map((spec) => (
            <option key={spec.url} value={spec.url}>
              {spec.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 overflow-hidden">
        <ApiReferenceReact
          key={selectedSpec} // Force re-mount when spec changes
          configuration={{
            url: selectedSpec,
            theme: 'purple',
          }}
        />
      </div>
    </div>
  );
}