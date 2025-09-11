PUZZLE_PROMPT = """
Create a detailed mystery game with realistic detective elements:
Theme: {theme}
Mystery Type: {mystery_type}
Setting: {setting}

Generate a mystery that includes forensic evidence, witness interviews, and logical deduction:

---JSON START---
{{
  "title": "The {setting} {mystery_type}",
  "root_scene": "scene1",
  "case_summary": "A {mystery_type} has occurred at {setting} requiring professional investigation",
  "all_scenes": {{
    "scene1": {{
      "description": "You arrive at the crime scene. The {setting} shows clear signs of a {mystery_type}. As a detective, you must gather evidence systematically.",
      "scene_type": "investigation",
      "forensic_evidence": [
        {{"type": "fingerprints", "location": "door handle", "description": "Clear fingerprints visible", "analysis_required": true}},
        {{"type": "footprint", "location": "entrance", "description": "Boot print in mud", "analysis_required": true}}
      ],
      "interactive_objects": [
        {{"name": "broken window", "description": "Glass shards scattered", "clue_revealed": "forced entry"}},
        {{"name": "overturned furniture", "description": "Chair knocked over", "clue_revealed": "signs of struggle"}}
      ],
      "options": [
        {{"text": "Carefully collect and analyze forensic evidence", "scene_id": "forensics_lab", "skill_type": "forensic_analysis", "points": 3}},
        {{"text": "Interview available witnesses", "scene_id": "witness_interview", "skill_type": "interrogation", "points": 2}},
        {{"text": "Search the scene for additional clues", "scene_id": "detailed_search", "skill_type": "observation", "points": 2}}
      ],
      "is_ending": false,
      "is_solved": false
    }},
    "forensics_lab": {{
      "description": "In the forensics lab, you analyze evidence using scientific methods and professional equipment.",
      "scene_type": "forensic_analysis",
      "analysis_results": [
        {{"evidence": "fingerprints", "result": "Matches database record", "significance": "high"}},
        {{"evidence": "footprint", "result": "Size 10 work boot, specific brand", "significance": "medium"}}
      ],
      "options": [
        {{"text": "Cross-reference fingerprint match with witness statements", "scene_id": "logical_deduction", "skill_type": "research", "points": 3}},
        {{"text": "Immediately arrest the fingerprint match", "scene_id": "ending_wrong", "skill_type": "premature_conclusion", "points": -1}}
      ],
      "is_ending": false,
      "is_solved": false
    }},
    "witness_interview": {{
      "description": "You conduct professional interviews with witnesses, carefully noting their statements and observing their behavior.",
      "scene_type": "witness_interview",
      "witness": {{
        "name": "Security Guard",
        "role": "Building Security",
        "demeanor": "cooperative",
        "initial_statement": "I saw someone with legitimate access here earlier today"
      }},
      "options": [
        {{"text": "Verify the person's legitimate access", "scene_id": "logical_deduction", "skill_type": "research", "points": 3}},
        {{"text": "Focus only on who was present during the incident", "scene_id": "forensics_lab", "skill_type": "investigation", "points": 1}}
      ],
      "is_ending": false,
      "is_solved": false
    }},
    "logical_deduction": {{
      "description": "You carefully analyze all evidence, witness statements, and background information to reach a logical conclusion.",
      "scene_type": "logical_deduction",
      "evidence_summary": [
        "Fingerprints show presence but person had legitimate access",
        "Witness confirms normal authorized presence earlier",
        "Timeline indicates incident occurred after authorized hours",
        "Additional evidence points to different perpetrator"
      ],
      "options": [
        {{"text": "Continue investigation for the real perpetrator", "scene_id": "ending_correct", "skill_type": "logical_deduction", "points": 5}},
        {{"text": "Close case with circumstantial evidence", "scene_id": "ending_wrong", "skill_type": "incomplete_investigation", "points": -1}}
      ],
      "is_ending": false,
      "is_solved": false
    }},
    "ending_correct": {{
      "description": "Excellent detective work! Your thorough investigation and logical analysis prevented wrongful accusations and identified the real perpetrator through proper evidence gathering and deduction.",
      "detective_score": "Outstanding Detective",
      "case_resolution": "Proper investigative procedures led to correct suspect identification while protecting innocent parties.",
      "lessons_learned": [
        "Systematic evidence collection is crucial",
        "Background verification prevents false accusations",
        "Witness statements must be corroborated",
        "Logical analysis trumps circumstantial assumptions"
      ],
      "is_ending": true,
      "is_solved": true
    }},
    "ending_wrong": {{
      "description": "Your investigation reached premature conclusions. While some evidence pointed to a suspect, proper detective work requires comprehensive analysis before making accusations.",
      "detective_score": "Needs Improvement",
      "case_resolution": "Incomplete investigation led to potential wrongful accusations and missed the real perpetrator.",
      "lessons_learned": [
        "Never rush to judgment with partial evidence",
        "Presence at a scene doesn't prove guilt",
        "Always verify background information",
        "Consider all possibilities before concluding"
      ],
      "is_ending": true,
      "is_solved": false
    }}
  }}
}}
---JSON END---

Make this a realistic detective experience with proper forensic methods and logical deduction!
"""

CHOICE_EXPLANATION_PROMPT = """
Detective chose: {choice_text}
Scene: {scene_description}
Skill used: {skill_type}

Explain why this detective approach was {"excellent" if is_correct else "problematic"} and what investigative principle this demonstrates. Keep it educational and practical (2-3 sentences).
"""
