# Immutable Core and Pluggable Block Architecture

## 목적

`comfyui_Lab / SilverStudio`는 앞으로 계속 새로운 요구사항이 생긴다.

예:

```text
- 소재 발굴 기능 확장
- 통계/시장/경쟁 콘텐츠 분석
- 랭커 콘텐츠 강점 분석
- 새 프로젝트 후보 10개 자동 추천
- 시나리오 생성 방식 변경
- visual_shots 변환 방식 개선
- 이미지 생성 엔진 실험
- 외부 편집툴 연동
```

이때 기존에 성공한 로직을 매번 수정하면 프로젝트는 금방 깨진다.

따라서 처음부터 아래 구조로 설계한다.

```text
불변구조 Core 80~90%
+
가변구조 Plugin / Block 10~20%
```

새 기능은 기존 구조를 뜯어고치는 방식이 아니라, `블록 단위 삽입/삭제/교체` 방식으로 붙인다.

## 핵심 원칙

### 1. 성공한 로직은 Core로 승격한다

현재 성공한 ComfyUI 이미지 생성 엔진은 Core로 승격한다.

```text
core_success_engine_v1
```

이 엔진은 삭제하거나 임의 변경하지 않는다.

새로운 이미지 생성 방식은 별도 버전으로 추가한다.

```text
core_success_engine_v2_exp_pose_strict
core_success_engine_v2_exp_faceid
core_success_engine_v2_exp_video_motion
```

### 2. 단계는 Pipeline Node로 정의한다

전체 제작 과정은 고정된 절차가 아니라, 삽입 가능한 노드들의 연결이다.

```text
ProjectPipeline
  ├─ MaterialDiscoveryNode
  ├─ ProjectRegistrationNode
  ├─ ScenarioCrudNode
  ├─ VisualShotPlanningNode
  ├─ MediaGenerationNode
  ├─ TimelineEditNode
  ├─ ExportNode
  └─ CompletionNode
```

각 노드는 독립적인 입출력 계약을 가진다.

### 3. 노드는 입력/출력 계약만 맞추면 교체 가능해야 한다

예를 들어 `MaterialDiscoveryNode`는 내부 구현이 어떻게 바뀌어도 다음 출력 계약만 유지하면 된다.

```json
{
  "materials": [
    {
      "material_id": "M001",
      "title": "string",
      "source": "string",
      "score": 0,
      "evidence": [],
      "recommended_projects": []
    }
  ]
}
```

그러면 기존의 `ProjectRegistrationNode`, `ScenarioCrudNode`는 수정하지 않아도 된다.

### 4. 새 기능은 Node로 끼워 넣는다

예를 들어 향후 소재 발굴을 강화한다면 기존 흐름을 뜯지 않고 아래처럼 삽입한다.

기존:

```text
MaterialDiscoveryNode
→ ProjectRegistrationNode
```

확장 후:

```text
MaterialDiscoveryNode
→ RankingMediaResearchNode
→ StrengthAnalysisNode
→ ProjectProposalNode
→ ProjectRegistrationNode
```

기존 노드는 그대로 두고, 중간에 새로운 노드를 삽입한다.

### 5. UI는 Node 상태를 보여줄 뿐이다

UI는 로직을 소유하지 않는다.

UI는 다음을 보여준다.

```text
- 현재 선택된 node
- node 입력값
- node 실행 결과
- 성공/실패 상태
- 이전 node / 다음 node
```

즉, UI를 개편해도 Core Engine과 Pipeline Node는 유지된다.

## 전체 계층 구조

```text
┌─────────────────────────────────────────────┐
│ UI Layer                                    │
│ - Wizard Shell                              │
│ - TreeView                                  │
│ - Current Task Page                         │
│ - Inspector Dialog                          │
│ - Timeline Preview                          │
└─────────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│ Pipeline Layer                              │
│ - Node Registry                             │
│ - Task Graph                                │
│ - Node Input/Output Contract                │
│ - Status / Result Store                     │
└─────────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│ Planning Layer                              │
│ - SilverStudio scenes[]                     │
│ - visual_shots[]                            │
│ - prompt planner                            │
│ - script/scene CRUD                         │
└─────────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│ Engine Layer                                │
│ - core_success_engine_v1                    │
│ - ComfyUI queue                             │
│ - reference upload                          │
│ - image collection                          │
└─────────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│ Storage Layer                               │
│ - project.json                              │
│ - scenes.json                               │
│ - visual_shots.json                         │
│ - media_assets.json                         │
│ - timeline.json                             │
└─────────────────────────────────────────────┘
```

## 불변구조 Core

다음은 기본적으로 불변 구조로 둔다.

```text
1. core_success_engine_v1
2. Node contract schema
3. Pipeline state format
4. Project asset registry
5. Media asset metadata
6. Timeline track data format
7. Engine versioning policy
```

불변 구조는 변경하지 않고 버전업한다.

## 가변구조 Plugin / Block

다음은 언제든 추가/삭제 가능한 가변 구조다.

```text
1. Material discovery plugin
2. Ranking media analysis plugin
3. External LLM prompt template
4. Scenario generation strategy
5. Visual shot conversion strategy
6. Retry strategy
7. Export format plugin
8. External editing tool connector
9. Experimental ComfyUI engine
```

