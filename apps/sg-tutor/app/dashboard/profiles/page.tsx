// Purpose: Sprint 23 — Netflix-style Profile Selection page.
// Maps to a `profiles` array within the parent's Firestore user document.
// When a profile is clicked, sets the Ghost State / Active Student Context
// to that specific child's gradeLevel and uid, enforcing state isolation
// between siblings sharing one parent account.

"use client";

import { useState, useCallback } from "react";
import { User, Plus, GraduationCap, ChevronRight, Shield } from "lucide-react";

const UserIcon = User as any;
const PlusIcon = Plus as any;
const GraduationCapIcon = GraduationCap as any;
const ChevronRightIcon = ChevronRight as any;
const ShieldIcon = Shield as any;

// Purpose: Shape of a child profile within the parent's Firestore document.
interface ChildProfile {
    uid: string;
    name: string;
    gradeLevel: string;
    avatarEmoji: string;
    /** Purpose: Accumulated XP for this profile. */
    xp: number;
    /** Purpose: Number of questions this profile has mastered. */
    questionsMastered: number;
}

// Purpose: Props for the ProfilesPage component.
interface ProfilesPageProps {
    /** Purpose: Stub — in production, profiles come from Firestore. */
    initialProfiles?: ChildProfile[];
}

// Purpose: Gradient colours for profile cards — cycled based on index.
const PROFILE_GRADIENTS = [
    'from-violet-500 to-indigo-600',
    'from-rose-500 to-pink-600',
    'from-cyan-500 to-blue-600',
    'from-amber-500 to-orange-600',
    'from-emerald-500 to-teal-600',
];

// Purpose: Static sample profiles for UI development.
const SAMPLE_PROFILES: ChildProfile[] = [
    { uid: 'child-01', name: 'Ethan', gradeLevel: 'P4', avatarEmoji: '🦁', xp: 2400, questionsMastered: 38 },
    { uid: 'child-02', name: 'Sophie', gradeLevel: 'P6', avatarEmoji: '🦄', xp: 5100, questionsMastered: 87 },
];

// Purpose: Maximum number of seated profiles per subscription.
const MAX_SEATS = 5;

// Purpose: Main page component — renders the profile selector grid.
export default function ProfilesPage() {
    const profiles = SAMPLE_PROFILES;

    // Purpose: Track the currently selected profile for confirmation.
    const [selectedUid, setSelectedUid] = useState<string | null>(null);

    // Purpose: Handle profile selection — sets the Active Student Context.
    // In production, this would update a global state/context with the
    // child's uid and gradeLevel.
    const handleSelectProfile = useCallback((profile: ChildProfile) => {
        setSelectedUid(profile.uid);
        // Purpose: In production, dispatch to context/store:
        // setActiveStudent({ uid: profile.uid, gradeLevel: profile.gradeLevel });
        console.log(`[Profiles] Selected: ${profile.name} (${profile.gradeLevel})`);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 py-12">
            {/* Purpose: Header */}
            <div className="text-center mb-10">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Who&apos;s learning today?</h1>
                <p className="text-sm text-slate-500">Select a profile to start the session</p>
            </div>

            {/* Purpose: Profile grid */}
            <div className="flex flex-wrap justify-center gap-6 max-w-3xl">
                {profiles.map((profile, index) => {
                    const isSelected = selectedUid === profile.uid;
                    const gradient = PROFILE_GRADIENTS[index % PROFILE_GRADIENTS.length];

                    return (
                        <button
                            key={profile.uid}
                            onClick={() => handleSelectProfile(profile)}
                            className={`group relative w-44 rounded-3xl overflow-hidden transition-all duration-300 cursor-pointer ${isSelected
                                ? 'ring-4 ring-violet-400 ring-offset-2 scale-105 shadow-2xl'
                                : 'shadow-lg hover:shadow-xl hover:scale-[1.02]'
                                }`}
                        >
                            {/* Purpose: Gradient header with emoji avatar */}
                            <div className={`bg-gradient-to-br ${gradient} px-4 pt-6 pb-4 text-center`}>
                                <div className="text-4xl mb-2">{profile.avatarEmoji}</div>
                                <h3 className="text-lg font-bold text-white">{profile.name}</h3>
                            </div>

                            {/* Purpose: Profile details */}
                            <div className="bg-white px-4 py-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <GraduationCapIcon size={12} />
                                        <span className="font-semibold">{profile.gradeLevel}</span>
                                    </div>
                                    <span className="text-xs font-bold text-amber-600">{profile.xp} XP</span>
                                </div>
                                <div className="text-[10px] text-slate-400">
                                    {profile.questionsMastered} questions mastered
                                </div>
                            </div>

                            {/* Purpose: Selection indicator */}
                            {isSelected && (
                                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                                    <ChevronRightIcon size={14} className="text-white" />
                                </div>
                            )}
                        </button>
                    );
                })}

                {/* Purpose: Add Profile button — disabled if seats are full. */}
                {profiles.length < MAX_SEATS && (
                    <button className="w-44 rounded-3xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center py-12 text-slate-400 hover:border-violet-300 hover:text-violet-500 transition-all duration-200 cursor-pointer">
                        <PlusIcon size={32} className="mb-2" />
                        <span className="text-sm font-medium">Add Profile</span>
                        <span className="text-[10px] mt-1">1 profile = 1 seat</span>
                    </button>
                )}
            </div>

            {/* Purpose: Parent controls footer */}
            <div className="mt-12 flex items-center gap-2 text-xs text-slate-400">
                <ShieldIcon size={12} />
                <span>Parent controls available in Settings</span>
            </div>
        </div>
    );
}
