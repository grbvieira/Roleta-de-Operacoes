# Arquitetura

A Roleta de Operações usa HTML, CSS e JavaScript em uma janela Electron. O electron-builder gera um instalador NSIS e um ZIP para Windows x64, ambos com os recursos necessários para executar a atividade offline.

## Organização

| Arquivo | Função |
| --- | --- |
| `desktop/main.cjs` | Cria a janela e serve os arquivos locais pelo protocolo `roleta://app` |
| `app/core/math.mjs` | Valida intervalos, gera contas e renova as rodadas |
| `app/core/wheel.mjs` | Calcula os ângulos, a desaceleração e o setor apontado |
| `app/renderer.mjs` | Controla a atividade e desenha a roleta em SVG |
| `app/styles.css` | Define o layout e reserva espaço para os personagens |
| `scripts/` | Reúne o empacotamento e as verificações do aplicativo |
| `tests/` | Testa a matemática e a geometria sem abrir a interface |

Os módulos de `app/core/` não dependem do DOM nem do Electron. A interface e os testes usam esses mesmos módulos.

## Geração das contas

Cada operação tem seus próprios intervalos, com limites inteiros de 0 a 1.000. Na divisão, o divisor começa em 1. Mínimo e máximo iguais fixam um número.

| Operação | Intervalos iniciais | Regra |
| --- | --- | --- |
| Adição | Duas parcelas de 0 a 10 | Soma das parcelas |
| Subtração | Dois números de 0 a 10 | Primeiro número maior ou igual ao segundo |
| Multiplicação | Dois fatores de 0 a 10 | Produto dos fatores |
| Divisão | Dividendo de 0 a 100; divisor de 1 a 10 | Resto zero e divisor positivo |

O gerador representa as combinações válidas de forma compacta e sorteia até dez pares diferentes. Não precisa criar uma lista com todas as contas nem repetir tentativas até encontrar uma divisão exata.

Entrar na categoria ou usar **Novas contas** gera outra rodada. Com mais de dez combinações, pelo menos uma conta muda. Com duas a dez, todas aparecem e a ordem muda. Com uma única combinação, é necessário ampliar os intervalos para obter outra conta. Intervalos sem contas válidas produzem uma mensagem na interface.

## Giro e seleção

A seta fica à esquerda, no ângulo de 180°. Os setores começam em −90° e seguem o sentido horário. O giro sorteia um setor e calcula a rotação necessária para colocar seu centro sob a seta, após pelo menos cinco voltas.

A animação dura 4,2 segundos e usa a curva `1 - (1 - t)^5` para desacelerar. Ao terminar, `sectorAtPointer` calcula a seleção a partir do ângulo final. Essa seleção determina a conta exibida e a resposta.

Durante o giro, os controles que alteram a rodada ficam desabilitados. **Mostrar resposta** só é habilitado após a parada. Outro giro, uma nova rodada ou a troca de categoria apagam a resposta anterior.

## Execução local

O protocolo `roleta://app` lê os arquivos do aplicativo sem abrir servidor HTTP. A janela usa sandbox, isolamento de contexto e acesso ao Node.js desabilitado na interface. Requisições externas e novas janelas são bloqueadas.

As configurações de cada operação ficam no armazenamento local do perfil do usuário. Se esse armazenamento falhar, a atividade continua disponível durante a sessão.

O pacote inclui o Electron e as imagens. `LEIA-ME.txt` acompanha a distribuição como guia de uso; o PowerPoint, os testes e as ferramentas de desenvolvimento ficam fora dela. As versões das dependências estão fixadas em `package.json` e `package-lock.json`.

## Referência visual

O arquivo `roleta da adição.pptx` é uma referência local, ignorada pelo Git. Ele contém três slides com roletas de dez setores para adição, subtração e multiplicação. As imagens usadas pelo aplicativo estão em `app/assets/`; a origem de cada uma está em [ORIGEM.md](../app/assets/ORIGEM.md).

Os personagens ocupam o menu e a lateral da atividade, sem cobrir a roleta. O PowerPoint não é necessário para executar, testar a atividade ou gerar a distribuição. Quem tiver o original na raiz pode conferir sua integridade com `npm.cmd run verify:reference`.
