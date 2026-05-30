# Human Images

Infraestrutura de geração de imagens cinematográficas do `/image`.

O fluxo do `/image` (definido em `.claude/skills/image/SKILL.md`) sempre termina
em um render real via **Higgsfield CLI** usando **Nano Banana 2**
(`nano_banana_2`). Nenhum outro modelo é usado como fallback.

## Estrutura

```
Human Images/
├── scripts/
│   └── render_image.py   # wrapper do Higgsfield CLI (Nano Banana 2)
└── output/
    └── {run_id}/
        ├── prompt.txt     # prompt final salvo pela skill
        ├── image.png      # imagem renderizada
        └── render.json    # manifest (modelo, ar, resolução, URLs)
```

`output/` é ignorado pelo git (ver `.gitignore`): as imagens geradas não são
versionadas. O script cria o diretório do `run_id` automaticamente.

## Pré-requisitos

- `python3` (3.11+)
- Higgsfield CLI (`higgsfield`) instalado e autenticado no PATH

O script não instala nem autentica o CLI. Se o `higgsfield` não estiver no PATH,
o render falha com uma mensagem clara — sem fallback para outro engine.

## Uso

```bash
# render simples
python3 "Human Images/scripts/render_image.py" render \
  "Human Images/output/{run_id}/prompt.txt" \
  --aspect-ratio "4:5" --resolution "2k" \
  --output-dir "Human Images/output/{run_id}"

# com imagem de referência
python3 "Human Images/scripts/render_image.py" render \
  "Human Images/output/{run_id}/prompt.txt" \
  --aspect-ratio "4:5" --resolution "2k" \
  --output-dir "Human Images/output/{run_id}" \
  --reference "/caminho/da/referencia.png"

# inspecionar o comando sem renderizar
python3 "Human Images/scripts/render_image.py" render \
  "Human Images/output/{run_id}/prompt.txt" \
  --aspect-ratio "1:1" --resolution "2k" \
  --output-dir "Human Images/output/{run_id}" --dry-run
```

### Valores aceitos

- **aspect-ratio**: `auto, 1:1, 3:2, 2:3, 4:3, 3:4, 4:5, 5:4, 9:16, 16:9, 21:9`
- **resolution**: `1k, 2k, 4k` (padrão recomendado: `2k`)

O comando final montado pelo wrapper é:

```bash
higgsfield generate create nano_banana_2 \
  --prompt "$PROMPT" --aspect_ratio "<ar>" --resolution "<res>" \
  [--image "$REF_UUID"]
```
