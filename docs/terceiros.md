# Componentes distribuídos e avisos

A inspeção considerou `package.json`, o conteúdo de `resources/app.asar`, a pasta `dist/win-unpacked/` e os arquivos do runtime em `node_modules/electron/dist/`.

| Grupo | Presença no produto | Avisos |
| --- | --- | --- |
| Código, imagens e ícone da roleta | Dentro de `app.asar` | Software sob [licença proprietária de uso gratuito](../LICENSE.txt); recursos visuais descritos separadamente em [ORIGEM.md](../app/assets/ORIGEM.md) |
| Electron 44.3.0 x64 | Executável e arquivos auxiliares | `LICENSE.electron.txt`, licença MIT |
| Chromium, Node.js, V8, ICU e outros componentes | Incorporados ao runtime | Textos completos em `LICENSES.chromium.html` |
| FFmpeg, SwiftShader e componentes Vulkan | Bibliotecas do runtime | Blocos próprios no mesmo HTML; o bloco FFmpeg inclui o texto LGPL |
| Segoe UI, Arial e sans-serif | Fontes do sistema, sem cópias no pacote | Nenhum arquivo de fonte é redistribuído pelo projeto |
| Sons | Nenhum arquivo na atividade | Não aplicável |
| electron-builder, Playwright e dependências npm de desenvolvimento | Ferramentas locais/CI, ausentes como pacotes npm no ASAR | Não são dependências instaladas no computador da escola |
| NSIS 3.0.4.1 | Tecnologia usada para gerar o instalador | `LICENSES.nsis.txt`, cópia do `COPYING` do pacote do empacotador, com os avisos de seus módulos de compressão |

O HTML oficial desta versão contém 780 entradas de avisos, incluindo dependências transitivas e nativas. Isso não equivale a 780 dependências npm do aplicativo nem a uma lista de serviços que ele executa. A lista de dependências diretas do manifesto, sozinha, não descreve o conteúdo do runtime.

Os arquivos originais do Electron são preservados sem edição. `npm.cmd run verify:distribution` compara seus bytes com os arquivos do runtime utilizado no build, além de conferir o [AVISOS-TERCEIROS.txt](../AVISOS-TERCEIROS.txt). O texto de ajuda informa onde encontrar esses documentos para leitura offline.

Na inspeção da Release v1.0.0 e de sua árvore de código não foi encontrada uma licença própria do projeto. A partir da v1.1.0, o responsável adotou a licença em `LICENSE.txt`, sem alteração retroativa de permissões anteriores. Os avisos de terceiros permanecem preservados. Os quatro novos recursos, incluindo o avatar, foram gerados no ChatGPT conforme confirmação do responsável; não há declaração de direitos exclusivos sobre eles.

A licença própria preserva as permissões de visualização e fork aplicáveis ao repositório público pelos [termos do GitHub](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service). O repositório permanece público.

Referências: [licença do Electron utilizado](https://github.com/electron/electron/blob/v44.3.0/LICENSE), [fontes e revisões das dependências](https://github.com/electron/electron/tree/v44.3.0), [artefatos oficiais](https://github.com/electron/electron/releases/tag/v44.3.0).
