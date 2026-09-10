# Validação da versão 1.0.0

Concluída em 10/09/2026, no ambiente Windows x64 de desenvolvimento, build 10.0.26200. O diagnóstico foi corrigido para aplicativo desktop independente. As entregas são um instalador NSIS completo e um ZIP para Windows x64.

## Verificações concluídas

| Verificação | Resultado |
| --- | --- |
| Testes unitários de matemática e roleta | 18 aprovados |
| Espaço de contas válidas | Comparado com enumeração independente em 400 configurações |
| Geração e renovação | 200 rodadas verificadas, sem duplicações e dentro dos limites |
| Subtração e divisão | Sem resultados negativos; divisões exatas; divisor zero rejeitado |
| Configurações impossíveis | Mensagens adequadas, sem travar a geração |
| Seleção geométrica | Todos os destinos de 1 a 10 setores testados, incluindo giros sucessivos e bordas |
| Desaceleração | Avanço monotônico, velocidade decrescente e ângulo final exato |
| Interface em desenvolvimento | Quatro categorias, giro, resposta, configuração, renovação e persistência aprovados |
| Executável empacotado | Mesmos fluxos aprovados no próprio `Roleta de Operações.exe` |
| Primeira abertura offline | Perfil de usuário novo, rede emulada offline antes de carregar a atividade, imagens locais disponíveis |
| Runtime incluído | Executável confirmou Electron 44.3.0 e Node.js incorporado 24.20.0 |
| Setor, conta e resposta | Ponta da seta testada dentro da forma SVG real; texto e resultado correspondentes |
| Leitura dos setores | Conta apontada horizontal e na orientação correta após a parada |
| Rodadas pequenas | Roletas de três setores e um setor exercitadas na interface e no EXE |
| Renovação | Novas contas ao renovar e reentrar; resposta anterior apagada |
| Persistência | Configuração mantida ao fechar e reabrir o EXE |
| Layout | Sem sobreposição dos personagens com a roleta ou rolagem horizontal em 960 × 680 |
| Código e imagens no pacote | Idênticos aos arquivos-fonte conferidos |
| Conteúdo do ZIP | `resources/app.asar` idêntico ao da pasta empacotada testada |
| Identificação do EXE | Nome do produto e versão 1.0.0 gravados no executável, com ícone próprio |
| PowerPoint original | SHA-256 preservado |

Resultados automáticos estão em `test-results/desktop/resultado.json` e `test-results/packaged/resultado.json`. Nenhum erro JavaScript ou requisição HTTP/HTTPS foi registrado nos fluxos concluídos.

## Condições dos testes desktop

Os testes executaram o aplicativo Electron real, em janela oculta, com perfil vazio. A renderização por software (`--disable-gpu`) evitou uma falha de captura do compositor de janelas ocultas. Essa opção é aplicada pelo script de teste e não pela inicialização normal do aplicativo.

O teste emulado offline verifica o funcionamento sem rede e sem cache de uma sessão anterior. Não substitui uma execução no computador da escola com a conexão fisicamente desligada. O código bloqueia conexões externas e todos os recursos necessários estão incluídos na distribuição.

A interface foi inspecionada em capturas do Electron. As asserções de seleção usam a geometria real do SVG, independentemente da função que calcula o setor, e calculam a resposta esperada separadamente.

## Arquivos de entrega

- `dist/Roleta-Operacoes-1.0.0-Windows-x64-Instalador.exe`: aproximadamente 107 MiB, instalador completo por usuário.
- `dist/Roleta-Operacoes-1.0.0-Windows-x64.zip`: aproximadamente 147 MiB, aplicativo com todos os arquivos para extração e execução.
- `dist/SHA256SUMS.txt`: hashes dos dois arquivos para conferência após a cópia.

O instalador foi compilado, mas seu assistente de instalação não foi executado neste computador. O teste funcional usou `dist/win-unpacked/Roleta de Operações.exe`. O arquivo `app.asar` dentro do ZIP foi comparado com a pasta testada.

O instalador e o aplicativo não têm assinatura digital. Isso foi confirmado na distribuição. Não há certificado de publicação configurado.

## O que depende do computador da escola

1. Confirmar Windows 10 ou Windows 11 x64. Windows 7, 8, 8.1, 32 bits e uma distribuição nativa ARM64 não estão no escopo desta entrega.
2. Verificar instalação ou execução por um usuário comum, regras de antivírus/SmartScreen, restrições de aplicativos e eventual modo S. Se houver bloqueio, a equipe de TI precisa avaliar a liberação; não é necessário desativar proteções.
3. Fazer a primeira abertura real com a rede desligada, usando o instalador ou o ZIP extraído integralmente.
4. Verificar legibilidade, escala da tela, resolução do projetor, modo de tela cheia e funcionamento com mouse/teclado usados na atividade.
5. Verificar a fluidez da roleta e a renderização com o hardware e os drivers gráficos locais.

O suporte a Windows 10 e posteriores é declarado pelo [Electron 44.3.0](https://github.com/electron/electron/blob/v44.3.0/README.md#platform-support). A compatibilidade com a versão concreta da escola ainda exige esse teste local.

## Preservação da referência

SHA-256 de `roleta da adição.pptx`:

```text
CF046654938448F25EAB8DE4D5D0C3F21A497E8EDF0A5FE6159B1AE6281B48C2
```

As imagens foram copiadas das entradas originais do PPTX e mantidas sem transformação. A mudança de posicionamento ocorreu no layout do aplicativo, com áreas separadas para roleta e personagens.
