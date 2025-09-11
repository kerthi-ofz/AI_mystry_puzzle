from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends
from core.mystery_generator import MysteryGenerator
from core.prompts import PUZZLE_PROMPT, CHOICE_EXPLANATION_PROMPT
from schemas import MysteryCaseCreate, JobResponse, MysteryCaseResponse, ChoiceSelection, ChoiceResult
from models import MysteryCase, Job, JobStatus, GameSession
from db import SessionLocal
import uuid
import json
import logging

router = APIRouter()
generator = MysteryGenerator()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/create", response_model=JobResponse)
def create_case(request: MysteryCaseCreate, background_tasks: BackgroundTasks):
    db = SessionLocal()
    job_id = str(uuid.uuid4())
    job = Job(id=job_id, status=JobStatus.processing)
    db.add(job)
    db.commit()
    db.close()

    background_tasks.add_task(_generate_case, job_id, request)
    return JobResponse(job_id=job_id, status=JobStatus.processing)

def _generate_case(job_id: str, request: MysteryCaseCreate):
    db = SessionLocal()
    try:
        prompt = PUZZLE_PROMPT.format(
            theme=request.theme,
            mystery_type=request.mystery_type,
            setting=request.setting or "default setting",
        )
        
        story_text = generator.generate(prompt, max_new_tokens=800)
        
        # JSON extraction logic (same as before)
        story_json = None
        
        start = story_text.find("---JSON START---")
        end = story_text.find("---JSON END---")
        if start != -1 and end != -1:
            json_str = story_text[start + len("---JSON START---") : end].strip()
            try:
                story_json = json.loads(json_str)
            except json.JSONDecodeError:
                pass
        
        if story_json is None:
            start = story_text.find("{")
            if start != -1:
                brace_count = 0
                end = start
                for i, char in enumerate(story_text[start:], start):
                    if char == "{":
                        brace_count += 1
                    elif char == "}":
                        brace_count -= 1
                        if brace_count == 0:
                            end = i + 1
                            break
                
                json_str = story_text[start:end]
                try:
                    story_json = json.loads(json_str)
                except json.JSONDecodeError:
                    pass
        
        # Enhanced fallback with realistic detective elements
        if story_json is None:
            story_json = create_realistic_fallback_mystery(request)

        case_id = str(uuid.uuid4())
        case = MysteryCase(id=case_id, data=story_json)
        db.add(case)
        
        # Create game session for tracking
        session = GameSession(
            id=str(uuid.uuid4()),
            case_id=case_id,
            detective_score=0,
            evidence_collected=[],
            witnesses_interviewed=[],
            deduction_points=0
        )
        db.add(session)
        
        job = db.query(Job).filter(Job.id == job_id).first()
        job.case_id = case_id
        job.status = JobStatus.completed
        db.commit()
        
    except Exception as e:
        logging.exception(f"Job {job_id} generation failed")
        job = db.query(Job).filter(Job.id == job_id).first()
        job.status = JobStatus.failed
        job.error = str(e)
        db.commit()
    finally:
        db.close()

@router.get("/{case_id}", response_model=MysteryCaseResponse)
def get_case(case_id: str):
    db = SessionLocal()
    case = db.query(MysteryCase).filter(MysteryCase.id == case_id).first()
    db.close()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return MysteryCaseResponse(id=case_id, data=case.data)

