# Core Success Logic Lock

## 목적

이 문서는 현재 `comfyui_Lab`에서 실제로 성공이 확인된 핵심 이미지 생성 로직을 고정하기 위한 기준 문서다.

앞으로 UI, 메뉴, 시나리오 파서, 외부 LLM 프롬프트, 타임라인, WebM 출력 구조가 계속 바뀌더라도 아래 핵심 로직은 프로젝트의 중심 엔진으로 보존한다.

## 절대 버리지 말아야 할 성공 로직

현재 성공한 로직은 다음이다.

```text
참조 이미지 + 선택 모델 + 텍스트 프롬프트
→ 빠른 속도로 다량 이미지 생성
→ 일정한 주인공/등장인물/화풍 유지
→ 다양한 장면/동작을 텍스트로 제어
→ 생성 결과를 이미지+자막 형태로 프리뷰
```

이 로직은 지금까지의 실험 중 가장 중요한 성공 지점이다.

## 검증된 생성 구조

### 1. Character Reference 기반 일관성 유지

사용자가 좌측 `Character Reference`에 인물 기준 이미지를 넣는다.

이 이미지는 ComfyUI `/upload/image`로 input 폴더에 업로드되고, workflow 안에서는 `LoadImage`로 로드된다.

이후 `IPAdapterAdvanced`에 연결되어 인물의 얼굴, 복장, 전체 화풍, 캐릭터 인상을 유지한다.

### 2. IPAdapter non-FaceID 모델 사용

FaceID 계열 모델은 `insightface`와 전용 LoRA가 필요해 실행 오류가 발생했다.

따라서 현재 성공 기준은 non-FaceID IPAdapter 모델이다.

검증 우선 모델:

```text
ip-adapter-plus-face_sdxl_vit-h.safetensors
ip-adapter-plus_sdxl_vit-h.safetensors
ip-adapter_sdxl_vit-h.safetensors
```

현재 자동 방어 로직은 FaceID 모델을 감지하면 차단하고, 가능한 경우 non-FaceID 모델을 자동 선택한다.

### 3. CLIP Vision 연결

`IPAdapterAdvanced`에는 반드시 `CLIPVisionLoader` 출력이 `clip_vision` 입력으로 연결되어야 한다.

이 배선이 빠지면 다음 오류가 발생했다.

```text
Exception: Missing CLIPVision model.
```

현재 성공 구조:

```text
LoadImage(character)
→ IPAdapterModelLoader
→ CLIPVisionLoader
→ IPAdapterAdvanced
→ KSampler
```

### 4. combine_embeds 필수 입력

현재 설치된 `IPAdapterAdvanced` 노드는 `combine_embeds`를 필수 입력으로 요구한다.

이 값이 없으면 prompt validation 단계에서 실패한다.

현재 성공값:

```text
combine_embeds = "concat"
```

### 5. Pose Reference는 선택 기능

텍스트 프롬프트만으로도 많은 동작이 잘 반영되는 것이 확인되었다.

따라서 Pose Reference는 기본 필수가 아니라, 텍스트만으로 자세 제어가 실패할 때 사용하는 강제 제어 옵션이다.

Pose 사용 시 구조:

```text
LoadImage(pose)
→ DWPose / OpenPose / AIO_Preprocessor
→ ControlNetApplyAdvanced
→ KSampler
```

### 6. ControlNet 모델 패밀리 일치

SDXL checkpoint에 SD1.5 ControlNet을 연결하면 shape mismatch가 발생했다.

대표 오류:

```text
RuntimeError: mat1 and mat2 shapes cannot be multiplied (154x2048 and 768x320)
```

따라서 checkpoint와 ControlNet은 반드시 같은 계열이어야 한다.

```text
SDXL checkpoint → SDXL ControlNet
SD1.5 checkpoint → SD1.5 ControlNet
```

현재 성공 기준:

```text
Checkpoint: SDXL anime 계열
ControlNet: thibaud_xl_openpose.safetensors 또는 SDXL openpose 계열
```

## 핵심 workflow 개념도

### Character + Text 기본 생성

대량 생성의 기본값이다.

```text
CheckpointLoaderSimple
├─ CLIPTextEncode positive
├─ CLIPTextEncode negative
├─ EmptyLatentImage
├─ LoadImage(character)
├─ IPAdapterModelLoader(non-FaceID)
├─ CLIPVisionLoader
├─ IPAdapterAdvanced
├─ KSampler
├─ VAEDecode
└─ SaveImage
```

### Character + Pose + Text 정밀 생성

정확한 전신 포즈가 필요한 장면에서만 사용한다.

```text
CheckpointLoaderSimple
├─ CLIPTextEncode positive
├─ CLIPTextEncode negative
├─ EmptyLatentImage
├─ LoadImage(character)
├─ IPAdapterModelLoader(non-FaceID)
├─ CLIPVisionLoader
├─ IPAdapterAdvanced
├─ LoadImage(pose)
├─ OpenPose/DWPose Preprocessor
├─ ControlNetLoader(SDXL-compatible)
├─ ControlNetApplyAdvanced
├─ KSampler
├─ VAEDecode
└─ SaveImage
```

## 현재 성공 로직의 가치

이 로직은 단순한 테스트 기능이 아니라 향후 전체 프로젝트의 이미지 생성 엔진이다.

가치:

```text
1. 빠른 생성 속도
2. Character Reference 기반 일관성
3. 텍스트 프롬프트 기반 장면/동작 제어
4. 외부 LLM이 만든 Shot Card와 결합 가능
5. 대량 이미지 생성에 적합
6. 타임라인 프리뷰 및 WebM 출력 파이프라인과 연결 가능
```

## 앞으로의 개발 원칙

### 1. 핵심 생성 엔진과 UI를 분리한다

