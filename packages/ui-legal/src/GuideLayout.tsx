import React from 'react';

interface GuideLayoutProps {
    children: React.ReactNode;
    title: string;
    description: string;
    publishDate?: string;
}

export const GuideLayout: React.FC<GuideLayoutProps> = ({ children, title, description, publishDate }) => {
    return (
        <article className="max-w-4xl mx-auto px-4 py-8 md:py-12 lg:py-16">
            <header className="mb-8 md:mb-12 border-b pb-8">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 mb-4">
                    {title}
                </h1>
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400">
                    {description}
                </p>
                {publishDate && (
                    <time className="block mt-4 text-sm text-gray-500 dark:text-gray-500 font-medium">
                        Published: {publishDate}
                    </time>
                )}
            </header>
            <div className="prose prose-lg dark:prose-invert max-w-none">
                {children}
            </div>
        </article>
    );
};
