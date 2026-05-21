import { EndOverlay, GameCanvas, Hud, StageBanner } from "@/features/game";

export default function PlayPage() {
  return (
    <>
      <GameCanvas />
      <Hud />
      <StageBanner />
      <EndOverlay />
    </>
  );
}
