# Registro de verificações

Os registros são separados por etapa. A versão atual do manifesto é 1.1.0. Os resultados e as pendências históricas abaixo descrevem o estado em cada data; a atualização mais recente está ao final.

O usuário confirmou o funcionamento no computador da escola e a desinstalação em relato recebido nesta tarefa, em 12/09/2026. Esses itens estão concluídos conforme esse relato, sem atribuí-los a uma execução automatizada. Não foram informados a versão testada, detalhes do equipamento ou um teste de atualização entre versões.

## Distribuição inicial — 10/09/2026

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

Roteiro elaborado na preparação inicial. O funcionamento na escola e a desinstalação foram posteriormente confirmados pelo usuário, conforme atualização acima. Os passos abaixo servem para repetir a verificação quando necessário:

1. Windows 10 ou 11 x64 e permissão para instalar ou executar o aplicativo com o usuário da escola.
2. Instalação ou extração do ZIP e primeira abertura com a rede desligada.
3. Legibilidade no projetor, escala da tela e modo de tela cheia.
4. Fluidez do giro com o hardware e os drivers gráficos locais.

Roteiro para a próxima versão, com a conta de usuário usada pelo professor:

- Instalar pelo assistente e conferir os atalhos e os avisos de terceiros na pasta instalada.
- Desligar a rede antes da primeira abertura. Abrir as quatro operações, ajustar intervalos, girar, conferir uma resposta e navegar pelas quatro seções da ajuda.
- Projetar a tela e conferir contas, seta, botões e textos; alternar F11 e verificar que Escape fecha primeiro o diálogo.
- Salvar intervalos diferentes por operação, fechar e reabrir. Conferir que os intervalos continuam salvos e que a atividade abre normalmente.
- Instalar uma versão posterior sobre a anterior, conferir a versão em Sobre e a preservação dos intervalos. Esse teste depende da definição e geração dessa versão posterior.
- Fechar o aplicativo, desinstalar pelas configurações do Windows e conferir a remoção do programa e dos atalhos. Registrar se o perfil local de configurações foi mantido ou removido.

Os testes automatizados desta preparação inicial não executaram instalação, atualização ou desinstalação. O relato posterior do usuário confirma o funcionamento na escola e a desinstalação; não informa teste de atualização. Gerar o instalador e abrir `win-unpacked` não comprova esses procedimentos.

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

## Recursos visuais e créditos — verificações em 11/09/2026

Nesta etapa foram feitas verificações pontuais, conforme solicitado. A suíte completa de testes unitários e de fluxos desktop não foi repetida. Os resultados da seção anterior pertencem à implementação inicial da ajuda, antes da troca das imagens e da inclusão da quarta seção.

| Verificação executada | Resultado |
| --- | --- |
| `node scripts/check-assets.mjs` | Aprovada em desenvolvimento |
| `npm.cmd run dist:win` | Instalador NSIS e ZIP x64 gerados localmente, sem publicação |
| `npm.cmd run verify:distribution` | Código, novas imagens, ícones, guia e avisos conferidos; hashes das entregas gravados |
| `node scripts/check-assets.mjs --packaged` | Aprovada no executável de `win-unpacked` |
| Comparação adicional do ZIP | `app.asar`, guia e quatro arquivos de avisos idênticos aos da pasta empacotada |
| `npm.cmd run verify:reference` | PowerPoint com o SHA-256 original |
| Sintaxe dos scripts alterados e `git diff --check` | Sem erros |

A verificação pontual abriu as quatro operações, decodificou os quatro novos PNGs e executou um giro de adição. A geometria do SVG confirmou o setor sob a seta; a resposta foi comparada com uma soma calculada separadamente. Abrir as quatro seções da ajuda e fechá-la preservou a roleta, a conta, a resposta e as configurações.

As duas execuções usaram perfil novo e rede emulada offline. Não registraram erros JavaScript nem requisições externas HTTP/HTTPS/WS/WSS durante os fluxos observados. Foram conferidos o layout em 960 × 680, a ausência de rolagem horizontal e de sobreposição entre personagens e roleta, além de F11 e Escape fechando a ajuda sem sair da tela cheia.

As capturas reais do menu, da atividade e dos créditos foram inspecionadas, incluindo janela menor e tela cheia. As capturas atualizadas estão em `docs/imagens/`; as anteriores foram preservadas em `docs/referencias/capturas-v1.0.0/`. Resultados e capturas locais ficam em `test-results/assets/` e `test-results/assets-packaged/`.

