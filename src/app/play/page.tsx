import {
  ComboMilestone,
  EndOverlay,
  GameCanvas,
  Hud,
  PauseOverlay,
  StageBanner,
} from "@/features/game";

export default function PlayPage() {
  return (
    <>
      <GameCanvas />
      <Hud />
      <StageBanner />
      <ComboMilestone />
      <PauseOverlay />
      <EndOverlay />
    </>
  );
}
