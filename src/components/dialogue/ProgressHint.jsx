import { useBloomStore, PETAL_GOAL } from "../../store/bloomStore";

function subline(count) {
  if (count === 0) {
    return "follow the little light";
  }
  if (count >= PETAL_GOAL - 1) {
    return null;
  }
  if (count >= 16) {
    return "the center is waiting";
  }
  if (count >= 10) {
    return "you're almost there";
  }
  if (count >= 5) {
    return "the world is waking up";
  }
  return "stay close to the glow";
}

export default function ProgressHint() {
  const petalCount = useBloomStore((s) => s.petalCount);
  const finaleStarted = useBloomStore((s) => s.finaleStarted);

  if (finaleStarted) {
    return null;
  }

  const sub = subline(petalCount);

  return (
    <div className="progress-hint" aria-hidden="true">
      <div className="progress-hint__count">
        petals {petalCount} · {PETAL_GOAL}
      </div>
      {sub ? <div className="progress-hint__sub">{sub}</div> : null}
    </div>
  );
}
