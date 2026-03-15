"use client";

import React, { useState } from "react";
import { useSession } from "../contexts/SessionContext";

// Purpose: Defines the properties for the SessionRestoreLock component.
interface SessionRestoreLockProps {
    children: React.ReactNode;
}

// Purpose: A security boundary component that blocks access to child routes until a valid Case ID is provided by the user.
export function SessionRestoreLock({ children }: SessionRestoreLockProps) {
    const { caseId, setCaseId } = useSession();
    const [inputId, setInputId] = useState("");

    if (caseId) {
        return <>{children}</>;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputId.trim().length > 0) {
            setCaseId(inputId.trim());
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md border border-gray-200">
                <div className="text-center mb-6">
                    <div className="mx-auto w-12 h-12 bg-blue-100 flex items-center justify-center rounded-full mb-4">
                        <svg
                            className="w-6 h-6 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            ></path>
                        </svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Session Locked</h2>
                    <p className="text-sm text-gray-500 mt-2">
                        For your security, Case IDs are never stored on your device. Please re-enter your Case ID to resume.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="caseId" className="block text-sm font-medium text-gray-700">
                            Case ID
                        </label>
                        <input
                            type="text"
                            id="caseId"
                            value={inputId}
                            onChange={(e) => setInputId(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 border"
                            placeholder="Enter your Case ID"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Restore Session
                    </button>
                </form>
            </div>
        </div>
    );
}
