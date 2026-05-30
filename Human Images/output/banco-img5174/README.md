# Banco de imagem — derivado de IMG_5174.png

30 variações cinematográficas a partir de `public/media/IMG_5174.png`.

A referência é um **retrato íntimo em preto e branco, low-key, alto contraste**:
luz lateral única e suave, fundo em void preto, olhar fora de quadro,
enquadramento fechado e descentralizado, figurino escuro e uma assinatura de
**véu de motion-blur** (cabelo/haze em longa exposição) cruzando um lado do quadro.

O que é **mantido constante** em todas as 30 (estilo, composição, iluminação,
atmosfera, enquadramento, linguagem estética):

- Monocromático Kodak Double-X 5222, grão orgânico visível, pretos esmagados, alto contraste
- Fonte única suave lateral, sem fill, fundo em void preto
- Véu de motion-blur diagonal meio-velando o rosto
- Olhar fora de câmera, sujeito no terço direito, negative space profundo
- Lentes longas, DOF raso, foco no olho próximo

O que **varia** entre as 30: personagem, figurino e cenário (campos `SUBJECT`,
`WARDROBE TONAL BEHAVIOR`, `BACKGROUND`). A posição/corpo de câmera alterna
dentro do conjunto permitido (IMAX 65mm / Alexa 35) para ângulos inusitados.

## Estrutura

```
banco-img5174/
├── variations.json        # índice: id, subject, wardrobe, scenario, chars
├── var_01/ … var_30/
│   ├── prompt.txt          # prompt final Nano Banana 2 (<= 1500 chars)
│   └── image.png           # gerado no render (não versionado)
```

## Como gerar (quando o Higgsfield CLI estiver disponível)

Pré-requisito: `higgsfield` instalado e autenticado no PATH (o CLI real de
geração de imagem da Higgsfield, não o pacote homônimo de treino no PyPI).

Regerar os prompts (determinístico, fonte de verdade é o script):

```bash
python3 "Human Images/scripts/build_variations.py" \
  --run-dir "Human Images/output/banco-img5174"
```

Renderizar as 30, enviando a referência junto de cada prompt, em 16:9 / 2k:

```bash
python3 "Human Images/scripts/render_batch.py" \
  --run-dir "Human Images/output/banco-img5174" \
  --reference "public/media/IMG_5174.png" \
  --aspect-ratio 16:9 --resolution 2k
```

Inspecionar os comandos sem renderizar: adicione `--dry-run`.
Refazer só as que falharam: `--only var_03,var_07`.

Cada `var_NN/` recebe `image.png` e um `render.json` (manifest) ao renderizar.
As imagens ficam fora do git (`output/` é gitignored); os `prompt.txt` e o
`variations.json` são versionados como entregável.
