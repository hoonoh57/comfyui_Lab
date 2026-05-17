# UI Wizard Redesign Spec

## 목적

현재 UI는 기능을 빠르게 확장하면서 단일 화면에 많은 기능이 노출되어 있다.

다음 단계부터 UI는 `작업 마법사형 Studio UI`로 재설계한다.

목표는 다음이다.

```text
하나의 화면 = 하나의 현재 작업
좌측 = 전체 작업 트리
상단 = 현재 작업의 부모/이전/다음 경로
중앙 = 프롬프트 입력 + 결과 확인
상세 = 필요할 때만 다이얼로그
엔진 = core_success_engine_v1 유지
```

## 절대 유지해야 할 엔진 원칙

UI가 어떻게 바뀌어도 아래 엔진은 유지한다.

```text
core_success_engine_v1
Character Reference
→ IPAdapter non-FaceID
→ CLIPVisionLoader
→ IPAdapterAdvanced(combine_embeds="concat")
→ Text Prompt action/scene control
→ fast batch image generation
→ image + subtitle preview
```

UI 개편은 Engine Layer를 대체하지 않는다.

## 새 UI 정보 구조

### 좌측 TreeView 메뉴

```text
01. 수재발굴
    └ 후보 아이디어 입력
    └ 후보 평가
    └ 선택 확정

02. 프로젝트등록
    └ 프로젝트 정보
    └ 캐릭터/화풍 기준
    └ 참조 이미지 등록

03. 시나리오 CRUD
    └ 시나리오 작성
    └ SilverStudio 대본 생성
    └ scenes[] 검수
    └ visual_shots[] 변환

04. 미디어 CRUD
    └ 이미지 생성
    └ 실패 장면 재생성
    └ 자막/이미지 매칭 검수

05. 멀티트랙 편집 / 프로젝트 출력
    └ 이미지 트랙
    └ 자막 트랙
    └ BGM/TTS 트랙
    └ WebM/MP4 출력

06. 외부 편집툴 작업
    └ FFmpeg/ComfyUI/외부 편집 연계
    └ 보정본 재수입

07. 완성
    └ 최종 검수
    └ 게시용 산출물 패키징
```

## 상단 Navigation Bar

상단에는 현재 위치를 명확하게 표시한다.

```text
이전 작업 ← 현재 작업 → 다음 작업
부모 경로: 프로젝트 > 시나리오 CRUD > visual_shots 변환
```

사용자는 현재 작업이 전체 프로젝트 중 어디에 있는지 즉시 알 수 있어야 한다.

## 중앙 작업 화면 규칙

각 작업 페이지는 다음 구성만 기본으로 노출한다.

```text
1. 작업 제목
2. 작업 목적 한 줄
3. 프롬프트/입력창 하나
4. 실행 버튼
5. 결과 패널
6. 성공 시 다음 작업 버튼
7. 상세 설정 버튼
```

복잡한 파라미터는 메인 화면에 노출하지 않는다.

## 상세 설정 다이얼로그

아래 항목은 필요할 때만 다이얼로그로 표시한다.

```text
- Checkpoint 선택
- IPAdapter 선택
- CLIP Vision 선택
- ControlNet 선택
- Steps / CFG / Sampler / Scheduler
- Engine version 선택
- Retry 정책
- Export codec / fps / resolution
```

## 성공 기준

각 작업은 성공 상태를 가져야 한다.

```json
{
  "task_id": "scenario.visual_shots",
  "status": "pending | running | success | failed",
  "output_ref": "generated object id or file path",
  "next_task_id": "media.images.generate"
}
```

성공하면 다음 작업으로 자연스럽게 이동한다.

## UI와 데이터 구조 분리

UI는 화면만 담당한다.

작업 데이터는 향후 아래 구조로 분리한다.

```text
project
scenario
scenes
visual_shots
media_assets
timeline_tracks
export_jobs
```

## Wizard UI v2 구현 기준

1차 구현은 기존 기능을 완전히 삭제하지 않고, 새 Studio Shell을 위에 얹는다.

```text
ui_wizard_v2.js
```

역할:

```text
- 좌측 TreeView 메뉴 생성
- 상단 이전/현재/다음 경로 표시
- 중앙 단순 작업 화면 생성
- 기존 복잡 UI는 보조 레거시 영역으로 숨김
- 상세 설정은 Model Panel 버튼으로만 노출
```

## 다음 구현 순서

```text
1. ui_wizard_v2.js 추가
2. index.html에 로드
3. 기존 화면을 legacy area로 내리고 Wizard Shell을 기본 노출
4. 시나리오 CRUD > SilverStudio 대본 생성 작업부터 연결
5. visual_shots[] 변환 작업 연결
6. 미디어 CRUD > 이미지 일괄 생성 연결
7. 멀티트랙 프리뷰 연결
```

## 핵심 결론

앞으로 메인 UI는 기능 나열판이 아니라 제작 흐름을 안내하는 Studio Wizard가 되어야 한다.

```text
수재발굴
→ 프로젝트등록
→ 시나리오 CRUD
→ 미디어 CRUD
→ 멀티트랙 편집/출력
→ 외부 편집툴 작업
→ 완성
```

사용자는 항상 다음을 알아야 한다.

```text
내가 지금 무엇을 하는가?
이 작업의 부모 작업은 무엇인가?
이 작업이 성공하면 다음은 무엇인가?
결과가 눈으로 확인되는가?
상세 설정은 어디서 보는가?
```