## Node Contract 기본 형식

모든 노드는 아래 형식을 따른다.

```json
{
  "node_id": "material.discovery.basic",
  "node_type": "MaterialDiscovery",
  "version": "1.0.0",
  "title": "소재 발굴",
  "parent_id": "root",
  "previous_node_id": "none",
  "next_node_id": "project.registration",
  "input_schema": {},
  "output_schema": {},
  "status": "pending",
  "result_ref": "",
  "created_at": "",
  "updated_at": ""
}
```

## 예시: 소재 발굴 확장 삽입

### 기존 단순 흐름

```text
수재발굴
→ 프로젝트등록
→ 시나리오 CRUD
→ 미디어 CRUD
→ 멀티트랙 편집
→ 출력
```

### 확장 요구사항

```text
전문 통계분석 매체를 집중 조사
→ 최상위 랭커 콘텐츠 분석
→ 강점 분석
→ 새 소재 프로젝트 10개 추천
```

### 새 노드 삽입

```text
MaterialDiscoveryNode
→ RankingMediaResearchNode
→ TopRankContentAnalysisNode
→ StrengthExtractionNode
→ ProjectIdeaProposalNode
→ ProjectRegistrationNode
```

### 기존 영향

```text
ProjectRegistrationNode 이후 로직은 유지
ScenarioCrudNode 유지
MediaGenerationNode 유지
core_success_engine_v1 유지
TimelineEditNode 유지
```

## Node Registry 예시

```json
{
  "nodes": [
    {
      "node_id": "material.discovery.basic",
      "title": "소재 발굴",
      "type": "MaterialDiscovery",
      "implementation": "plugins/material_discovery_basic.js",
      "stable": true
    },
    {
      "node_id": "material.discovery.ranking_media_research",
      "title": "랭커 콘텐츠 분석",
      "type": "MaterialDiscoveryExtension",
      "implementation": "plugins/ranking_media_research.js",
      "stable": false
    },
    {
      "node_id": "media.generate.core_v1",
      "title": "이미지 일괄 생성 core v1",
      "type": "MediaGeneration",
      "implementation": "engines/core_success_engine_v1.js",
      "stable": true
    }
  ]
}
```

## UI 적용 방식

좌측 TreeView는 하드코딩 메뉴가 아니라 Node Registry를 읽어 구성한다.

```text
Root
├─ 수재발굴
│  ├─ 기본 소재 발굴
│  ├─ 랭커 콘텐츠 분석
│  └─ 프로젝트 후보 추천
├─ 프로젝트등록
├─ 시나리오 CRUD
├─ 미디어 CRUD
├─ 멀티트랙 편집
└─ 완성
```

새 노드를 추가하면 TreeView에 자동으로 표시된다.

## 작업 상태 흐름

각 노드는 다음 상태를 가진다.

```text
pending
running
success
failed
skipped
needs_review
```

UI는 이 상태를 보여준다.

성공하면 다음 노드로 이동한다.

실패하면 현재 노드에서 수정/재시도한다.

## 파일 구조 제안

```text
/app
  index.html
  ui_wizard_v3.js

/core
  pipeline_runtime.js
  node_registry.js
  project_state.js

/engines
  core_success_engine_v1.js
  core_success_engine_v2_exp_pose_strict.js

/plugins
  material_discovery_basic.js
  ranking_media_research.js
  project_proposal.js
  silverstudio_scene_adapter.js
  visual_shot_planner.js

/schemas
  node_contract.schema.json
  project.schema.json
  scene.schema.json
  visual_shot.schema.json
  media_asset.schema.json
  timeline.schema.json

/docs
  CORE_SUCCESS_LOGIC_LOCK.md
  ENGINE_VERSIONING_POLICY.md
  UI_WIZARD_REDESIGN_SPEC.md
  IMMUTABLE_CORE_AND_PLUGGABLE_BLOCK_ARCHITECTURE.md
```

## 구현 우선순위

### Phase 1. 안정화

```text
1. core_success_engine_v1.js 분리
2. silverstudio_adapter.js를 plugin 형태로 분리
3. project_state.js 추가
4. node_registry.js 추가
5. ui_wizard_v3.js가 registry 기반으로 메뉴 표시
```

### Phase 2. 확장성 확보

```text
1. visual_shots[] 우선 파싱
2. 실패 shot 재생성
3. media_asset metadata 저장
4. timeline track 저장
```

### Phase 3. 소재 발굴 확장 삽입

```text
1. material_discovery_basic plugin
2. ranking_media_research plugin
3. top-rank content strength analysis plugin
4. project proposal plugin
```

## 결론

앞으로 SilverStudio는 기능을 계속 붙이는 방식이 아니라, `불변 Core + 가변 Node Block` 방식으로 확장한다.

성공한 기존 로직은 Core로 고정하고, 새 요구사항은 독립 Node로 삽입한다.

이 구조라면 중간에 어떤 요구사항이 생겨도 프로젝트 전체를 다시 만들 필요 없이, 해당 단계 앞뒤에 새로운 블록을 끼워 넣을 수 있다.
