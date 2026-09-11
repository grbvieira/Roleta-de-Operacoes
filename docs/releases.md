# Publicar uma versão Windows

O workflow `.github/workflows/release-windows.yml` publica o instalador quando uma tag no formato `vX.Y.Z` é enviada ao GitHub. A versão precisa ser estável, sem sufixos como `-beta`, e corresponder exatamente a `package.json` e às duas entradas de versão do `package-lock.json`.

Pushes de branches não disparam esse workflow. A configuração não exige criar tokens ou secrets: a publicação usa o `GITHUB_TOKEN` fornecido pelo Actions.

## Preparar e enviar a tag

Com as alterações da versão revisadas e commitadas, atualize a branch `main` e confirme que a pasta de trabalho está limpa. No PowerShell, substitua `1.0.1` pela versão que será lançada:

```powershell
npm.cmd version 1.0.1 --no-git-tag-version
npm.cmd run verify:release -- v1.0.1
npm.cmd test
git add package.json package-lock.json
git commit -m "chore(release): prepara versão 1.0.1"
git push origin main
git tag -a v1.0.1 -m "Roleta de Operações 1.0.1"
git push origin v1.0.1
```

`npm version` atualiza o manifesto e o lock. A opção `--no-git-tag-version` deixa a criação do commit e da tag para os comandos seguintes. **O último comando inicia a compilação e pode publicar a Release.**

Para lançar a versão atual sem incrementá-la, confira os arquivos com `npm.cmd run verify:release -- v1.0.0` e use a tag correspondente ao commit desejado. Não recrie nem mova uma tag que já foi publicada. Correções de uma versão entregue devem receber outro número.

O PowerPoint original não participa do pipeline. As imagens, o ícone e o guia de uso já estão no repositório. O `LEIA-ME.txt` não contém um número de versão fixo; a versão do executável e os nomes dos pacotes vêm de `package.json`.

## Etapas do Actions

Os dois jobs usam `windows-2025`. As Actions estão fixadas por SHA de commit.

1. **Testar e empacotar:** prepara Node.js 24, valida tag e lock, instala com `npm ci` e executa os testes unitários e da interface. Depois gera o instalador NSIS e o ZIP, testa o executável com perfil novo e rede emulada offline e confere os recursos empacotados.
2. **Publicar Release:** recebe somente o instalador aprovado, pelo ID do artefato do primeiro job. Confere nome, tamanho, cabeçalho e SHA-256, verifica a tag remota e recusa uma Release já existente. Cria um rascunho com notas automáticas, envia o instalador e confirma o anexo antes de publicar.

O primeiro job tem `contents: read`. Somente o segundo tem `contents: write`; o token não fica salvo no checkout. O empacotador mantém `publish: 'never'`, portanto não faz uma publicação paralela à do workflow.

O instalador contém Electron e os recursos locais para funcionar offline desde a primeira abertura. O anexo terá um nome como `Roleta-Operacoes-1.0.1-Windows-x64-Instalador.exe`. O SHA-256 fica nas notas da Release. O ZIP é gerado e verificado durante o build, mas não é anexado à Release por esse workflow.

Os artefatos do Actions ficam disponíveis por sete dias. O instalador publicado na Release permanece disponível independentemente desse prazo.

## Reexecuções e falhas

- **Falha nos testes ou no empacotamento:** o job de publicação não roda. Para uma falha temporária, use **Re-run failed jobs** na execução do Actions. Se houver correção de código, prepare outra versão e outra tag.
- **Falha antes de criar a Release:** a execução pode ser repetida. Erros de autenticação ou de consulta ao GitHub interrompem o processo, sem serem tratados como ausência de Release.
- **Falha após criar o rascunho:** consulte a Release no GitHub. Se ainda for um rascunho, revise e exclua apenas esse rascunho incompleto antes de reexecutar o job de publicação. Preserve a tag. O workflow não apaga nem sobrescreve anexos automaticamente.
- **Release já publicada:** a reexecução falha com uma mensagem explícita e preserva a versão existente. Se o job perdeu a resposta da API após publicar, confira a página da Release antes de tentar novamente.
- **Artefato expirado:** reexecute todos os jobs para recompilar. Um rascunho existente ainda precisará ser resolvido antes da publicação.

A concorrência é limitada por tag, sem cancelar uma publicação em andamento. Cada tentativa de build guarda um artefato com nome próprio; o job seguinte usa seu ID exato.

## Verificação após o lançamento

Na aba **Actions**, confirme que os dois jobs terminaram com sucesso. Na página **Releases**, confira o anexo e compare o hash depois de baixá-lo:

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath .\Roleta-Operacoes-1.0.1-Windows-x64-Instalador.exe
```

A execução completa no serviço do GitHub só será verificada quando uma tag for enviada. Os testes da publicação feitos localmente simulam a API e não criam Releases.

O instalador continua sem assinatura digital. O Actions não valida o assistente de instalação nem o hardware da escola. A primeira abertura desconectada, as permissões do usuário e a leitura no projetor seguem o [roteiro de validação](validacao.md).

Referências: [permissões por job](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idpermissions), [API de Releases e notas automáticas](https://docs.github.com/en/rest/releases/releases).