@router.post("/choice", response_model=ChoiceResult)
def make_choice(choice: ChoiceSelection, db: SessionLocal = Depends(get_db)):
    try:
        # Query case within the active session
        case = db.query(MysteryCase).filter(MysteryCase.id == choice.case_id).first()
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        
        # Query or create game session within the active session
        game_session = db.query(GameSession).filter(GameSession.case_id == choice.case_id).first()
        if not game_session:
            # Create session if doesn't exist
            game_session = GameSession(
                id=str(uuid.uuid4()),
                case_id=choice.case_id,
                detective_score=0,
                evidence_collected=[],
                witnesses_interviewed=[],
                deduction_points=0
            )
            db.add(game_session)
            db.flush()  # Flush to assign ID but don't commit yet
        
        # Get scene data
        scene = case.data["all_scenes"].get(choice.scene_id)
        if not scene:
            raise HTTPException(status_code=404, detail="Scene not found")
        
        if choice.option_index >= len(scene["options"]):
            raise HTTPException(status_code=400, detail="Invalid option")
        
        selected_option = scene["options"][choice.option_index]
        
        # Calculate detective scoring
        skill_points = calculate_skill_points(selected_option, scene)
        game_session.detective_score += skill_points
        
        # Generate contextual explanation
        explanation = generate_detective_explanation(selected_option, scene, game_session)
        
        # Commit changes
        db.commit()
        
        # Refresh the object to ensure it's bound to session
        db.refresh(game_session)
        
        # Store values before session ends
        detective_score = game_session.detective_score
        skill_type = selected_option.get("skill_type", "investigation")
        evidence_gained = scene.get("forensic_evidence", []) if scene.get("scene_type") == "investigation" else []
        
        return ChoiceResult(
            explanation=explanation,
            correct=skill_points > 0,
            next_scene_id=selected_option["scene_id"],
            detective_score=detective_score,
            skill_demonstrated=skill_type,
            evidence_gained=evidence_gained,
            success_message="Good detective work!" if skill_points > 0 else "Keep investigating!"
        )
        
    except Exception as e:
        db.rollback()
        raise e

def calculate_skill_points(option, scene):
    """Calculate points based on detective skill demonstration"""
    skill_type = option.get("skill_type", "")
    base_points = option.get("points", 1)
    
    # Bonus points for proper forensic procedures
    if skill_type == "forensic_analysis" and scene.get("scene_type") == "forensic_analysis":
        base_points += 2
    elif skill_type == "interrogation" and scene.get("scene_type") == "witness_interview":
        base_points += 1
    elif skill_type == "observation" and "interactive_objects" in scene:
        base_points += 1
    
    return base_points

def generate_detective_explanation(option, scene, session):
    """Generate educational explanation about detective work"""
    skill_type = option.get("skill_type", "investigation")
    
    explanations = {
        "forensic_analysis": "Forensic evidence provides objective, scientific proof that can't be influenced by memory or bias. This methodical approach strengthens your case.",
        "interrogation": "Proper witness interviews require active listening and strategic questioning. Notice their body language and consistency in statements.",
        "observation": "Careful crime scene examination often reveals crucial details. Every piece of evidence tells part of the story.",
        "research": "Background checks and cross-referencing information helps verify witness statements and identify connections.",
        "logical_deduction": "Combining all evidence through logical reasoning prevents jumping to conclusions and ensures accuracy."
    }
    
    base_explanation = explanations.get(skill_type, "Every investigative step builds your understanding of the case.")
    
    # Add context based on current progress
    current_score = session.detective_score
    if current_score > 8:
        return f"{base_explanation} Your methodical approach is paying off - you're building a strong case!"
    elif current_score > 4:
        return f"{base_explanation} You're making steady progress in your investigation."
    else:
        return f"{base_explanation} Consider gathering more evidence before drawing conclusions."

