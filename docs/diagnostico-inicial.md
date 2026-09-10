# Diagnóstico inicial da Roleta de Operações

Data: 10/09/2026. Diagnóstico corrigido para a versão desktop 1.0.0.

Destino confirmado: aplicativo independente para Windows, totalmente offline desde a primeira abertura. Abrir `index.html` em um navegador externo não é o formato de entrega.

## Arquivo de referência

A pasta continha somente `roleta da adição.pptx`, com 1.123.616 bytes. Não havia código, configuração de projeto, repositório Git ou instruções AGENTS.md na pasta e nos diretórios ancestrais inspecionados.

O PowerPoint foi lido como um pacote ZIP, sem alterar seu conteúdo. A miniatura e as imagens foram extraídas para uma pasta temporária externa ao projeto. A inspeção visual usou a miniatura incorporada; a estrutura dos três slides, os textos, os gráficos e as animações foram examinados no XML. A apresentação não foi executada em modo de apresentação nesta etapa.

SHA-256 original:

```text
CF046654938448F25EAB8DE4D5D0C3F21A497E8EDF0A5FE6159B1AE6281B48C2
```

### Conteúdo identificado

| Slide | Conteúdo |
| --- | --- |
| 1 | Dez adições, de 1 + 3 até 10 + 3, em ordem distribuída pela roleta |
| 2 | Dez subtrações, de 4 − 3 até 13 − 3 |
| 3 | Dez multiplicações, de 1 × 3 até 10 × 3 |

Os slides estão em formato 16:9. A referência visual mostra cenário escolar ilustrado, personagens, dez setores iguais em verde, ciano, vermelho, magenta e amarelo, seta roxa lateral e botão magenta “Play/Stop”. As contas são textos editáveis sobre gráficos de pizza. As imagens do cenário e dos personagens estão incorporadas ao arquivo.

Os três slides contêm uma animação de rotação do grupo da roleta, configurada para uma volta a cada dois segundos, repetição indefinida e sequência acionada pelo botão. Isso descreve a configuração encontrada, sem validar a reprodução ao vivo no PowerPoint.

Não foram encontrados menu de categorias, slide de divisão, configuração dos números, geração automática de contas, botão de resposta, macros VBA ou mídia de áudio/vídeo. As planilhas Excel incorporadas estão associadas aos gráficos.

## Ferramentas locais

| Ferramenta | Resultado da inspeção |
| --- | --- |
| Windows | Ambiente de 64 bits confirmado |
| Node.js | 24.15.0, executável verificado |
| npm | 11.12.1, comando `npm.cmd` verificado |
| Git | 2.53.0.windows.3, executável verificado |
| VS Code | Instalado, versão do executável 1.136.2 |
| PowerPoint | Instalado em Office16, versão do executável 16.0.20326.20132 |
| Chrome | Instalado, versão do executável 153.0.8010.36 |
| Edge | Instalado, versão do executável 152.0.4191.66 |
| Python | Lançador `py` presente, mas ele não encontrou interpretadores; `python` não está no PATH |
| .NET | Runtimes 8, 9 e 10 presentes; nenhum SDK listado |
| LibreOffice e Poppler | Não localizados nos caminhos consultados |

A consulta inicial aos pacotes npm globais retornou que a pasta de pacotes globais não existe. Isso não impede o projeto: as ferramentas são instaladas localmente. Na implementação foram fixados Electron 44.3.0, electron-builder 26.15.3 e Playwright 1.63.0. As versões completas das dependências estão em `package-lock.json`.

A consulta inicial detalhada do Windows por CIM retornou acesso negado. O ambiente de desenvolvimento Windows x64 permite desenvolver e empacotar a aplicação. O computador da escola ainda não foi inspecionado.

## Estrutura desktop implementada

HTML, CSS e JavaScript rodam dentro de uma janela do Electron, com Chromium e Node.js incluídos na distribuição. A escola abre `Roleta de Operações.exe`, por um atalho instalado ou pela pasta extraída do ZIP. Não precisa de navegador externo, PowerPoint, Node.js instalado, conta no ChatGPT, login ou conexão com a internet.

O empacotador electron-builder está configurado desde a primeira versão para produzir um instalador NSIS completo e um ZIP para Windows x64. O instalador é por usuário, sem requerer elevação administrativa. O ZIP deve ser extraído inteiro, mantendo o executável e seus arquivos auxiliares juntos.

```text
roleta da adição.pptx       referência original preservada
desktop/main.cjs           janela Electron e carregamento local
app/index.html             interface interna do aplicativo desktop
app/styles.css             aparência baseada no PowerPoint
app/renderer.mjs           navegação, estado e interação
app/core/math.mjs          geração e validação, independente da interface
app/core/wheel.mjs         ângulos, seleção e desaceleração
app/assets/                cópias dos recursos visuais originais
tests/                     testes unitários de matemática e geometria
scripts/                   empacotamento, teste desktop e verificação do PPTX
test-results/              resultados e capturas dos testes locais
dist/                      instalador, ZIP e aplicativo empacotado
README.md                  instruções de desenvolvimento
LEIA-ME.txt                instruções para o computador da escola
docs/                      diagnóstico e validação da versão
```

