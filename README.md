<img src="app/assets/app-icon.svg" width="72" height="72" alt="Ícone da Roleta de Operações">

# Roleta de Operações

Aplicativo educativo para praticar **adição, subtração, multiplicação e divisão** em sala de aula. A turma gira a roleta, resolve a conta selecionada e confere o resultado quando quiser.

Funciona em uma janela própria no Windows e **sem internet desde a primeira abertura**. A distribuição inclui o motor de execução e todos os recursos visuais. O computador da escola não precisa de PowerPoint, Node.js instalado, navegador externo, conta no ChatGPT ou login.

## Recursos

- Menu com as quatro operações e configurações independentes para cada categoria.
- Intervalos numéricos ajustáveis e opção de fixar um número igualando mínimo e máximo.
- Dez setores com contas diferentes quando há combinações suficientes; menos setores quando necessário.
- Renovação das contas ao entrar na categoria ou clicar em **Novas contas**.
- Um clique em **Girar**, com desaceleração e parada automática.
- Seta, conta selecionada e resultado vinculados ao mesmo setor.
- Botão **Mostrar resposta**, disponível depois da parada.
- Configurações preservadas entre sessões e modo de tela cheia com **F11**.
- Recursos visuais reaproveitados do PowerPoint original, com os personagens separados da roleta.

## Uso na escola

Use o instalador ou o ZIP da distribuição Windows gerada a partir deste projeto:

| Formato | Como abrir |
| --- | --- |
| Instalador `.exe` | Execute o instalador e abra **Roleta de Operações** pelo atalho criado |
| ZIP do aplicativo | Extraia **todos** os arquivos para uma pasta e abra `Roleta de Operações.exe` |

Mantenha o executável e seus arquivos auxiliares juntos. O instalador contém o aplicativo completo e instala por usuário, sem exigir elevação administrativa.

**Este repositório contém o código-fonte.** Os instaladores e ZIPs compilados ficam em `dist/`, que não é versionado. O ZIP baixado pelo botão **Code** do GitHub contém os fontes e precisa ser empacotado conforme a seção [Gerar a distribuição Windows](#gerar-a-distribuição-windows).

Para começar a atividade:

1. Escolha uma operação no menu.
2. Abra **Ajustar números** para definir os intervalos da rodada.
3. Clique em **Girar** e aguarde a parada automática.
4. Resolva a conta indicada pela seta e clique em **Mostrar resposta**.
5. Use **Novas contas** para continuar ou volte ao menu para trocar de operação.

**F11** alterna tela cheia e **Esc** sai desse modo. Consulte também o [guia de uso](LEIA-ME.txt).

## Compatibilidade

| Item | Suporte desta distribuição |
| --- | --- |
| Sistema operacional | Windows 10 ou Windows 11 |
| Arquitetura | x64, para processadores Intel/AMD de 64 bits |
| Internet durante a atividade | Não é necessária, inclusive na primeira abertura |
| Dependências no computador da escola | Já incluídas no pacote |

Windows 7, 8, 8.1 e Windows de 32 bits não são suportados. Uma versão nativa ARM64 exige outro empacotamento e validação. O suporte da plataforma segue o [Electron 44.3.0 utilizado pelo projeto](https://github.com/electron/electron/blob/v44.3.0/README.md#platform-support).

A versão 1.0.0 não possui assinatura digital. A equipe de TI da escola deve verificar eventuais bloqueios de execução, SmartScreen ou modo S. Também é necessário testar a primeira abertura com a rede desligada, a escala e legibilidade no projetor e a fluidez da animação no equipamento real. Os testes locais e suas limitações estão no [registro de validação](docs/validacao.md).

## Desenvolvimento

No computador de desenvolvimento, instale **Git**, **Node.js 22.12 ou posterior** e **npm**. O ambiente usado na versão 1.0.0 foi Node.js 24.15.0 e npm 11.12.1.

Clone o repositório e execute no PowerShell:

```powershell
git clone https://github.com/grbvieira/Roleta-de-Operacoes.git
cd Roleta-de-Operacoes
npm.cmd ci
npm.cmd start
```

`npm.cmd ci` instala as versões registradas no `package-lock.json`. A instalação das dependências e o primeiro download do Electron precisam de internet no computador de desenvolvimento. `npm.cmd start` abre a janela desktop diretamente, sem servidor ou navegador externo. Feche a janela para encerrar essa execução.

As ferramentas do projeto são dependências locais; não é necessário instalá-las globalmente.

## Testes

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

Execute os comandos acima na raiz do projeto, depois de instalar as dependências. O empacotamento pode precisar de internet **no computador de desenvolvimento** para baixar Electron, NSIS e ferramentas ausentes do cache. Os caches ficam em `.cache/`. A geração dos pacotes não publica uma release no GitHub.

Arquivos de entrega:

```text
dist/Roleta-Operacoes-1.0.0-Windows-x64-Instalador.exe
dist/Roleta-Operacoes-1.0.0-Windows-x64.zip
```

Esses são os nomes gerados para a versão 1.0.0. Para levar a atividade à escola, copie o instalador ou o ZIP completo. O PowerPoint original e as ferramentas de desenvolvimento não são incluídos na distribuição.

`npm.cmd run pack:win` produz apenas a pasta `dist/win-unpacked/`, útil para validar uma compilação rapidamente. `test:packaged` executa essa pasta com perfil vazio e rede emulada offline. Os mesmos arquivos da pasta compõem o ZIP e o instalador; a instalação do NSIS e as políticas do computador da escola exigem validação separada.

`verify:distribution` confere se o código e os recursos dentro do pacote correspondem às fontes e registra o SHA-256 do instalador e do ZIP em `dist/SHA256SUMS.txt`. Requer a distribuição completa gerada por `dist:win`.

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

O arquivo `roleta da adição.pptx` está preservado na raiz do repositório. Imagens foram copiadas de dentro do pacote PPTX, sem transformação. O [registro de origem dos recursos](app/assets/ORIGEM.md) identifica cada arquivo. Os personagens ocupam áreas separadas da roleta, corrigindo a sobreposição da referência.

SHA-256 esperado: `CF046654938448F25EAB8DE4D5D0C3F21A497E8EDF0A5FE6159B1AE6281B48C2`.

## Documentação

- [Guia para executar a atividade](LEIA-ME.txt)
- [Diagnóstico e decisões de arquitetura](docs/diagnostico-inicial.md)
- [Testes realizados e validações pendentes na escola](docs/validacao.md)
- [Origem das imagens do PowerPoint](app/assets/ORIGEM.md)