def create_realistic_fallback_mystery(request):
    """Create a realistic detective mystery if AI generation fails"""
    return {
        "title": f"The {request.setting.title()} {request.mystery_type.title()}",
        "root_scene": "crime_scene",
        "case_summary": f"A {request.mystery_type} has occurred at {request.setting}. You must use proper detective techniques to solve it.",
        "evidence_inventory": [],
        "witness_statements": [],
        "all_scenes": {
            "crime_scene": {
                "description": f"You arrive at the {request.setting} where a {request.mystery_type} has taken place. The scene shows clear signs of disturbance and requires careful investigation.",
                "scene_type": "investigation",
                "forensic_evidence": [
                    {"type": "fingerprints", "location": "entrance", "description": "Clear prints on the door handle", "analysis_required": True},
                    {"type": "footprints", "location": "floor", "description": "Muddy boot prints leading inside", "analysis_required": True}
                ],
                "interactive_objects": [
                    {"name": "broken lock", "description": "Lock shows fresh tool marks", "clue_revealed": "forced entry"},
                    {"name": "dropped item", "description": "Personal belonging on the floor", "clue_revealed": "belongs to someone with initials J.S."}
                ],
                "options": [
                    {"text": "Collect and analyze forensic evidence carefully", "scene_id": "forensics", "skill_type": "forensic_analysis", "points": 3},
                    {"text": "Interview witnesses immediately", "scene_id": "interviews", "skill_type": "interrogation", "points": 2},
                    {"text": "Search for more clues at the scene", "scene_id": "detailed_search", "skill_type": "observation", "points": 2}
                ],
                "is_ending": False,
                "is_solved": False
            },
            "forensics": {
                "description": "In the forensics lab, you carefully analyze the collected evidence using professional equipment and scientific methods.",
                "scene_type": "forensic_analysis",
                "analysis_results": [
                    {"evidence": "fingerprints", "result": "Matches database: J. Smith, age 32, no criminal record", "significance": "high"},
                    {"evidence": "footprints", "result": "Size 11 work boot, WorkMaster brand with distinctive wear pattern", "significance": "medium"}
                ],
                "options": [
                    {"text": "Cross-reference J. Smith in local records and employment", "scene_id": "background_check", "skill_type": "research", "points": 3},
                    {"text": "Return to scene with new forensic information", "scene_id": "crime_scene", "skill_type": "investigation", "points": 1}
                ],
                "is_ending": False,
                "is_solved": False
            },
            "interviews": {
                "description": "You conduct professional interviews with witnesses, carefully noting their statements and body language.",
                "scene_type": "witness_interview",
                "witness": {
                    "name": "Security Guard Mike",
                    "role": "Night Security",
                    "demeanor": "nervous",
                    "initial_statement": "I saw J. Smith here earlier today during his shift"
                },
                "interview_questions": [
                    {
                        "question": "What time did you see J. Smith?",
                        "answer": "Around 3 PM, during normal work hours",
                        "credibility": "high"
                    },
                    {
                        "question": "Did anything seem unusual about his behavior?",
                        "answer": "No, he seemed normal. Just doing his regular maintenance work",
                        "credibility": "high"
                    }
                ],
                "options": [
                    {"text": "Verify J. Smith's work schedule and duties", "scene_id": "background_check", "skill_type": "research", "points": 3},
                    {"text": "Immediately suspect J. Smith based on fingerprints", "scene_id": "ending_bad", "skill_type": "premature_conclusion", "points": -2}
                ],
                "is_ending": False,
                "is_solved": False
            },
            "background_check": {
                "description": "Your research reveals J. Smith is a legitimate maintenance worker with authorized access to the building and no criminal history.",
                "scene_type": "research",
                "options": [
                    {"text": "Look for alternative suspects and additional evidence", "scene_id": "ending_good", "skill_type": "logical_deduction", "points": 5},
                    {"text": "Arrest J. Smith based solely on fingerprint evidence", "scene_id": "ending_bad", "skill_type": "premature_conclusion", "points": -2}
                ],
                "is_ending": False,
                "is_solved": False
            },
            "ending_good": {
                "description": "Outstanding detective work! Your thorough investigation revealed that J. Smith had legitimate access during work hours. Further investigation identified the real culprit through additional evidence and witnesses.",
                "detective_score": "Expert Detective",
                "case_resolution": "Proper investigative procedures prevented wrongful accusation and led to correct suspect identification.",
                "lessons_learned": [
                    "Presence at a scene doesn't equal guilt",
                    "Background verification is crucial before accusations",
                    "Multiple evidence sources strengthen investigations",
                    "Logical deduction prevents false conclusions"
                ],
                "is_ending": True,
                "is_solved": True
            },
            "ending_bad": {
                "description": "Your investigation was too hasty and jumped to conclusions. While J. Smith was present, proper detective work requires considering all possibilities and gathering complete evidence.",
                "detective_score": "Needs Additional Training",
                "case_resolution": "Premature conclusions led to potential wrongful accusation and incomplete investigation.",
                "lessons_learned": [
                    "Never jump to conclusions without complete evidence",
                    "Authorized presence doesn't indicate criminal activity",
                    "Always verify background information",
                    "Consider alternative explanations before deciding"
                ],
                "is_ending": True,
                "is_solved": False
            }
        }
    }