O protocolo interno `roleta://app` entrega somente os arquivos incluídos no pacote `app.asar`, sem servidor ou porta local. Os módulos matemáticos são os mesmos usados pela interface e pelos testes. O processo de interface não tem acesso ao Node.js. Conteúdo, scripts e imagens são locais; requisições HTTP/HTTPS e novas janelas externas são bloqueadas. Não há atualizador nem download inicial.

As configurações ficam salvas por operação no perfil local do usuário, sob uma origem estável interna ao Electron. Se o armazenamento não estiver disponível, a atividade continua funcionando na sessão. As imagens do PowerPoint foram extraídas sem edição e ocupam áreas próprias, fora da roleta: cenário e turma no menu, professor e estudantes na lateral da atividade.

### Compatibilidade Windows

O [Electron 44.3.0 declara suporte a Windows 10 e posteriores, com binários x64 e ARM64](https://github.com/electron/electron/blob/v44.3.0/README.md#platform-support). A distribuição deste projeto é **Windows 10 e Windows 11 x64 (Intel/AMD de 64 bits)**. Windows 7, 8, 8.1 e Windows de 32 bits não são suportados. ARM64 exigiria outra compilação e validação; não está incluído nesta distribuição. Não há garantia de funcionamento em modo S ou em ambientes que proíbam aplicativos desktop externos.

Isso informa a compatibilidade da aplicação e não altera o ciclo de suporte do próprio Windows. A versão exata do Windows da escola e suas políticas de execução ainda precisam ser verificadas. A primeira distribuição não tem assinatura digital.

## Comportamento implementado

1. Menu com Adição, Subtração, Multiplicação e Divisão.
2. Configuração de intervalos numéricos por operação, com opção de fixar um dos números, como o 3 da referência.
3. Ao entrar ou voltar a entrar em uma categoria, gerar uma nova rodada de contas, limpar a seleção anterior e esconder a resposta. Evitar repetir a rodada quando existirem alternativas válidas.
4. Começar com dez setores, seguindo a referência. Não repetir contas dentro da rodada quando houver combinações suficientes. Tratar intervalos pequenos explicitamente, sem travar a geração nem prometer dez contas diferentes quando isso for impossível.
5. Um clique em “Girar” inicia cinco ou mais voltas, com desaceleração e parada automática em aproximadamente 4,2 segundos. A seta permanece à esquerda. O ângulo final determina o setor, que determina a conta e sua resposta. Durante o giro, os botões que mudam a rodada ficam indisponíveis.
6. Exibir a conta selecionada em tamanho grande. Habilitar “Mostrar resposta” somente após a seleção; revelar apenas a resposta dessa conta. Esconder a resposta ao iniciar outro giro ou trocar de categoria.
7. Botões para voltar ao menu e gerar novas contas sem sair da categoria.

### Regras matemáticas iniciais

- Números inteiros não negativos.
- Adição: respeitar os intervalos configurados para as parcelas.
- Subtração: gerar somente pares em que o primeiro número seja maior ou igual ao segundo; resultado zero é permitido.
- Multiplicação: respeitar os intervalos dos fatores.
- Divisão: divisor estritamente positivo, dividendo dentro do intervalo configurado e resto zero. Pode-se gerar pares de divisor e quociente e obter o dividendo pelo produto, verificando seus limites.
- Validar entradas e avisar quando uma configuração não permitir nenhuma conta válida.

Valores iniciais ajustáveis: de 0 a 10 em adição, subtração e multiplicação; dividendos de 0 a 100 e divisores de 1 a 10 na divisão. Cada limite pode ser configurado entre 0 e 1.000; divisores começam em 1. Usar o mesmo mínimo e máximo fixa um número. A geração usa uma representação compacta, sem montar uma lista de um milhão de contas ou depender de tentativas aleatórias para encontrar pares válidos.

## O que falta

As ferramentas necessárias para desenvolver e empacotar estão instaladas localmente. Internet é necessária apenas no computador de desenvolvimento para baixar dependências e ferramentas de empacotamento ainda ausentes do cache. O pacote entregue à escola contém tudo de que a atividade precisa.

Para finalizar e validar a entrega à escola, ainda será necessário confirmar:

- Versão exata do Windows e arquitetura x64 do computador da escola.
- Políticas de instalação/execução de aplicativos, inclusive executáveis sem assinatura digital e eventual modo S.
- Resolução, escala da tela ou do projetor e desempenho da animação.
- Abertura real sem internet, incluindo instalação ou extração do pacote com uma conta comum da escola.

Não é preciso confirmar o navegador da escola. Os limites pedagógicos podem ser ajustados na interface.

## Verificação prevista antes da entrega

- Contas corretas, subtrações sem negativos e divisões exatas sem divisor zero, incluindo limites e configurações impossíveis.
- Correspondência entre setor apontado, conta exibida e resposta revelada.
- Resposta escondida durante giro e após mudanças de categoria ou rodada.
- Renovação das contas ao entrar novamente na categoria, respeitando o conjunto de combinações disponíveis.
- Abertura do próprio aplicativo Electron e de seu executável empacotado com perfil vazio, recursos locais e rede emulada offline.
- Teste no Windows real da escola, incluindo políticas locais, projetor e conta de usuário comum.
- Conferência do SHA-256 para assegurar a preservação do PowerPoint original.

A implementação e os comandos para executar, testar e gerar a distribuição estão descritos em `README.md`. O registro dos testes concluídos fica em `docs/validacao.md`.
