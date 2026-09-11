<img src="app/assets/app-icon.svg" width="72" height="72" alt="Ícone da Roleta de Operações">

# Roleta de Operações

Aplicativo para praticar adição, subtração, multiplicação e divisão em sala de aula. Escolha uma operação, gire a roleta e use **Mostrar resposta** para conferir a conta selecionada.

Funciona offline desde a primeira abertura, em Windows 10 e 11 x64. O instalador e o ZIP incluem tudo o que o aplicativo precisa para funcionar.

## Como usar

1. Escolha uma das quatro operações.
2. Em **Ajustar números**, defina os intervalos. Para fixar um número, use o mesmo valor no mínimo e no máximo.
3. Clique em **Girar** e aguarde a parada.
4. Resolva a conta indicada pela seta e clique em **Mostrar resposta**.
5. Use **Novas contas** para renovar a rodada.

A roleta tem até dez contas diferentes. As subtrações têm resultado não negativo e as divisões são exatas, sem divisor zero. As configurações ficam salvas por operação.

**F11** alterna a tela cheia; **Esc** sai desse modo. O [LEIA-ME.txt](LEIA-ME.txt) acompanha o aplicativo com as instruções para a escola.

## Instalação no Windows

| Distribuição | Como abrir |
| --- | --- |
| Instalador `.exe` | Execute o instalador e abra o aplicativo pelo atalho criado |
| ZIP | Extraia a pasta inteira e abra `Roleta de Operações.exe` |

No ZIP, mantenha o executável e seus arquivos auxiliares juntos.

A distribuição é para **Windows 10 e 11 x64 (Intel/AMD)**. Windows 7, 8, 8.1 e sistemas de 32 bits não são suportados. Não há pacote nativo ARM64 neste projeto. A compatibilidade acompanha o [Electron 44.3.0](https://github.com/electron/electron/blob/v44.3.0/README.md#platform-support).

A versão 1.0.0 não tem assinatura digital. A instalação e o uso no projetor ainda precisam ser conferidos no computador da escola; veja o [registro de testes](docs/validacao.md).

## Desenvolvimento

Requisitos: Git, Node.js 22.12 ou posterior e npm. No PowerShell:

```powershell
git clone https://github.com/grbvieira/Roleta-de-Operacoes.git
cd Roleta-de-Operacoes
npm.cmd ci
npm.cmd start
```

O primeiro download das dependências precisa de internet. `npm.cmd start` abre a janela Electron. Node.js e npm são ferramentas de desenvolvimento; não precisam ser instalados no computador da escola.

## Testes

```powershell
npm.cmd test
npm.cmd run test:desktop
```

O primeiro comando testa as regras matemáticas e a seleção da roleta. O segundo verifica os fluxos na janela Electron, incluindo giro, resposta, renovação e persistência, com rede emulada offline.

Os relatórios e as capturas ficam em `test-results/`. A cobertura e as limitações estão em [docs/validacao.md](docs/validacao.md).

## Gerar a distribuição

No Windows, com as dependências instaladas:

```powershell
npm.cmd run dist:win
npm.cmd run test:packaged
npm.cmd run verify:distribution
```

Arquivos gerados para a versão 1.0.0:

```text
dist/Roleta-Operacoes-1.0.0-Windows-x64-Instalador.exe
dist/Roleta-Operacoes-1.0.0-Windows-x64.zip
dist/SHA256SUMS.txt
```

O empacotamento pode baixar ferramentas ainda ausentes do cache. Depois de gerado, o pacote funciona sem internet. Para gerar apenas a pasta do aplicativo, use `npm.cmd run pack:win`.

`test:packaged` testa o executável em `dist/win-unpacked/`. `verify:distribution` confere o código e as imagens empacotados e grava os hashes do instalador e do ZIP.

Os pacotes ficam fora do Git. O comando local de empacotamento não publica nada; o GitHub Actions publica o instalador em [Releases](https://github.com/grbvieira/Roleta-de-Operacoes/releases) quando uma tag de versão é enviada e todas as verificações passam. O ZIP do botão **Code** contém o código-fonte, não o aplicativo pronto.

## Publicar uma versão

O workflow [Release Windows](.github/workflows/release-windows.yml) é acionado por tags como `v1.0.0`. Ele confere a versão do aplicativo e do lock, executa os testes e gera o instalador em um runner Windows. A Release recebe o instalador, notas automáticas e o SHA-256 do arquivo.

Veja o [procedimento de lançamento](docs/releases.md) para atualizar a versão, enviar a tag e tratar uma execução que falhou. Releases existentes nunca são substituídas automaticamente.

## Código e documentação

- [Arquitetura](docs/arquitetura.md): módulos, regras das contas e cálculo do giro.
- [Testes](docs/validacao.md): verificações realizadas e teste pendente na escola.
- [Lançamentos](docs/releases.md): publicação do instalador pelo GitHub Actions.
- [Origem das imagens](app/assets/ORIGEM.md): recursos aproveitados da apresentação.

O PowerPoint `roleta da adição.pptx` é uma referência local e está no `.gitignore`. As imagens necessárias já estão em `app/assets/`; o original não é necessário para executar ou empacotar o projeto. Quem tiver o arquivo na raiz pode conferir sua integridade com `npm.cmd run verify:reference`.