UI가 바뀌어도 아래 엔진 함수 개념은 유지한다.

```text
buildWorkflow(shot, characterRef, poseRef, mode)
uploadReferenceImage(file)
queuePrompt(workflow)
waitImage(promptId)
renderTimeline(shots)
```

### 2. UI는 바뀌어도 workflow 생성 규칙은 보존한다

메뉴 구조, 탭, 좌측 진행 메뉴, 외부 LLM 입력창은 계속 바뀔 수 있다.

하지만 아래 규칙은 그대로 유지한다.

```text
Character Reference → IPAdapterAdvanced
CLIPVisionLoader → IPAdapterAdvanced.clip_vision
combine_embeds="concat"
FaceID 모델 차단
ControlNet 계열 불일치 차단
Pose는 선택 옵션
```

### 3. 시나리오/대본 파싱은 별도 계층으로 개선한다

현재 문제는 ComfyUI 생성 엔진이 아니라 대본을 이미지 프롬프트로 변환하는 계층이다.

따라서 다음 개선 대상은 다음이다.

```text
SilverStudio scenes[]
→ visual_shots[]
→ image shot card
→ ComfyUI workflow
```

즉, 대본 JSON을 바로 이미지 프롬프트로 쓰지 않고, 반드시 시각 콘티 변환 단계를 둔다.

## LLM ↔ 사람 작업 구조

### 1. 사람이 하는 일

```text
- 전체 시나리오 방향 제시
- 주인공/등장인물 reference image 제공
- 화풍/장르 기준 제공
- 생성 결과 중 어긋난 장면 검수
- 중요한 장면만 재지시
```

### 2. 외부 LLM이 하는 일

```text
- 시나리오를 scenes[]로 구조화
- 각 scene에 약속/이행/openLoop 부여
- 각 scene을 visual_shots[]로 분해
- 각 visual_shot에 화면 요소 명시
- subtitle과 visual_prompt 분리
```

### 3. comfyui_Lab이 하는 일

```text
- JSON 파싱
- visual_shots[] flatten
- Character Reference 업로드
- 필요한 경우 Pose Reference 업로드
- 검증된 workflow 생성
- ComfyUI queue 전송
- 결과 이미지 수집
- 자막 타임라인 표시
- WebM preview 출력
```

## 앞으로 적용할 JSON 목표 구조

SilverStudio 대본 JSON은 최종적으로 아래 구조를 포함해야 한다.

```json
{
  "scenes": [
    {
      "label": "절벽으로 향하는 소철운",
      "promise": "소철운이 왜 서유운을 위험한 곳으로 데려가는지 의문을 만든다.",
      "content": "소철운이 서유운의 손목을 잡고 말없이 절벽 위로 데려갑니다. 서유운은 그가 자신을 구하려는 건지 버리려는 건지 알 수 없습니다.",
      "openLoop": "그 순간, 절벽 아래에서 죽은 줄 알았던 사부의 목소리가 들려옵니다.",
      "trustClaims": "해당 없음",
      "voiceNotes": "분당 130단어, 마지막 문장 후 1초 정적",
      "visual_shots": [
        {
          "shot_id": "S001",
          "duration_sec": 4,
          "subtitle": "소철운이 서유운을 절벽 위로 데려갑니다.",
          "characters": ["소철운", "서유운"],
          "location": "moonlit mountain cliff edge",
          "action": "a young martial arts student leads a frightened girl by the wrist toward the cliff edge",
          "camera": "wide shot, full body, both characters visible",
          "must_see": ["two characters", "cliff edge", "abyss below", "moonlight"],
          "avoid": ["single character portrait", "abstract background", "unrelated close-up"],
          "visual_prompt": "young martial arts student leading a frightened girl by the wrist toward the edge of a moonlit mountain cliff, both characters visible, steep abyss below, wind blowing their robes, tense protective atmosphere, cinematic anime wuxia, wide shot, full body, low angle, dramatic moonlight",
          "negative_prompt": "single character only, empty abstract background, unrelated portrait, modern city, microphone, stage, text, watermark, bad anatomy"
        }
      ]
    }
  ]
}
```

## 절대 금지

다음 작업은 금지한다.

```text
1. 성공한 IPAdapter + CLIPVision + Text 기반 workflow를 삭제하지 않는다.
2. FaceID 전용 구조를 기본값으로 바꾸지 않는다.
3. Pose ControlNet을 기본 강제하지 않는다.
4. scene.content를 그대로 visual_prompt로 쓰는 구조로 회귀하지 않는다.
5. UI 수정 중 workflow 생성 함수가 깨지지 않도록 한다.
6. 대량 생성 속도를 망치는 무거운 기본 workflow를 기본값으로 만들지 않는다.
```

## 다음 개발 단계

1. SilverStudio adapter가 `visual_shots[]`를 우선 파싱하도록 수정한다.
2. visual_shots가 없을 때만 scene.content 기반 fallback을 사용한다.
3. Shot List에 다음 항목을 눈으로 보이게 한다.

```text
subtitle
characters
location
action
camera
must_see
avoid
visual_prompt
```

4. Generate Imported Images는 scene이 아니라 visual_shot 단위로 실행한다.
5. 실패한 shot만 재생성하는 기능을 추가한다.
6. 생성 결과를 metadata와 함께 저장한다.

## 결론

현재 성공한 핵심은 다음 한 줄로 요약된다.

```text
Character Reference를 IPAdapter non-FaceID + CLIPVision으로 고정하고, 장면/동작은 텍스트 프롬프트로 빠르게 제어하는 대량 이미지 생성 엔진
```

이 엔진은 프로젝트의 핵심 자산이며, 앞으로의 모든 시나리오/대본/타임라인/동영상 기능은 이 엔진 위에 얹는다.