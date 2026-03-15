// Purpose: Weekly Parent Report Cron — scheduled job that runs every Friday
// at 5:00 PM SGT. Iterates through verified parent users, aggregates their
// child's completed questionQueue XP and topic performance, formats a summary,
// and dispatches an email event for transactional delivery.
// Sprint 23: Added Transcript of the Week — highlights a breakthrough moment.

// Purpose: Type definitions for the report pipeline.

// Purpose: Per-topic performance summary extracted from completed queue items.
interface TopicPerformance {
    topic: string;
    subject: string;
    totalAttempts: number;
    masteredCount: number;
    /** Purpose: Ratio of mastered / total — used for the struggled/mastered labels. */
    masteryRate: number;
}

// Purpose: Sprint 23 — A 3-message exchange capturing a breakthrough moment
// where the student struggled (failedAttempts > 0) then mastered the concept.
interface TranscriptExchange {
    /** Purpose: The question the student was struggling with. */
    question: string;
    /** Purpose: The AI tutor's guiding response that led to the breakthrough. */
    tutorGuidance: string;
    /** Purpose: The student's successful answer demonstrating mastery. */
    studentBreakthrough: string;
    /** Purpose: Topic/subject for context in the email. */
    topic: string;
}

// Purpose: The aggregated weekly report shape sent to the email service.
export interface WeeklyReportPayload {
    parentEmail: string;
    childName: string;
    gradeLevel: string;
    weekStarting: string;
    totalQuestionsAttempted: number;
    totalXpEarned: number;
    /** Purpose: Topics with masteryRate < 0.5 — flagged as "Struggled". */
    struggledTopics: string[];
    /** Purpose: Topics with masteryRate >= 0.8 — flagged as "Mastered". */
    masteredTopics: string[];
    /** Purpose: Full topic breakdown for the detailed report table. */
    topicBreakdown: TopicPerformance[];
    /** Purpose: Sprint 23 — The highlighted breakthrough moment of the week.
     *  Null if no breakthrough exchange was found. */
    transcriptOfTheWeek: TranscriptExchange | null;
}

// Purpose: Cron schedule constant — Friday 5:00 PM Singapore Time.
export const WEEKLY_REPORT_SCHEDULE = '0 17 * * 5' as const;

