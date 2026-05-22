@AGENTS.md

# PULSE PARRY — Project Context

해커톤(Vibe Coding) 출품작. **360° 리듬 패링 서바이버** 웹게임.
- 배포: https://pulse-parry.vercel.app
- 레포: https://github.com/wookidoki/pulse-parry
- 마감: 기획서 5/26, 최종 6/8 (100만원 상금)

## 게임 핵심

- 마우스 = 조준, SPACE = 막기 (홀드 → 흡수 → 놓음 = 반격)
- TAP (200ms 안) = 자동 카운터, CHARGE (700ms+) = 강한 일격, PERFECT (100~190ms) = 보너스
- WASD 이동 (180px 한계), SHIFT/Q = 대시 + 160ms 무적
- 환경 위험 (레이저/미사일/충격파) = 패링 불가, 대시로만 회피

## 기술 스택

- **Next.js 16.2.6** (Vercel 배포) — 빌드 시 `npm run lint` + `npx tsc --noEmit` 필수 통과
- **React 19.2** — 클라이언트 컴포넌트 `"use client"`
- **Zustand 5** — 글로벌 HUD 상태 (`state.ts`)
- **Canvas 2D** — 게임 렌더링 (60fps 목표)
- **Web Audio API** — BGM (HTMLAudioElement) + SFX (AudioBuffer 풀)
- **CSS Modules** — 컴포넌트별 스타일 (Tailwind 금지)
- **TypeScript** — strict mode, lint 0 errors 유지

## 디렉토리 구조

```
src/
├── app/
│   ├── page.tsx              # MainMenu
│   ├── play/page.tsx         # 게임 메인
│   └── tutorial/page.tsx     # Tutorial 슬라이드
└── features/game/
    ├── config/               # 정적 데이터
    │   ├── characters.ts     # 3 캐릭터 (ninja/monk/netrunner) + blade shape
    │   ├── enemy-kinds.ts    # 12 EnemyKind 설정 + bullet kinds
    │   ├── stages.ts         # 5 stage + tempo maps
    │   ├── modifiers.ts      # 5 run modifiers
    │   ├── hazards.ts        # 환경 위험 타이밍
    │   ├── difficulty.ts     # easy/normal/hard 배수
    │   ├── palette.ts        # 컬러 토큰
    │   └── tuning.ts         # 게임 상수 (HP, 속도, ms 등)
    ├── engine/               # 게임 로직 (no React)
    │   ├── update.ts         # 메인 tick (이게 가장 큼, 600줄+)
    │   ├── enemy.ts          # 적 생성/업데이트/사망
    │   ├── bullet.ts         # 탄막 + 패링/반사 + 충돌 판정
    │   ├── hazards.ts        # 환경 위험 (laser/missile/shockwave)
    │   ├── particles.ts      # BURSTS 프리셋 + emitBurst
    │   ├── beat.ts           # BPM clock + tick detection
    │   ├── tempo.ts          # stage tempo curve interpolation
    │   ├── geometry.ts       # vector helpers
    │   └── effects.ts        # spawnShockwave/Slash/ScorePop/ScreenFlash
    ├── render/               # 캔버스 그리기 (engine 상태 → 픽셀)
    │   ├── frame.ts          # 메인 render orchestrator
    │   ├── background.ts     # 배경 (도시/스트릭/페이즈 톤)
    │   ├── entities.ts       # 적/플레이어/탄막/슬래시 (큰 파일)
    │   ├── enemy-sprites.ts  # SVG 캐싱 + 색 틴트
    │   ├── overlay.ts        # HUD bars (보스 HP, stage progress, tempo)
    │   ├── effects.ts        # particles/slashes/shockwaves/scorePops draw
    │   ├── postfx.ts         # vignette, comboFlow, chromatic, pause
    │   ├── hazards.ts        # laser/missile/shockwave render
    │   └── countdown.ts      # 3-2-GO!
    ├── ui/                   # React 컴포넌트
    │   ├── MainMenu.tsx      # 메인 메뉴 (4 view: title/character/stage/credits)
    │   ├── CharacterPortrait.tsx
    │   ├── GameCanvas.tsx    # 게임 캔버스 + input handlers
    │   ├── Hud.tsx           # HP + Score + Combo
    │   ├── StageBanner.tsx
    │   ├── ComboMilestone.tsx
    │   ├── PauseOverlay.tsx
    │   ├── EndOverlay.tsx    # 결과 + 등급 + 통계
    │   ├── Cutscenes.tsx     # Intro/Boss/Death/Victory
    │   ├── BossPhaseAlert.tsx
    │   ├── PracticeHud.tsx   # 연습 모드 팁 + 종료 버튼
    │   ├── Tutorial.tsx      # 9 슬라이드 가이드
    │   ├── MenuBackground.tsx
    │   └── Button.tsx        # 공통 버튼 (4 variants × 3 sizes)
    ├── types.ts              # EngineState + EnemyKind + HudState
    ├── state.ts              # Zustand store
    ├── audio.ts              # SFX (sample pool + synth fallback)
    ├── music.ts              # BGM (5 stage pool + menu pool + boss phase tracks)
    ├── audioAnalysis.ts      # FFT 키k detection + BPM
    ├── i18n.ts               # 한/영 (60+ 키)
    ├── progress.ts           # localStorage (unlocked stage, best score)
    └── index.ts              # 공개 exports
```

## 컨벤션

