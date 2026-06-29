import type { Components } from 'react-markdown';

export const aiMarkdownComponents: Components = {
  h2: ({ children }) => (
    <h2 className="text-lg font-bold text-bluesh-900 mt-6 mb-2 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-bluesh-900 mt-4 mb-2">{children}</h3>
  ),
  p: ({ children }) => <p className="text-sm text-blacky-700 leading-relaxed mb-2">{children}</p>,
  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3 text-sm text-blacky-700">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-3 text-sm text-bluesh-900">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-bluesh-900">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-bluesh-300 pl-3 my-2 text-sm text-blacky-600 italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-basic-border" />,
};
