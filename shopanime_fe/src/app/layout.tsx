import type { Metadata } from 'next';
import Script from 'next/script';
import type { ReactNode } from 'react';
import '../index.css';

export const metadata: Metadata = {
  title: 'AkibaCore',
  description: 'Manga and comic shop',
};

const extensionAttributeCleanup = `
(function () {
  function cleanNode(node) {
    if (!node || node.nodeType !== 1) {
      return;
    }

    if (node.hasAttribute && node.hasAttribute('bis_skin_checked')) {
      node.removeAttribute('bis_skin_checked');
    }

    if (node.querySelectorAll) {
      node.querySelectorAll('[bis_skin_checked]').forEach(function (element) {
        element.removeAttribute('bis_skin_checked');
      });
    }
  }

  cleanNode(document.documentElement);

  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      cleanNode(mutation.target);
      mutation.addedNodes && mutation.addedNodes.forEach(cleanNode);
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    childList: true,
    subtree: true
  });

  window.addEventListener('load', function () {
    window.setTimeout(function () {
      cleanNode(document.documentElement);
      observer.disconnect();
    }, 0);
  });
})();
`.trim();

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Script
          id="akibacore-extension-attribute-cleanup"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: extensionAttributeCleanup }}
        />
        {children}
      </body>
    </html>
  );
}
