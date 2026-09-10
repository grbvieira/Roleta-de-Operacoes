# Roleta de Operações

Aplicativo desktop independente para Windows, com menu de adição, subtração, multiplicação e divisão. Funciona offline desde a primeira abertura. HTML, CSS e JavaScript rodam dentro do Electron; o formato de entrega é um aplicativo `.exe`, acompanhado por instalador completo e ZIP.

## Executar em desenvolvimento no Windows

Requisitos do computador de desenvolvimento: Node.js 22.12 ou posterior e npm. Ambiente usado: Node.js 24.15.0 e npm 11.12.1. No PowerShell, dentro desta pasta:

```powershell
npm.cmd ci
npm.cmd start
```

As dependências já foram instaladas nesta pasta. Em uma cópia nova do projeto, `npm.cmd ci` reproduz as versões do `package-lock.json`. O primeiro uso do Electron também pode baixar seu binário no computador de desenvolvimento. A janela desktop abre diretamente, sem servidor e sem navegador externo.

## Testar

```powershell
npm.cmd test
npm.cmd run test:desktop
npm.cmd run verify:reference
```

- `test`: testes sem interface para regras matemáticas, geração, renovação, seleção e desaceleração.
- `test:desktop`: abre janelas Electron ocultas com Playwright, perfil vazio e rede emulada offline. Exercita as quatro operações, configuração, renovação, resposta e persistência. Verifica a geometria real do SVG sob a ponta da seta. Salva capturas e resultado em `test-results/desktop/`.
- `verify:reference`: compara o SHA-256 do PowerPoint original com o valor registrado antes da implementação.

Os testes ocultos usam `--disable-gpu` e captura nativa do Electron para evitar falhas do compositor ao capturar janelas invisíveis. Essa opção fica apenas no processo de teste. A execução normal mantém a configuração gráfica padrão do Electron; a fluidez com a GPU e o projetor da escola precisa ser verificada no equipamento real.

## Gerar a distribuição Windows

```powershell
npm.cmd run dist:win
npm.cmd run test:packaged
npm.cmd run verify:distribution
```

O empacotamento pode precisar de internet **no computador de desenvolvimento** para baixar Electron, NSIS e ferramentas ausentes do cache. Os caches de build ficam em `.cache/`. Não há publicação automática.

Arquivos de entrega:

```text
dist/Roleta-Operacoes-1.0.0-Windows-x64-Instalador.exe
dist/Roleta-Operacoes-1.0.0-Windows-x64.zip
```

O instalador NSIS contém o aplicativo completo e instala por usuário, sem exigir elevação. O ZIP oferece a alternativa sem instalação: extrair a pasta inteira e abrir `Roleta de Operações.exe`. Nunca copiar apenas o EXE; ele usa as bibliotecas e recursos que o acompanham. O PowerPoint original e as ferramentas de desenvolvimento não são incluídos.

`npm.cmd run pack:win` produz apenas a pasta `dist/win-unpacked/`, útil para validar uma compilação rapidamente. `test:packaged` executa essa pasta com perfil vazio e rede emulada offline. Os mesmos arquivos da pasta compõem o ZIP e o instalador; a instalação do NSIS e as políticas do computador da escola exigem validação separada.

`verify:distribution` confere se o código e os recursos dentro do pacote correspondem às fontes e registra o SHA-256 do instalador e do ZIP em `dist/SHA256SUMS.txt`. Requer a distribuição completa gerada por `dist:win`.

## Compatibilidade e uso na escola

- **Windows 10 e Windows 11 x64**, em processadores Intel/AMD de 64 bits.
- Electron 44.3.0 declara suporte a Windows 10 e posteriores, com binários x64 e ARM64. Este projeto empacota somente x64. [Fonte da versão utilizada](https://github.com/electron/electron/blob/v44.3.0/README.md#platform-support).
- Windows 7, 8, 8.1 e Windows de 32 bits não são suportados. ARM64 requer outra distribuição e validação.
- A escola não precisa de PowerPoint, Node.js instalado, navegador externo, ChatGPT, conta ou internet. Chromium, Node.js e recursos locais estão incluídos.
- F11 alterna tela cheia; Esc sai da tela cheia. A janela aceita redimensionamento e oferece rolagem vertical quando necessário.
- Esta primeira distribuição não é assinada digitalmente. A equipe de TI da escola deverá validar eventuais bloqueios de execução/SmartScreen, sem desativar proteções.
- Ainda dependem do computador da escola: versão/arquitetura do Windows, modo S ou outras restrições, abertura/instalação por usuário comum, escala e legibilidade no projetor, fluidez da animação e teste offline real.

## Regras da atividade

Os limites vão de 0 a 1.000; divisores começam em 1. Para fixar um número, iguale mínimo e máximo. A roleta tem dez contas diferentes quando há pelo menos dez combinações válidas. Caso contrário, usa todas as possibilidades sem duplicações e explica a limitação.

Ao entrar em uma categoria ou clicar em “Novas contas”, uma nova rodada é sorteada. Quando há mais de dez possibilidades, pelo menos uma conta difere da rodada anterior. Se todas as possibilidades já estiverem presentes, a ordem muda; uma única combinação permanece igual até que os limites sejam ampliados.

Subtrações têm resultado não negativo e divisões são exatas, sem divisão por zero. “Girar” inicia uma animação de cerca de 4,2 segundos, com cinco ou mais voltas e desaceleração. A parada é no centro de um setor. A conta exibida é obtida do ângulo visual final; “Mostrar resposta” revela somente o resultado dessa conta. Girar ou renovar limpa a resposta anterior.

Configurações são salvas por operação no perfil do usuário do Windows. A origem interna estável do Electron permite persistência entre reinícios. Falhas de armazenamento mantêm a atividade utilizável durante a sessão.

## Organização do código

| Caminho | Responsabilidade |
| --- | --- |
| `desktop/main.cjs` | Janela Electron, arquivos locais, isolamento da interface e bloqueio de conteúdo externo |
| `app/core/math.mjs` | Matemática, validação e geração compacta das rodadas, sem DOM ou Electron |
| `app/core/wheel.mjs` | Ângulos, seleção e desaceleração, sem DOM ou Electron |
| `app/renderer.mjs` | Estado da atividade, desenho SVG e interação |
| `app/styles.css` | Layout, contraste, tamanhos e áreas reservadas aos personagens |
| `app/assets/` | Cópias dos recursos do PowerPoint e registro da origem |
| `tests/` | Testes unitários com o executor nativo do Node.js |
| `scripts/test-desktop.mjs` | Testes integrados na janela Electron, em desenvolvimento e empacotada |
| `scripts/package-windows.cjs` | Geração local do instalador e ZIP, sem publicação |

O protocolo `roleta://app` lê somente arquivos locais empacotados, sem servidor HTTP. O renderer usa sandbox, isolamento de contexto e Node.js desabilitado. Não há API remota, telemetria, login, atualizador ou recurso carregado pela internet. A política de conteúdo bloqueia conexões externas.

## Referência original

`roleta da adição.pptx` permanece no local original, sem edição. Imagens foram copiadas de dentro do pacote PPTX, sem transformação. Sua origem está em `app/assets/ORIGEM.md`. Os personagens ocupam áreas separadas da roleta, corrigindo a sobreposição da referência.

SHA-256 esperado: `CF046654938448F25EAB8DE4D5D0C3F21A497E8EDF0A5FE6159B1AE6281B48C2`.