### 코드
- 함수는 짧고 단일 책임. update.ts가 큰 이유는 게임 메인 루프 한 곳에 모음.
- engine/* 파일은 React 의존 X (순수 함수 + EngineState 변형).
- render/* 파일은 EngineState 읽기 전용 + Canvas 그리기.
- ui/* 파일은 React만. 게임 상태 → Zustand HUD store 경유.
- **import 순서**: types → config → engine → render → ui → external
- **타입**: 인터페이스는 export, 함수 시그니처에 타입 명시
- **주석**: 거의 안 씀. 코드로 자명하게 작성. 비명시적 제약/의도만 짧게 코멘트.

### 새 기능 추가 시 패턴

1. **새 적 종류**: types.ts EnemyKind 추가 → enemy-kinds.ts 설정 → KIND_RACE/KIND_LABEL 매핑 → render/enemy-sprites.ts SVG_URLS → stages.ts enemyKinds 배열에 추가
2. **새 환경 위험**: types.ts HazardKind → config/hazards.ts 시간 → engine/hazards.ts spawn/hits/render → render/hazards.ts draw
3. **새 SFX**: audio.ts에 wrapper 함수 추가 → 호출처에서 import + 콜
4. **새 UI 오버레이**: ui/*.tsx + module.css → PlayPage 또는 MainMenu에 추가
5. **새 컷씬**: HudState.status enum 확장 → state.ts 액션 → ui/Cutscenes.tsx 컴포넌트 추가

### 사운드 톤
- 종족별 다른 시그니처 (omnic=디지털, virus=글리치, drone=기계, core=거대)
- SFX = sample(OGG) + synth(envOsc) 레이어 합성
- BGM = HTMLAudioElement, AnalyserNode로 BPM 자동 검출

### 컬러 팔레트 (config/palette.ts)
- 시안 `#1cf0ff` (player, ui primary)
- 노랑 `#f7ff3a` (parry/pressed)
- 마젠타 `#ff2bd6` (omnic, accent)
- 빨강 `#ff3863` (danger, boss, hazards)
- 보라 `#b14bff` (drone, heavy bullets)
- 흰색 `#ffffff` (highlights, perfect)
- 다크 `#05030a` (배경)

### Button 컴포넌트
- 모든 클릭 가능 UI는 `<Button>` 또는 `<ButtonLink>` 사용
- variants: primary (cyan), secondary (cyan dim), ghost (transparent), danger (red)
- sizes: lg (CTA, 240px+), md (액션, 140px+), sm (toggle, 10px font)
- bracket prop = `[ TEXT ]` 표시
- pressed prop = 노란 선택 상태

## 현재 기능 상태

### ✅ 구현 완료
- 5 스테이지 + 보스 (3페이즈, HP%로 동적 전환)
- 3 캐릭터 (ninja katana / monk staff / netrunner razor)
- 12 EnemyKind (shooter/burster/charger/boss + 8 sub-kinds)
  - sub-kind: sniper/spreader/spiraler/phantom/mortar/bomber/splitter/shard
- 5 모디파이어 (rapidFire/metalRain/purist/stoneHeart/none)
- 3 환경 위험 (laserSweep 스캐닝/missile barrage/shockwave echo)
- 컷씬 4종 (Intro/BossAppear/Death/Victory) + SFX
- 보스 페이즈 알림 + 카메라 줌
- 인터랙티브 연습 모드 (`?tutorial=1`)
- 인-게임 카운트다운 (2-1-GO)
- 등급 시스템 (S/A/B/C/D/F) + 7 통계
- 음악/효과음 분리 볼륨 (localStorage 영속)
- 메뉴 BGM 6 트랙 선택 (localStorage 영속)
- 한국어/영어 i18n 완전
- 반응형 (모바일/태블릿/데스크탑)
- 페이지 트랜지션 (시네마틱 워프)
- 종족별 발사/사망 SFX 다양화
- 캐릭터별 대시 트레일 컬러
- 동적 배경 (보스 페이즈 + BPM 반응)
- BGM 페이즈별 트랙 전환

### 🟡 부분 구현 / 폴리시 가능
- 보스 페이즈 컷씬 (현재 짧은 알림만 — 풀 컷씬은 안 함)
- 자폭병 텔레그래프 (자폭 1초 전 경고 추가 가능)
- 적군 SVG (현재 9 sub-kind 매핑 일부 race 공유)

### ❌ 미구현 (다음 라운드 후보)
- 화면 가장자리 환경위험 방향 인디케이터
- HUD 적 종류 카운터
- 데일리 챌린지 (요청 보류됨)
- 스팀 출시 준비 (Electron + 업적 + 클라우드)
- 추가 적 변종 (splitter shards already done)

## 푸시 흐름

1. 코드 변경
2. `npx tsc --noEmit` (TS clean)
3. `npm run lint` (ESLint clean)
4. `git add -A && git commit -m "..."` (한글 메시지 OK, Co-Authored-By 포함)
5. `git push` → Vercel 자동 배포 (2-3분)

## 에셋 라이선스

- BGM: CC0/OGA-BY (OpenGameArt) + Lyria AI 생성
- SFX: CC0 Kenney Sci-fi + StarNinjas Swords + rubberduck
- 캐릭터/적 SVG: Game-Icons.net (CC BY 3.0) — Lorc/Delapouite/Hyptosis
- 모든 출처는 `public/audio/LICENSE.txt` + `public/assets/LICENSE.txt`

## 사용자 (wookidoki) 선호

- 빠른 피드백 루프 (작은 단위로 자주 푸시)
- 한국어 커밋 메시지 + 한국어 응답
- 라이브 배포 확인 (메뉴 → STAGE 1 진입 흐름 자주 테스트)
- 게임성 우선 > 시각 효과 (콤보 효과는 시각 압도하지 않게 완화 요청한 적 있음)
- 무료 에셋 적극 활용 (다운로드 + 통합)
- 다음 라운드 큐를 받아 우선순위 정함
