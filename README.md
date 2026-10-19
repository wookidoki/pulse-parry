# PULSE PARRY

사방에서 날아오는 공격을 박자에 맞춰 받아치는 브라우저 액션 게임입니다.
바이브 코딩 해커톤 출품작입니다.

플레이: https://pulse-parry.vercel.app

## 조작

| 입력 | 동작 |
|---|---|
| 마우스 | 조준 |
| 스페이스 누름 | 패링 자세. 앞쪽에서 오는 공격을 막음 |
| 스페이스 뗌 | 막은 공격을 마우스 방향으로 되돌려 보냄 |

박자에 맞춰 받아치면 추가 점수가 붙습니다.

## 구성

- 스테이지 8개 (INFILTRATION부터 REVOLT까지). 스테이지마다 템포와 적 구성이 다름
- 보스 페이즈, 환경 위험 요소, 업적
- 스테이지별 배경음 후보 중 하나를 매 판 무작위로 고름

## 기술

- Next.js 16, React 19, TypeScript
- Canvas 2D 렌더링
- Zustand 상태 관리, CSS Modules

## 실행

```bash
npm install
npm run dev
```

## 음원

효과음과 배경음 대부분은 OpenGameArt, Kenney의 CC0 음원입니다.
일부 배경음은 Google Lyria로 만들었습니다.
출처 전체는 [public/audio/LICENSE.txt](public/audio/LICENSE.txt)에 있습니다.
