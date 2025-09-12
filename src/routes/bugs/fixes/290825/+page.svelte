<script>
  import { onMount } from "svelte";

  let oldStats = null;
  let newStats = null;
  let message = "Warte…";

  onMount(() => {
    try {
      // 1) Alte Stats laden (falls vorhanden)
      const raw = localStorage.getItem("stats");
      oldStats = raw ? JSON.parse(raw) : null;

      // 2) Distribution übernehmen oder Default anlegen
      const existingDistribution =
        oldStats?.distribution && Array.isArray(oldStats.distribution)
          ? oldStats.distribution
          : Array(12).fill(0);

      let gamesPlayed = 0
      for(let i = 0; i < oldStats.distribution.length; i++) {
        gamesPlayed += oldStats.distribution[i]
      }

      // 3) Neue Stats aufbauen
      const today = new Date();
      newStats = {
        gamesPlayed: gamesPlayed,
        gamesWon: gamesPlayed,
        currentStreak: gamesPlayed,
        bestStreak: gamesPlayed,
        lastPlayed: "2025-08-29T16:18:46.516Z",
        distribution: existingDistribution
      };

      // 4) Zurück in localStorage speichern
      localStorage.setItem("stats", JSON.stringify(newStats));

      message = "Stats wurden erfolgreich aktualisiert ✅";
    } catch (e) {
      console.error(e);
      message = "Fehler beim Aktualisieren der Stats ❌";
    }
  });
</script>

<main style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#fffaf5;">
  <div style="max-width:500px;width:100%;background:white;border:1px solid #ffa94d;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,0.08);padding:32px;text-align:center;">
    <h1 style="color:#ff7f00;margin-bottom:16px;">✅ Stats aktualisiert</h1>
    <p style="margin-bottom:24px;color:#444;">Deine Spielstatistiken wurden erfolgreich korrigiert.</p>
    <a href="/stats" style="display:inline-block;padding:12px 24px;background-color:#ff7f00;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">
      Zu meinen Stats
    </a>
  </div>
</main>