// Purpose: Main worker function — processes a single parent-child relationship
// and generates their weekly report payload. Designed to be called in a loop
// by the job runner for each verified parent.
//
// NOTE: Uses dynamic imports for firebase-admin to maintain compatibility
// with the main Next.js build (which uses the client SDK).
export async function generateWeeklyReport(
    parentUid: string
): Promise<WeeklyReportPayload | null> {
    try {
        const { getFirestore } = await import('firebase-admin/firestore');
        const db = getFirestore();

        // Purpose: Fetch the parent's profile to get linked child UID and email.
        const parentDoc = await db.collection('users').doc(parentUid).get();
        if (!parentDoc.exists) return null;

        const parentData = parentDoc.data();
        if (!parentData?.email || !parentData?.linkedChildUid) return null;

        // Purpose: Fetch the child's profile for name and grade level.
        const childDoc = await db
            .collection('users')
            .doc(parentData.linkedChildUid)
            .get();
        if (!childDoc.exists) return null;

        const childData = childDoc.data();
        if (!childData) return null;

        // Purpose: Calculate the week boundary (past 7 days).
        const now = Date.now();
        const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

        // Purpose: Query completed questions from the child's queue in the past week.
        const queueSnapshot = await db
            .collection('users')
            .doc(parentData.linkedChildUid)
            .collection('questionQueue')
            .where('status', '==', 'completed')
            .where('uploadedAt', '>=', weekAgo)
            .get();

        // Purpose: Aggregate topic performance from the completed items.
        const topicMap = new Map<string, TopicPerformance>();

        for (const doc of queueSnapshot.docs) {
            const data = doc.data();
            const key = `${data.subject}_${data.topic}`;

            if (!topicMap.has(key)) {
                topicMap.set(key, {
                    topic: data.topic || 'General',
                    subject: data.subject || 'Unknown',
                    totalAttempts: 0,
                    masteredCount: 0,
                    masteryRate: 0,
                });
            }

            const entry = topicMap.get(key)!;
            entry.totalAttempts++;
            if (data.mastered === true) {
                entry.masteredCount++;
            }
            entry.masteryRate = entry.masteredCount / entry.totalAttempts;
        }

        const topicBreakdown = Array.from(topicMap.values());

        // Purpose: Classify topics into "Struggled" and "Mastered" buckets.
        const struggledTopics = topicBreakdown
            .filter((t) => t.masteryRate < 0.5)
            .map((t) => t.topic);

        const masteredTopics = topicBreakdown
            .filter((t) => t.masteryRate >= 0.8)
            .map((t) => t.topic);

        // Purpose: Calculate total XP earned this week.
        const totalXpEarned = queueSnapshot.docs.reduce((sum, doc) => {
            return sum + (doc.data().xpEarned || 0);
        }, 0);

        // Purpose: Format the week-starting date for the report header.
        const weekStartDate = new Date(weekAgo);
        const weekStarting = weekStartDate.toLocaleDateString('en-SG', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });

        return {
            parentEmail: parentData.email,
            childName: childData.displayName || 'Your child',
            gradeLevel: childData.gradeLevel || 'Unassigned',
            weekStarting,
            totalQuestionsAttempted: queueSnapshot.size,
            totalXpEarned,
            struggledTopics,
            masteredTopics,
            topicBreakdown,
            transcriptOfTheWeek: await extractTranscriptOfTheWeek(
                parentData.linkedChildUid,
                weekAgo
            ),
        };
    } catch (error) {
        console.error(`[WeeklyReport] Failed for parent ${parentUid}:`, error);
        return null;
    }
}

// Purpose: Sprint 23 — Scan the week's chat history to find a "breakthrough"
// exchange: a sequence where failedAttempts > 0 is followed by mastered === true.
// Extracts the 3-message exchange (student question → tutor guidance → student success)
// for inclusion in the parent email as "Transcript of the Week".
async function extractTranscriptOfTheWeek(
    childUid: string,
    weekAgo: number
): Promise<TranscriptExchange | null> {
    try {
        const { getFirestore } = await import('firebase-admin/firestore');
        const db = getFirestore();

        // Purpose: Query chat sessions from the past week, ordered by timestamp.
        const sessionsSnapshot = await db
            .collection('users')
            .doc(childUid)
            .collection('chatSessions')
            .where('createdAt', '>=', weekAgo)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        // Purpose: Iterate through sessions looking for the breakthrough pattern:
        // A question with failedAttempts > 0 AND mastered === true.
        for (const sessionDoc of sessionsSnapshot.docs) {
            const sessionData = sessionDoc.data();
            const messages: Array<{ role: string; content: string }> =
                sessionData.messages || [];

            // Purpose: Check if this session contains a breakthrough.
            if (
                sessionData.failedAttempts > 0 &&
                sessionData.mastered === true &&
                messages.length >= 3
            ) {
                // Purpose: Extract the last 3 meaningful messages as the transcript.
                // Pattern: user question -> assistant guidance -> user success
                const userMessages = messages.filter((m) => m.role === 'user');
                const assistantMessages = messages.filter((m) => m.role === 'assistant');

                if (userMessages.length >= 2 && assistantMessages.length >= 1) {
                    return {
                        question: userMessages[0]?.content || 'Question not captured',
                        tutorGuidance:
                            assistantMessages[assistantMessages.length - 1]?.content ||
                            'Guidance not captured',
                        studentBreakthrough:
                            userMessages[userMessages.length - 1]?.content ||
                            'Response not captured',
                        topic: sessionData.topic || sessionData.subject || 'General',
                    };
                }
            }
        }

        return null;
    } catch (error) {
        console.error('[WeeklyReport] Failed to extract transcript:', error);
        return null;
    }
}
