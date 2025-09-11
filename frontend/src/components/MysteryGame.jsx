// frontend/src/components/MysteryGame.jsx - Enhanced realistic version

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

const MysteryGame = () => {
    const [currentCase, setCurrentCase] = useState(null);
    const [currentSceneId, setCurrentSceneId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);
    const [lastChoice, setLastChoice] = useState(null);
    const [evidenceCollected, setEvidenceCollected] = useState([]);
    const [witnessesInterviewed, setWitnessesInterviewed] = useState([]);
    const [detectiveScore, setDetectiveScore] = useState(0);
    const [caseNotes, setCaseNotes] = useState([]);

    const createMystery = async (theme, mysteryType, setting) => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE}/cases/create`, {
                theme,
                mystery_type: mysteryType,
                setting
            });

            const jobId = response.data.job_id;

            const pollInterval = setInterval(async () => {
                try {
                    const jobResponse = await axios.get(`${API_BASE}/jobs/${jobId}`);
                    if (jobResponse.data.status === 'completed') {
                        clearInterval(pollInterval);
                        const caseResponse = await axios.get(`${API_BASE}/cases/${jobResponse.data.case_id}`);
                        setCurrentCase(caseResponse.data);
                        setCurrentSceneId(caseResponse.data.data.root_scene);
                        setLoading(false);
                        resetGameState();
                    }
                } catch (error) {
                    clearInterval(pollInterval);
                    setLoading(false);
                    console.error('Error polling job:', error);
                }
            }, 1000);

        } catch (error) {
            setLoading(false);
            console.error('Error creating mystery:', error);
        }
    };

    const resetGameState = () => {
        setEvidenceCollected([]);
        setWitnessesInterviewed([]);
        setDetectiveScore(0);
        setCaseNotes([]);
        setShowExplanation(false);
        setLastChoice(null);
    };

    const makeChoice = async (optionIndex) => {
        if (!currentCase || !currentSceneId) return;

        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE}/cases/choice`, {
                case_id: currentCase.id,
                scene_id: currentSceneId,
                option_index: optionIndex
            });

            const scene = currentCase.data.all_scenes[currentSceneId];
            const selectedOption = scene.options[optionIndex];

            setLastChoice({
                ...response.data,
                selectedText: selectedOption.text,
                sceneType: scene.scene_type,
                skillType: selectedOption.skill_type
            });

            // Update evidence and witnesses
            if (response.data.evidence_gained) {
                setEvidenceCollected(prev => [...prev, ...response.data.evidence_gained]);
            }

            setDetectiveScore(response.data.detective_score || 0);

            // Add to case notes
            setCaseNotes(prev => [...prev, {
                action: selectedOption.text,
                scene: currentSceneId,
                skill: selectedOption.skill_type,
                timestamp: new Date().toLocaleTimeString(),
                points: response.data.correct ? '+' : '±'
            }]);

            setShowExplanation(true);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            console.error('Error making choice:', error);
        }
    };

    const continueToNextScene = () => {
        if (lastChoice) {
            setCurrentSceneId(lastChoice.next_scene_id);
            setShowExplanation(false);
            setLastChoice(null);
        }
    };

    const resetGame = () => {
        setCurrentCase(null);
        setCurrentSceneId(null);
        resetGameState();
    };

    const getCurrentScene = () => {
        if (!currentCase || !currentSceneId) return null;
        return currentCase.data.all_scenes[currentSceneId];
    };

    const renderDetectiveTools = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Evidence Panel */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                    🔬 Evidence Collected ({evidenceCollected.length})
                </h4>
                <ul className="text-sm space-y-1">
                    {evidenceCollected.slice(-3).map((evidence, index) => (
                        <li key={index} className="text-blue-700">• {evidence.type}: {evidence.description}</li>
                    ))}
                    {evidenceCollected.length > 3 && <li className="text-blue-600 italic">...and {evidenceCollected.length - 3} more</li>}
                </ul>
            </div>

            {/* Detective Score */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                    🏆 Detective Score
                </h4>
                <div className="text-2xl font-bold text-green-700">{detectiveScore}</div>
                <div className="text-sm text-green-600">
                    {detectiveScore >= 10 ? "Expert Detective" :
                        detectiveScore >= 5 ? "Good Investigator" :
                            "Needs Training"}
                </div>
            </div>

            {/* Case Notes */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                    📋 Case Notes ({caseNotes.length})
                </h4>
                <ul className="text-sm space-y-1">
                    {caseNotes.slice(-2).map((note, index) => (
                        <li key={index} className="text-yellow-700">
                            <span className="font-mono">{note.points}</span> {note.skill} - {note.timestamp}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );

    const renderForensicEvidence = (scene) => {
        if (!scene.forensic_evidence) return null;

        return (
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-purple-800">🔬 Forensic Evidence Available:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scene.forensic_evidence.map((evidence, index) => (
                        <div key={index} className="bg-purple-50 p-4 rounded border border-purple-200">
                            <div className="font-medium text-purple-900">{evidence.type} - {evidence.location}</div>
                            <div className="text-sm text-purple-700 mt-1">{evidence.description}</div>
                            {evidence.analysis_required && (
                                <div className="text-xs text-purple-600 mt-2 italic">⚗️ Lab analysis required</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderWitnessInterview = (scene) => {
        if (scene.scene_type !== 'witness_interview' || !scene.witness) return null;

        return (
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-indigo-800">🎤 Witness Interview:</h3>
                <div className="bg-indigo-50 p-4 rounded border border-indigo-200">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <div className="font-semibold text-indigo-900">{scene.witness.name}</div>
                            <div className="text-sm text-indigo-700">{scene.witness.role}</div>
                        </div>
                        <div className="text-xs bg-indigo-200 px-2 py-1 rounded">
                            Demeanor: {scene.witness.demeanor}
                        </div>
                    </div>

                    <div className="bg-white p-3 rounded border-l-4 border-indigo-400 mb-3">
                        <div className="text-sm text-gray-600 mb-1">Initial Statement:</div>
                        <div className="text-indigo-800">"{scene.witness.initial_statement}"</div>
                    </div>

                    {scene.interview_questions && (
                        <div className="space-y-2">
                            <div className="text-sm font-medium text-indigo-800">Key Information Revealed:</div>
                            {scene.interview_questions.map((q, index) => (
                                <div key={index} className="text-sm bg-white p-2 rounded">
                                    <div className="text-indigo-700 font-medium">Q: {q.question}</div>
                                    <div className="text-gray-700 mt-1">A: {q.answer}</div>
                                    {q.credibility && (
                                        <div className="text-xs mt-1">
                                            <span className="text-gray-500">Credibility: </span>
                                            <span className={q.credibility === 'high' ? 'text-green-600' : q.credibility === 'medium' ? 'text-yellow-600' : 'text-red-600'}>
                                                {q.credibility}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {scene.psychology_assessment && (
                        <div className="mt-3 text-xs text-indigo-600 bg-indigo-100 p-2 rounded">
                            <div>📊 Psychological Assessment: {scene.psychology_assessment.body_language}</div>
                            <div>🎯 Reliability Score: {scene.psychology_assessment.reliability_score}/10</div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderDeductionChallenge = (scene) => {
        if (scene.scene_type !== 'logical_deduction' || !scene.deduction_challenge) return null;

        return (
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-red-800">🧠 Logical Deduction Challenge:</h3>
                <div className="bg-red-50 p-4 rounded border border-red-200">
                    <div className="mb-4">
                        <h4 className="font-medium text-red-900 mb-2">Evidence Summary:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                            {scene.evidence_summary.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    {scene.deduction_challenge.timeline_puzzle && (
                        <div className="mb-4">
                            <h4 className="font-medium text-red-900 mb-2">Timeline Analysis:</h4>
                            <div className="space-y-2">
                                {scene.deduction_challenge.timeline_puzzle.map((event, index) => (
                                    <div key={index} className="bg-white p-2 rounded flex justify-between text-sm">
                                        <span className="font-mono text-red-800">{event.time}</span>
                                        <span className="text-red-700">{event.event}</span>
                                        <span className="text-red-600 text-xs">({event.source})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const currentScene = getCurrentScene();

    // Component render logic remains similar but enhanced with new elements...
    if (!currentCase) {
        return (
            <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">🕵️ Realistic Detective Mystery Game</h1>

                <div className="text-center">
                    <h2 className="text-xl mb-6">Choose Your Case Type</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <button
                            onClick={() => createMystery('Victorian London', 'murder', 'foggy street')}
                            className="p-6 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            disabled={loading}
                        >
                            <div className="text-2xl mb-2">🔪</div>
                            <div className="font-semibold">Victorian Murder</div>
                            <div className="text-sm opacity-90">Forensic analysis • Witness interviews</div>
                        </button>
                        <button
                            onClick={() => createMystery('corporate office', 'fraud', 'financial district')}
                            className="p-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            disabled={loading}
                        >
                            <div className="text-2xl mb-2">💼</div>
                            <div className="font-semibold">Corporate Fraud</div>
                            <div className="text-sm opacity-90">Financial records • Digital forensics</div>
                        </button>
                        <button
                            onClick={() => createMystery('art gallery', 'theft', 'museum')}
                            className="p-6 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                            disabled={loading}
                        >
                            <div className="text-2xl mb-2">🎨</div>
                            <div className="font-semibold">Art Heist</div>
                            <div className="text-sm opacity-90">Security footage • Expert analysis</div>
                        </button>
                    </div>

                    {loading && (
                        <div className="mt-6 p-4 bg-blue-100 rounded-lg">
                            <p className="text-blue-800">🤖 AI is creating your realistic mystery case...</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (showExplanation && lastChoice) {
        return (
            <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-4">{currentCase.data.title}</h1>

                {renderDetectiveTools()}

                <div className={`p-6 rounded-lg mb-6 ${lastChoice.correct ? 'bg-green-100 border-green-500' : 'bg-yellow-100 border-yellow-500'} border-2`}>
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                        {lastChoice.correct ? '✅ Excellent Detective Work!' : '⚠️ Learning Opportunity'}
                    </h3>

                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                                {lastChoice.skillType || 'Investigation'} Skill
                            </span>
                            <span className="text-sm text-gray-600">Scene: {lastChoice.sceneType}</span>
                        </div>
                        <p className="font-medium">You chose: "{lastChoice.selectedText}"</p>
                    </div>

                    <div className="bg-white p-4 rounded border-l-4 border-gray-300 mb-4">
                        <h4 className="font-semibold mb-2">🎓 Detective Training Notes:</h4>
                        <p className="text-gray-700">{lastChoice.explanation}</p>
                    </div>

                    {lastChoice.skillDemonstrated && (
                        <div className="bg-blue-50 p-3 rounded mb-4">
                            <h5 className="font-medium text-blue-800">Skill Demonstrated: {lastChoice.skillDemonstrated}</h5>
                        </div>
                    )}

                    <button
                        onClick={continueToNextScene}
                        className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        Continue Investigation →
                    </button>
                </div>
            </div>
        );
    }

    if (!currentScene) {
        return (
            <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
                <p>Loading scene...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <div className="flex justify-between items-start mb-6">
                <h1 className="text-2xl font-bold">{currentCase.data.title}</h1>
                <button
                    onClick={resetGame}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
                >
                    New Case
                </button>
            </div>

            {renderDetectiveTools()}

            {/* Scene Description */}
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {currentScene.scene_type || 'Investigation'}
                    </span>
                </div>
                <p className="text-lg leading-relaxed">{currentScene.description}</p>
            </div>

            {renderForensicEvidence(currentScene)}
            {renderWitnessInterview(currentScene)}
            {renderDeductionChallenge(currentScene)}

            {/* Interactive Objects */}
            {currentScene.interactive_objects && (
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-green-800">🔍 Interactive Elements:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentScene.interactive_objects.map((obj, index) => (
                            <div key={index} className="bg-green-50 p-4 rounded border border-green-200">
                                <div className="font-medium text-green-900">{obj.name}</div>
                                <div className="text-sm text-green-700 mt-1">{obj.description}</div>
                                <div className="text-xs text-green-600 mt-2 font-medium">💡 {obj.clue_revealed}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Game End */}
            {currentScene.is_ending ? (
                <div className={`p-6 rounded-lg text-center ${currentScene.is_solved ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'} border-2`}>
                    <h3 className="text-2xl font-bold mb-4">
                        {currentScene.is_solved ? '🎉 Case Solved!' : '❌ Case Review Required'}
                    </h3>

                    <div className="mb-4">
                        <div className="text-lg font-semibold mb-2">Final Detective Score: {detectiveScore}</div>
                        <div className="text-md">{currentScene.detective_score}</div>
                    </div>

                    {currentScene.case_resolution && (
                        <div className="bg-white p-4 rounded mb-4 text-left">
                            <h4 className="font-semibold mb-2">Case Resolution:</h4>
                            <p>{currentScene.case_resolution}</p>
                        </div>
                    )}

                    {currentScene.lessons_learned && (
                        <div className="bg-white p-4 rounded mb-4 text-left">
                            <h4 className="font-semibold mb-2">🎓 Lessons Learned:</h4>
                            <ul className="list-disc list-inside space-y-1">
                                {currentScene.lessons_learned.map((lesson, index) => (
                                    <li key={index} className="text-sm">{lesson}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <button
                        onClick={resetGame}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        Start New Case
                    </button>
                </div>
            ) : (
                /* Action Options */
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold mb-3">🎯 Investigation Actions:</h3>
                    {currentScene.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => makeChoice(index)}
                            disabled={loading}
                            className="block w-full text-left p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-300 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="font-medium text-gray-800">{option.text}</span>
                                    {option.skill_type && (
                                        <div className="text-xs text-blue-600 mt-1">
                                            🎯 Skill: {option.skill_type.replace('_', ' ')}
                                        </div>
                                    )}
                                </div>
                                <span className="text-blue-600 group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {loading && (
                <div className="mt-4 p-4 bg-blue-100 rounded-lg text-center">
                    <p className="text-blue-800">🔍 Processing your investigative action...</p>
                </div>
            )}
        </div>
    );
};

export default MysteryGame;
