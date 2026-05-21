import {
  ComboMilestone,
  EndOverlay,
  GameCanvas,
  Hud,
  PauseOverlay,
  StageBanner,
} from "@/features/game";
import type { Difficulty } from "@/features/game/types";

interface PageProps {
  searchParams: Promise<{ stage?: string; diff?: string }>;
}

export default async function PlayPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const stageIdx = Math.max(0, Math.min(4, parseInt(params.stage ?? "0", 10) || 0));
  const diffParam = params.diff;
  const difficulty: Difficulty =
    diffParam === "easy" || diffParam === "hard" ? diffParam : "normal";
  return (
    <>
      <GameCanvas startStage={stageIdx} difficulty={difficulty} />
      <Hud />
      <StageBanner />
      <ComboMilestone />
      <PauseOverlay />
      <EndOverlay />
    </>
  );
}
