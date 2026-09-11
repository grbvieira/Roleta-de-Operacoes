# Testes da versão 1.0.0

Registro dos testes realizados em 10/09/2026 no Windows x64, build 10.0.26200. Os resultados abaixo se referem à distribuição gerada nessa data.

## Cobertura e resultados

| Área | Verificação | Resultado |
| --- | --- | --- |
| Matemática e roleta | 18 testes unitários | Aprovados |
| Combinações válidas | Comparação com enumeração independente em 400 configurações | Aprovada |
| Rodadas | 200 rodadas, limites, ausência de duplicações e renovação | Aprovadas |
| Subtração e divisão | Resultados não negativos, divisões exatas e rejeição do divisor zero | Aprovadas |
| Geometria | Destinos de 1 a 10 setores, bordas, giros sucessivos e desaceleração | Aprovada |
| Interface e executável | Quatro operações, giro, resposta, ajustes e renovação | Aprovados |
| Seleção | Ponta da seta dentro do setor SVG, conta e resposta correspondentes | Aprovada |
| Persistência | Fechar e reabrir mantendo as configurações | Aprovada |
| Layout | Janela de 960 × 680, sem sobreposição dos personagens ou rolagem horizontal | Aprovado |
| Abertura offline emulada | Perfil novo e recursos locais disponíveis | Aprovada |
| Pacote | Código e imagens iguais às fontes; `app.asar` do ZIP igual ao da pasta testada | Conferido |
| PowerPoint | SHA-256 igual ao original | Conferido |

Não foram registrados erros JavaScript nem requisições HTTP/HTTPS nos fluxos testados. O executável confirmou Electron 44.3.0 e Node.js incorporado 24.20.0.

## Como repetir

Na raiz do projeto, com as dependências instaladas:

```powershell
npm.cmd test
npm.cmd run test:desktop
npm.cmd run dist:win
npm.cmd run test:packaged
npm.cmd run verify:distribution
```

Os testes desktop salvam resultados e capturas em `test-results/desktop/` e `test-results/packaged/`. Essas pastas são locais e não são versionadas. A conferência da distribuição grava os hashes do instalador e do ZIP em `dist/SHA256SUMS.txt`.

A verificação opcional `npm.cmd run verify:reference` compara o hash do PowerPoint com o original. Ela requer `roleta da adição.pptx` na raiz; esse arquivo não acompanha o repositório.

## Condições dos testes

O Playwright executa o Electron em janela oculta, com perfil vazio e rede emulada offline antes de carregar a atividade. O script usa `--disable-gpu` para permitir a captura da janela oculta. A execução normal do aplicativo mantém a configuração gráfica padrão do Electron.

A verificação da seta consulta a geometria do SVG, sem usar a função que calcula o setor selecionado. O resultado esperado da conta também é calculado separadamente.

O teste do pacote abre `dist/win-unpacked/Roleta de Operações.exe`. O instalador NSIS foi gerado, mas seu assistente de instalação ainda não foi testado. A distribuição não possui assinatura digital.

## Teste no computador da escola

Ainda falta validar no equipamento de destino:

1. Windows 10 ou 11 x64 e permissão para instalar ou executar o aplicativo com o usuário da escola.
2. Instalação ou extração do ZIP e primeira abertura com a rede desligada.
3. Legibilidade no projetor, escala da tela e modo de tela cheia.
4. Fluidez do giro com o hardware e os drivers gráficos locais.

Os testes automatizados não cobrem as políticas de execução da escola nem o desempenho no projetor. Eventuais bloqueios do executável sem assinatura precisam ser avaliados pela equipe de TI.

## Automação de Releases

A configuração do Actions acrescentou nove testes, totalizando 27 testes unitários aprovados. Eles verificam a correspondência entre tag, manifesto e lock, os nomes dos pacotes por versão e as condições de publicação: instalador ausente ou alterado, Release existente, tag movida, erros da API e upload incompleto.

Os testes de publicação usam uma API simulada e não criam Releases. O workflow passou no actionlint 1.7.12. A distribuição foi gerada novamente, conferida e aprovada no teste do executável com rede emulada offline.

A [execução da tag v1.0.0](https://github.com/grbvieira/Roleta-de-Operacoes/actions/runs/34555907287) terminou com sucesso nos dois jobs: testes e empacotamento no runner Windows, seguidos do upload e da publicação do instalador na [Release v1.0.0](https://github.com/grbvieira/Roleta-de-Operacoes/releases/tag/v1.0.0). O [procedimento de lançamento](releases.md) descreve as próximas versões e as reexecuções.

## Ajuda e informações — verificação local em 11/09/2026

A nova área foi verificada em desenvolvimento e no executável empacotado, com perfil novo e rede emulada offline. Os 27 testes unitários também passaram.

- Botão no menu e na atividade; acesso às três seções e versão correspondente a `app.getVersion()`.
- Navegação com Tab, Shift+Tab, setas, Home e End; foco visível e contido no diálogo; retorno ao botão de ajuda ao fechar.
- Conteúdo rolável por teclado e botão de fechar acessível em 960 × 680.
- F11 com entrada nativa do Electron; Escape fecha primeiro a ajuda ou os ajustes, sem sair da tela cheia no mesmo acionamento, inclusive ao manter a tecla pressionada.
- Diálogos de ajuda e configurações não se sobrepõem; ajuda desabilitada durante o giro.
- Contas, seleção, resposta oculta ou revelada e configurações preservadas ao abrir e fechar a ajuda nas quatro operações.
- Cópia do endereço fixo pelo preload/IPC, com confirmação acessível e mensagem de erro quando a cópia falha.
- Renderer sem Node.js, com sandbox e isolamento de contexto; nenhuma requisição externa nem erro JavaScript registrado nos fluxos concluídos.

O teste de cópia substitui temporariamente `clipboard.writeText` no processo de teste para conferir o endereço recebido sem sobrescrever a área de transferência do usuário. Não abre um aplicativo de e-mail nem envia mensagens.

As capturas das três seções foram inspecionadas. A verificação da distribuição confere também `desktop/preload.cjs`, `app/help.mjs` e o `LEIA-ME.txt`. O `app.asar` dentro do ZIP foi comparado com o da pasta testada e é idêntico. O PowerPoint local mantém seu hash original.

Esses resultados se referem ao código e ao pacote local atualizados. A Release v1.0.0 publicada anteriormente não foi alterada e ainda não contém a ajuda. A instalação e o teste no equipamento da escola permanecem pendentes.
