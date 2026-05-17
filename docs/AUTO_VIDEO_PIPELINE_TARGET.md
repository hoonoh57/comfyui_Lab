# Auto Video Pipeline Target

## Final goal

The product is not a parameter-tuning playground. The product goal is:

1. Input a martial-arts or story scenario.
2. Automatically split the scenario into image-generation units.
3. Generate stable per-scene image prompts using a fixed character reference.
4. Select the fastest reliable ComfyUI workflow preset for each scene.
5. Batch-generate all images.
6. Place generated images and subtitles on a time-ordered editing track.
7. Preview the sequence as a rough video timeline.
8. Export later to an actual video pipeline.

## Core principle

Do not expose endless low-level parameters as the main workflow.

The UI should expose production-level modes:

- Fast Text Scene
- Character Stable Scene
- Exact Pose Scene
- Close-up Dialogue Scene
- Action Wide Shot
- Background / Establishing Shot

Each mode maps internally to a tested workflow preset.

## Recommended workflow policy

### 1. Default mode: Character + Text

Use this for most scenes.

- Reference image: character face / outfit
- Prompt: action, camera, mood, background
- IPAdapter: enabled
- ControlNet pose: disabled

Purpose:

- fastest generation
- stable enough identity
- best for hundreds of story images

### 2. Pose mode: Character + Pose + Text

Use only for scenes where text cannot force the body pose.

Examples:

- sword raised overhead
- kneeling with one arm extended
- flying kick
- spear thrust
- two-person duel pose

Purpose:

- exact silhouette / body action
- slower and more fragile
- not default

### 3. Text-only mode

Use for backgrounds, objects, crowd shots, atmospheric shots.

Purpose:

- fastest batch generation
- no identity requirement

## Scenario-to-shot unit

Each scenario is converted into shot cards:

```json
{
  "shot_id": "S001",
  "order": 1,
  "duration_sec": 4,
  "scene_text": "The wounded swordsman raises his sword under the moonlight.",
  "subtitle": "그가 피 묻은 검을 천천히 들어 올렸다.",
  "visual_prompt": "wounded swordsman raising sword under moonlight, cinematic wuxia, dramatic wind, full body",
  "negative_prompt": "low quality, blurry, extra fingers, bad anatomy, text, watermark",
  "character_ref": "main_hero.png",
  "pose_ref": "sword_raised_overhead.png",
  "workflow_mode": "Exact Pose Scene",
  "seed_policy": "fixed_per_character",
  "status": "pending"
}
```

## Pipeline stages

### Stage A. Scenario Parser

Input:

- long scenario / script

Output:

- ordered shot cards
- subtitle text
- duration estimate
- shot type

### Stage B. Prompt Planner

Input:

- shot cards
- character bible
- style bible

Output:

- final positive prompt
- final negative prompt
- workflow mode
- reference image mapping

### Stage C. Workflow Selector

Rules:

- if shot requires stable character but not exact pose: Character Stable Scene
- if shot requires exact body silhouette: Exact Pose Scene
- if shot is background: Text-only
- if shot is close-up dialogue: Character Stable Close-up

### Stage D. Batch ComfyUI Runner

Input:

- shot cards

Output:

- generated images
- metadata JSON
- failure list
- retry suggestions

### Stage E. Timeline Builder

Input:

- generated images
- subtitles
- duration

Output:

- preview timeline
- frame list
- later: ffmpeg export

## Immediate implementation order

1. Add workflow mode switch to UI.
2. Make Pose optional and default OFF.
3. Add batch shot-card JSON input.
4. Add Generate Batch button.
5. Save every result with metadata.
6. Add timeline preview panel.
7. Add subtitle overlay preview.

## Success metric

The project should be evaluated by production throughput, not parameter experimentation.

Primary metric:

- How many usable story images can be generated per hour while preserving character identity?

Secondary metric:

- character consistency
- action correctness
- prompt adherence
- generation speed
- retry rate

## Working default for the next phase

Start with:

- Character Stable Scene as the default mode
- Pose OFF by default
- IPAdapter non-FaceID SDXL model
- SDXL anime checkpoint
- text prompt drives action
- pose only when a shot is marked exact_pose_required

This prevents the project from being trapped in endless parameter tuning.