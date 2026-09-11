# Componentes distribuídos e avisos

A inspeção considerou `package.json`, o conteúdo de `resources/app.asar`, a pasta `dist/win-unpacked/` e os arquivos do runtime em `node_modules/electron/dist/`.

| Grupo | Presença no produto | Avisos |
| --- | --- | --- |
| Código, imagens e ícone da roleta | Dentro de `app.asar` | Procedência em [ORIGEM.md](../app/assets/ORIGEM.md); licença do código ainda não definida |
| Electron 44.3.0 x64 | Executável e arquivos auxiliares | `LICENSE.electron.txt`, licença MIT |
| Chromium, Node.js, V8, ICU e outros componentes | Incorporados ao runtime | Textos completos em `LICENSES.chromium.html` |
| FFmpeg, SwiftShader e componentes Vulkan | Bibliotecas do runtime | Blocos próprios no mesmo HTML; o bloco FFmpeg inclui o texto LGPL |
| Segoe UI, Arial e sans-serif | Fontes do sistema, sem cópias no pacote | Nenhum arquivo de fonte é redistribuído pelo projeto |
| Sons | Nenhum arquivo na atividade | Não aplicável |
| electron-builder, Playwright e dependências npm de desenvolvimento | Ferramentas locais/CI, ausentes como pacotes npm no ASAR | Não são dependências instaladas no computador da escola |
| NSIS 3.0.4.1 | Tecnologia usada para gerar o instalador | `LICENSES.nsis.txt`, cópia do `COPYING` do pacote do empacotador, com os avisos de seus módulos de compressão |

O HTML oficial desta versão contém 780 entradas de avisos, incluindo dependências transitivas e nativas. Isso não equivale a 780 dependências npm do aplicativo nem a uma lista de serviços que ele executa. A lista de dependências diretas do manifesto, sozinha, não descreve o conteúdo do runtime.

Os arquivos originais do Electron são preservados sem edição. `npm.cmd run verify:distribution` compara seus bytes com os arquivos do runtime utilizado no build, além de conferir o [AVISOS-TERCEIROS.txt](../AVISOS-TERCEIROS.txt). O texto de ajuda informa onde encontrar esses documentos para leitura offline.

Não foi encontrada uma licença própria do código do projeto. Não foi escolhida uma nesta alteração. A procedência do avatar e os termos de redistribuição dos recursos visuais ainda dependem de confirmação do responsável.

Referências: [licença do Electron utilizado](https://github.com/electron/electron/blob/v44.3.0/LICENSE), [fontes e revisões das dependências](https://github.com/electron/electron/tree/v44.3.0), [artefatos oficiais](https://github.com/electron/electron/releases/tag/v44.3.0).
