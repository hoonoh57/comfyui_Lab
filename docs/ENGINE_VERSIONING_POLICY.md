# Engine Versioning Policy

## 목적

`comfyui_Lab`의 현재 성공 엔진은 프로젝트의 핵심 자산이다.

이 문서는 성공 엔진을 실험 과정에서 훼손하지 않기 위한 버전 관리 기준이다.

## 현재 기준 엔진

현재 기준 엔진 이름:

```text
core_success_engine_v1
```

핵심 요약:

```text
Character Reference
→ IPAdapter non-FaceID
→ CLIPVisionLoader
→ IPAdapterAdvanced(combine_embeds="concat")
→ Text Prompt action/scene control
→ fast batch image generation
→ image + subtitle timeline preview
```

## 절대 원칙

```text
1. core_success_engine_v1은 삭제하지 않는다.
2. core_success_engine_v1의 핵심 workflow 배선을 임의 변경하지 않는다.
3. UI 개편 중에도 core_success_engine_v1의 생성 경로는 유지한다.
4. 새로운 실험은 반드시 별도 engine version으로 분리한다.
5. 실험 엔진이 성공하면 성능 비교 후에만 새 기준 버전으로 승격한다.
```

## 버전 명명 규칙

```text
core_success_engine_v1        현재 성공 기준 엔진
core_success_engine_v1_1      경미한 안정화 / 로그 / 방어로직 개선
core_success_engine_v2_exp    실험 엔진
core_success_engine_v2        검증 완료 후 승격된 새 기준 엔진
```

## 엔진 구분

### Stable Engine

실제 대량 이미지 생성에 사용하는 기준 엔진이다.

```text
core_success_engine_v1
```

허용 변경:

```text
- 오류 방어 로직 추가
- 모델 패밀리 mismatch 차단
- 로그 개선
- metadata 저장
- 실패 shot 재시도 로직
```

금지 변경:

```text
- IPAdapter + CLIPVision 배선 제거
- FaceID 모델을 기본값으로 전환
- Pose ControlNet을 기본 강제
- scene.content 직접 prompt 회귀
- 생성 속도를 크게 떨어뜨리는 무거운 workflow를 기본값으로 적용
```

### Experimental Engine

새로운 workflow, 모델, ControlNet, LoRA, FaceID, AnimateDiff, video node 등을 실험할 때 사용한다.

예:

```text
core_success_engine_v2_exp_faceid
core_success_engine_v2_exp_pose_strict
core_success_engine_v2_exp_lora_style
core_success_engine_v2_exp_video_motion
```

실험 엔진은 stable engine을 대체하지 않는다.

## 실험 승격 조건

새 엔진을 stable로 승격하려면 아래 조건을 통과해야 한다.

```text
1. 동일한 Character Reference로 20장 이상 생성
2. 얼굴/복장 일관성 유지
3. 평균 생성 속도 기존 대비 큰 폭 저하 없음
4. 텍스트 장면 반영률 기존보다 개선
5. 실패율 기존보다 낮거나 동일
6. Shot Card batch generation에서 중단 없이 작동
7. Timeline Preview에서 자막-이미지 의미 일치 개선
```

## 비교 기록 방식

각 엔진 실험은 아래 형식으로 기록한다.

```json
{
  "engine_id": "core_success_engine_v2_exp_pose_strict",
  "base_engine": "core_success_engine_v1",
  "purpose": "정확한 전신 포즈 반영 개선",
  "workflow_changes": [
    "Pose Reference를 DWPose Preprocessor에 연결",
    "ControlNetApplyAdvanced strength 기본값 조정"
  ],
  "test_count": 20,
  "avg_generation_sec": 0,
  "identity_score": 0,
  "prompt_adherence_score": 0,
  "failure_count": 0,
  "promotion_decision": "keep_experimental"
}
```

## 개발 작업 분리 기준

앞으로 작업은 세 계층으로 나눈다.

```text
1. Engine Layer
   - ComfyUI workflow 생성
   - reference upload
   - queue prompt
   - history image collection

2. Planning Layer
   - SilverStudio scenes[]
   - visual_shots[]
   - image prompt 변환
   - 자막/장면 분리

3. UI Layer
   - 좌측 진행 메뉴
   - 작업 페이지
   - shot list
   - timeline preview
   - webm export
```

UI Layer나 Planning Layer를 수정해도 Stable Engine은 변경하지 않는다.

## 다음 구현 기준

다음 단계부터는 다음 방식으로 진행한다.

```text
1. core_success_engine_v1을 명시적으로 엔진 함수로 분리한다.
2. experimental engine은 별도 함수/파일로 추가한다.
3. UI에서는 engine selector를 내부적으로만 사용한다.
4. 기본값은 항상 core_success_engine_v1이다.
5. 사용자가 실험 모드를 선택하지 않는 한 stable engine만 사용한다.
```

## 결론

`core_success_engine_v1`은 프로젝트의 기준 자산이다.

앞으로 모든 시나리오/파싱/타임라인/동영상 기능은 이 엔진 위에 얹는다.

새로운 개선은 반드시 별도 버전으로 실험하고, 검증된 결과만 다음 stable engine으로 승격한다.
