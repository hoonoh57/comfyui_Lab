# Standard Block API Architecture

## 목적

SilverStudio / comfyui_Lab의 장기 목표는 기능을 계속 덧붙이는 방식이 아니라, 모든 성공 로직을 `block API`로 자산화하는 것이다.

처음에는 단순한 기능도 시간이 지나면 다음 문제가 생긴다.

```text
기능 추가
→ 기존 파일에 덧붙임
→ 호출 경로 증가
→ 호환성 에러
→ 임시 수정
→ 더 큰 에러
→ 성공 로직 훼손
→ 코드 포기
```

이를 막기 위해 모든 기능은 아래 구조로 통일한다.

```text
성공 로직 = stable block
실험 로직 = experimental block
외부 호출 = callBlock(functionName, params)
반환 = 표준 result object
```

## 핵심 원칙

```text
기존 성공 로직을 직접 수정하지 않는다.
기능 추가는 새 block으로 만든다.
외부에서는 block 내부 구현을 모른다.
모든 기능은 함수명 + 파라미터 + 반환형식으로만 호출한다.
```

## 폴더 구조

```text
/api
  STANDARD_API_INDEX.md
  block_registry.json

/success_blocks
  /image_core_v1
    manifest.json
    workflow_character_text.json
    workflow_character_pose_text.json
    patch_map.json
    runner.js

  /silverstudio_scene_parser_v1
    manifest.json
    runner.js

  /visual_shot_planner_v1
    manifest.json
    runner.js

  /timeline_preview_v1
    manifest.json
    runner.js

/experimental_blocks
  /image_to_video_v1_exp
    manifest.json
    runner.js

  /ranking_media_research_v1_exp
    manifest.json
    runner.js

/ui_blocks
  /main_ui_v1
    manifest.json
    renderer.js

  /scenario_crud_ui_v1
    manifest.json
    renderer.js
```

## callBlock 표준 호출

모든 기능은 아래 형식으로 호출한다.

```javascript
callBlock("block_id.functionName", params)
```

예:

```javascript
callBlock("image_core_v1.generateImage", {
  character_ref: "main_hero.png",
  pose_ref: "",
  positive_prompt: "young swordsman leading a frightened girl toward a moonlit cliff edge",
  negative_prompt: "single portrait, abstract background, unrelated scene",
  width: 768,
  height: 1024
});
```

## 표준 반환형식

모든 block은 최소한 아래 형식으로 반환한다.

```json
{
  "ok": true,
  "block_id": "image_core_v1",
  "function": "generateImage",
  "status": "success",
  "result_type": "image_asset",
  "result": {},
  "metadata": {},
  "error": ""
}
```

실패 시:

```json
{
  "ok": false,
  "block_id": "image_core_v1",
  "function": "generateImage",
  "status": "failed",
  "result_type": "none",
  "result": {},
  "metadata": {},
  "error": "error message"
}
```

## manifest.json 표준

각 block은 자신이 제공하는 함수, 파라미터, 반환형식을 manifest에 노출한다.

```json
{
  "block_id": "image_core_v1",
  "version": "1.0.0",
  "status": "stable",
  "title": "Core Image Generation Engine v1",
  "description": "Character reference + text prompt based fast ComfyUI image generation",
  "functions": {
    "generateImage": {
      "params": {
        "character_ref": "string optional",
        "pose_ref": "string optional",
        "positive_prompt": "string required",
        "negative_prompt": "string optional",
        "width": "number optional",
        "height": "number optional"
      },
      "returns": "image_asset"
    }
  }
}
```

## API 조회 방식

한 달 뒤에도 기존 기능을 다시 찾기 위해 전체 코드를 뒤질 필요가 없어야 한다.

필요한 것은 API 조회 하나다.

```javascript
listBlocks()
getBlockManifest("image_core_v1")
getBlockFunctions("image_core_v1")
```

예상 출력:

```json
{
  "block_id": "image_core_v1",
  "status": "stable",
  "functions": [
    "generateImage",
    "generatePoseImage"
  ]
}
```

## UI도 block으로 취급

UI 역시 직접 여러 파일을 뒤섞지 않고 block으로 호출한다.

예:

```javascript
callBlock("main_ui_v1.render", {
  target: "#app",
  project_id: "P001"
});
```

또는:

```javascript
callBlock("scenario_crud_ui_v1.render", {
  target: "#workspace",
  scenario_id: "SCN001"
});
```

UI block 반환:

```json
{
  "ok": true,
  "block_id": "scenario_crud_ui_v1",
  "function": "render",
  "status": "success",
  "result_type": "html",
  "result": {
    "html": "<section>...</section>"
  },
  "metadata": {},
  "error": ""
}
```

## 성공 block과 실험 block

### Stable block

이미 성공한 로직이다.

```text
/success_blocks
```

stable block은 직접 수정하지 않는다.

수정이 필요하면 다음 중 하나로 처리한다.

```text
1. patch-level bugfix
2. 새 experimental block 작성
3. 검증 후 stable 승격
```

### Experimental block

새로운 기능, 모델, workflow, UI 실험은 이곳에서 진행한다.

```text
/experimental_blocks
```

실패해도 stable block에는 영향이 없어야 한다.

## 승격 방식

실험 block이 성공하면 아래 순서로 stable 승격한다.

```text
1. 동일 입력으로 stable block과 비교
2. 결과 품질 확인
3. 속도 확인
4. 실패율 확인
5. 반환형식 호환 확인
6. manifest status를 stable로 변경하거나 success_blocks로 이동
```

## 핵심 장점

```text
1. 기존 성공 로직을 안전하게 보존한다.
2. 새 기능은 새 block으로 추가하므로 기존 호환성을 깨지 않는다.
3. 모든 기능은 API 조회로 찾을 수 있다.
4. UI도 block으로 호출되므로 화면 구조 변경이 쉬워진다.
5. 호출 규약만 맞으면 내부 구현은 자유롭게 바꿀 수 있다.
6. 실패한 실험은 block 단위로 버리면 된다.
```

## 최종 규칙

복잡한 룰을 많이 만들지 않는다.

프로젝트의 기본 규칙은 하나다.

```text
모든 기능은 block으로 만들고,
외부에는 manifest에 등록된 함수명/파라미터/반환형식만 노출한다.
성공한 block은 stable로 잠그고,
새 기능은 experimental block에서 검증 후 승격한다.
```

## 결론

이 구조라면 한 달 뒤 새로운 기능을 추가하더라도 기존 코드를 뒤질 필요가 없다.

먼저 API를 조회한다.

```text
이미 있는 기능이면 callBlock으로 호출한다.
없는 기능이면 experimental block으로 만든다.
성공하면 stable block으로 승격한다.
```

이것이 코드지옥을 피하고, 성공 로직을 자산으로 축적하는 SilverStudio의 표준 개발 방식이다.
