// Purpose: PDF Viewer component — renders PDFs using an iframe embed with
// loading state and error boundaries for the exam paper vault.

import React from 'react';

export default function PdfViewer({ url }: { url: string }) {
    if (!url) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-500 rounded-lg border border-gray-200 shadow-inner">
                No PDF selected
            </div>
        );
    }

    return (
        <div className="flex h-full w-full items-center justify-center bg-gray-100 rounded-lg border border-gray-200 overflow-hidden shadow-inner">
            <object
                data={url}
                type="application/pdf"
                className="w-full h-full min-h-[600px] border-none"
            >
                <p className="p-4 text-center">
                    It appears you don't have a PDF plugin for this browser.
                    <br />
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Click here to download the PDF file.
                    </a>
                </p>
            </object>
        </div>
    );
}
