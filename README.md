[README.md](https://github.com/user-attachments/files/33772150/README.md)
# 🥁 TUNG TUNG SAHUR: TEMPLE ESCAPE (2D 8-Bit)

A retro 2D 8-bit action platformer built with **Python & Pygame**, starring **Tung Tung Sahur** — equipped with his wooden stick and kentongan drum!

---

## 🎮 Game Story & Concept
Tung Tung Sahur is trapped inside a cursed ancient temple crawling with dangerous phantasm ghosts and venomous temple spiders. To escape, Tung Tung must squash monsters by jumping on their heads, unleash his devastating **30-second Stick Ground Slam AoE**, break mystery boxes to uncover the **Golden Temple Key**, and survive bullet-hell Brainrot Boss encounters every 3 levels!

---

## 🕹️ Controls

| Action | Primary Key | Secondary Key |
| :--- | :--- | :--- |
| **Move Left / Right** | `A` / `D` | `Left` / `Right` Arrow |
| **Jump (Variable Height)** | `Space` | `W` / `Up` Arrow |
| **Stick Ground Slam (AoE)** | `F` | `J` or `Down + Space` |
| **Stick Melee Attack** | `E` | `K` |
| **Back / Pause / Menu** | `Esc` | `P` |

---

## ⚡ Core Mechanics & Features

1. **Head-Stomp Combat**:
   - Land directly on top of Ghost or Spider heads while falling to squash them instantly.
   - Successful stomps launch Tung Tung upward in a bounce!

2. **Kentongan Ground Slam (30s Cooldown)**:
   - Press `F` or `J` to slam the stick into the ground, creating a circular 8-bit shockwave.
   - Deals massive instant AoE damage to all nearby monsters and inflicts heavy damage on bosses.
   - On-screen HUD cooldown gauge displays remaining seconds and turns golden when ready!

3. **Breakable Mystery Boxes & Golden Key**:
   - Wooden crates are hidden across platforms.
   - Smash crates with your stick (`E`/`K`), jump on them, or trigger a ground slam.
   - One crate contains the **Golden Temple Key** needed to unlock the ancient exit portal.

4. **Boss Encounters (Every 3 Levels)**:
   - **Level 3 Boss**: *Titan Skibidi Speaker* (Undertale bullet-hell rhythm soundwaves & Cuphead charge rush attacks).
   - **Level 6 Boss**: *Mewing Gigachad Sphinx* (Undertale laser shards, Cuphead falling stone slabs, looksmaxing bullet-hell).

5. **Health System & Boss Recovery**:
   - Start with 3 hearts (max 5).
   - Taking damage grants 1.6s invulnerability blinking.
   - ★ **Health Reward**: After clearing every 3 levels (defeating the boss), Tung Tung **gains back 3 health**!

6. **Audio**:
   - **Completely Silent** as requested (`SDL_AUDIODRIVER=dummy` and sound mixer disabled).

7. **Menu System & Leaderboard**:
   - **PLAY**: Starts a new speedrun run.
   - **HOW TO PLAY**: Interactive visual guide detailing controls, stomp rules, slam ability, and boss tactics.
   - **LEADERBOARD**: Persistent high-score table (`leaderboard.json`) tracking fastest escape times and highest levels cleared.