Os PNGs mantêm os arquivos fornecidos, suas proporções e a transparência dos personagens. Os antigos recursos foram preservados fora da distribuição. O ícone foi inspecionado: seus símbolos vetoriais não usam as ilustrações antigas.

O instalador gerado mede aproximadamente 114,7 MiB e o ZIP, 154,5 MiB. A conferência confirmou os novos recursos e os avisos originais do Electron, Chromium e NSIS; o PowerPoint, as referências antigas e os arquivos de desenvolvimento ficaram fora do pacote. Isso verifica o conteúdo preparado para distribuição, sem substituir o teste do assistente de instalação.

Continuam pendentes a instalação, atualização, desinstalação e o uso real no projetor da escola, seguindo o roteiro acima. A procedência completa do avatar, os termos de uso e redistribuição das imagens e a licença do código dependem do responsável; veja [ORIGEM.md](../app/assets/ORIGEM.md) e o [inventário de terceiros](terceiros.md).

## Versão 1.1.0 — 12/09/2026

Atualização do registro anterior: o responsável confirmou a geração dos quatro novos recursos no ChatGPT, incluindo o avatar, e definiu a licença proprietária de uso gratuito. Esses pontos estão resolvidos conforme suas decisões, sem declaração de direitos exclusivos sobre as imagens. A árvore da tag v1.0.0 e a Release anterior foram consultadas; não foi encontrada uma licença própria do projeto, e nenhuma permissão anterior ou licença de terceiros foi substituída retroativamente.

O funcionamento no computador da escola e a desinstalação foram confirmados pelo usuário. O relato não identifica a versão usada, a data de cada teste ou detalhes sobre hardware, projetor e rede; não foram acrescentados resultados específicos a essa confirmação. Atualização entre versões não foi relatada.

Verificações locais desta preparação:

- 28 testes unitários aprovados, incluindo correspondência entre a licença completa offline, o documento canônico e os metadados.
- `verify:release -- v1.1.0` aprovado: versão do aplicativo e as duas entradas do lock correspondem à tag preparada.
- `test:desktop` aprovado: quatro operações, seta e respostas, ajustes, renovação, persistência ao reabrir, ajuda, teclado e licença completa com perfil novo e rede emulada offline.
- Workflow aprovado no actionlint 1.7.12; testes de publicação verificam as notas em português, o hash e a recusa de Releases existentes, sem chamadas reais de publicação nesses testes.
- PowerPoint com hash original; revisão dos arquivos previstos para envio sem arquivos ignorados rastreados ou padrões comuns de credenciais identificados.

O texto completo da licença foi inspecionado na interface real. Nenhum teste automatizado aqui descrito executa o assistente de instalação, a atualização ou a desinstalação do aplicativo.

`dist:win`, `test:packaged` e `verify:distribution` também foram concluídos com sucesso para a v1.1.0. O executável empacotado passou nos mesmos fluxos offline da interface, incluindo a licença completa. O verificador foi corrigido para procurar `LICENSE.txt` junto ao executável: arquivos declarados em `extraFiles` são excluídos do ASAR pelo empacotador. A ajuda contém o texto gerado em `app/license.mjs`, conferido contra o documento canônico.

Uma comparação adicional confirmou que o ASAR, a licença própria, o guia e os quatro avisos de terceiros no ZIP são idênticos aos da pasta testada. O instalador local tem aproximadamente 114,7 MiB; o ZIP, 154,5 MiB. A captura dos créditos foi atualizada a partir do executável real. A execução do Actions e a Release correspondentes podem ser consultadas no GitHub; sucesso do build não substitui o teste de atualização ainda não relatado.

### Publicação confirmada

A [execução 34707727230](https://github.com/grbvieira/Roleta-de-Operacoes/actions/runs/34707727230) terminou com sucesso nos dois jobs. A [Release v1.1.0](https://github.com/grbvieira/Roleta-de-Operacoes/releases/tag/v1.1.0) está publicada, marcada como versão mais recente e corresponde ao commit `1f529064c17fdf418c21fff10075ca949b733696`.

O instalador publicado foi baixado e seu SHA-256 coincide com o digest do anexo e com as notas da Release: `c91e2948b3f19fd4f73f15a6bff8f9c6a4c90e40af927f2917be2de9ac607442`. As notas em português e o histórico automático estão presentes. A Release v1.0.0 mantém o commit e o digest anteriores. Essa conferência do download não executou o instalador.
