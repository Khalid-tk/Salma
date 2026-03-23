import { create } from "zustand";

export const PETAL_GOAL = 20;

export const STAGE = {
  grass: 3,
  tree: 6,
  lamp: 10,
  flowers: 15,
  full: 20
};

export const useBloomStore = create((set, get) => ({
  petalCount: 0,
  text: "",
  introStarted: false,
  hasMoved: false,
  burstSpawned: false,
  finaleStarted: false,
  finaleDialogueDone: false,
  collectPulse: 0,
  /** 0–1 visual reward pulse — decays each frame in scene */
  worldPulse: 0,

  guideFirstGlowDone: false,
  guideAt3: false,
  guideAt6: false,
  guideAt10: false,
  guideAt15: false,
  guideNearEnd: false,

  setText: (text, hold = 1800) => {
    const t = String(text).toLowerCase();
    set({ text: t });
    window.setTimeout(() => {
      if (get().text === t) {
        set({ text: "" });
      }
    }, hold);
  },

  queueLines: (lines) => {
    lines.forEach(({ text, delay = 0, hold = 2000 }) => {
      window.setTimeout(() => get().setText(text, hold), delay);
    });
  },

  startIntro: () => {
    if (get().introStarted) {
      return;
    }
    set({ introStarted: true });
    get().queueLines([
      { text: "hey", delay: 280, hold: 1100 },
      { text: "come with me", delay: 1450, hold: 2400 }
    ]);
  },

  registerMove: () => {
    if (!get().hasMoved) {
      set({ hasMoved: true });
    }
  },

  markBurst: () => set({ burstSpawned: true }),

  guideFirstPetals: () => {
    if (get().guideFirstGlowDone) {
      return;
    }
    set({ guideFirstGlowDone: true });
    get().queueLines([
      { text: "see that glow?", delay: 400, hold: 2200 },
      { text: "try catching it", delay: 2800, hold: 2600 }
    ]);
  },

  pulseCollect: () => set((state) => ({ collectPulse: state.collectPulse + 1 })),

  addWorldPulse: (amount) =>
    set((state) => ({
      worldPulse: Math.min(1, state.worldPulse + amount)
    })),

  decayWorldPulse: (factor = 0.94) =>
    set((state) => ({
      worldPulse: state.worldPulse * factor
    })),

  onCollectPetal: () => {
    const state = get();
    if (state.finaleStarted || state.petalCount >= PETAL_GOAL) {
      return;
    }
    const n = state.petalCount + 1;
    set({ petalCount: n, collectPulse: state.collectPulse + 1 });

    const major = [3, 6, 10, 15, 20].includes(n);
    const strong = [5, 8, 12, 16, 18].includes(n);
    const wave = n % 4 === 0 && n > 0;
    let pulseAdd = 0.14;
    if (major) {
      pulseAdd = 0.52;
    } else if (strong) {
      pulseAdd = 0.38;
    } else if (wave) {
      pulseAdd = 0.28;
    }
    get().addWorldPulse(pulseAdd);

    if (n === 1) {
      get().queueLines([
        { text: "yes", delay: 120, hold: 700 },
        { text: "more are waking up", delay: 900, hold: 2600 }
      ]);
      get().markBurst();
    }

    if (n === 3 && !state.guideAt3) {
      set({ guideAt3: true });
      get().queueLines([
        { text: "keep going", delay: 200, hold: 1800 },
        { text: "the garden remembers", delay: 2200, hold: 2800 }
      ]);
    }

    if (n === 6 && !state.guideAt6) {
      set({ guideAt6: true });
      get().setText("look at the tree", 2600);
    }

    if (n === 10 && !state.guideAt10) {
      set({ guideAt10: true });
      get().setText("the light likes you", 2800);
    }

    if (n === 15 && !state.guideAt15) {
      set({ guideAt15: true });
      get().queueLines([
        { text: "there", delay: 200, hold: 1600 },
        { text: "the flowers are back", delay: 2000, hold: 3200 }
      ]);
    }

    if (n === 18 && !state.guideNearEnd) {
      set({ guideNearEnd: true });
      get().queueLines([
        { text: "one more thing", delay: 250, hold: 2200 },
        { text: "over here", delay: 2600, hold: 2600 }
      ]);
    }

    if (n >= PETAL_GOAL) {
      set({ finaleStarted: true });
    }
  },

  startFinaleDialogue: () => {
    if (get().finaleDialogueDone) {
      return;
    }
    set({ finaleDialogueDone: true });
    get().queueLines([
      { text: "this was always for you", delay: 600, hold: 3200 },
      { text: "for salma", delay: 4200, hold: 4000 },
      { text: "you made this place warm", delay: 8800, hold: 2600 },
      { text: "glad we met", delay: 11800, hold: 3800 }
    ]);
  }
}));
