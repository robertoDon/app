# Hyperframes Composition Brief: Follou

- Composição: `brag-output/composition/` (1920x1080, 30fps, 24s) · render: `brag-output/brag.mp4`
- Fonte única: o canvas https://claude.ai/artifact/JoLM6BpVWakan6zacwe6mP (v61). As telas HojeMobile, FeitoMobile e MetaChegaMobile foram copiadas do markup do artefato (sem transições CSS e sem backdrop-filter, para o render ser determinístico); FocoMobile foi reescrita estática a partir do template e dos dados do item "Acme".
- Copy verbatim: ver `brag-plan.md`. Dados de exemplo do próprio design (Acme, Júlia Prado, Roberto etc.).
- Tom: polished. Fontes locais em `assets/fonts/`.
- Áudio: `assets/music/happy-beats-business-moves-vol-1-by-ende-dot-app.mp3` (CC BY 4.0, Sascha Ende; crédito em `assets/music/CREDITS.md`) + SFX em `assets/sfx/`. Strong cue 20,02s trava o logotipo final. Áudio-reativo sutil via `assets/rms.json` (ffmpeg + numpy).
- Gate: `npx hyperframes check` sem erros. Os skills do Hyperframes não estavam instalados; segui `npx hyperframes docs`.
- O gerador usado foi um script local (não versionado); o `index.html` é a fonte editável.
