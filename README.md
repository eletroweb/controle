# Sistema de Ordem de Serviço - BioStock

Este é um sistema digital para preenchimento de ordens de serviço técnico, baseado no formulário da BioStock. O sistema permite o preenchimento completo do formulário, assinaturas digitais do técnico e do cliente, geração de um arquivo PDF e armazenamento local das ordens para consulta futura.

## Funcionalidades

- Preenchimento digital de todos os campos da ordem de serviço
- Checklist de manutenção com opções de verificado/efetuado
- Campo para observações e informações técnicas
- Assinatura digital na tela (funciona em dispositivos móveis com toque)
- Geração de PDF com o documento completo
- Design responsivo (funciona em computadores, tablets e smartphones)
- **NOVO:** Armazenamento local das ordens de serviço para consulta futura
- **NOVO:** Interface adaptada para melhor funcionamento em dispositivos móveis

## Como Usar

1. Abra o arquivo `index.html` em um navegador web
2. Preencha todos os campos do formulário
3. Realize as assinaturas do técnico e do cliente nos campos correspondentes
4. Clique no botão "Gerar PDF" para criar e baixar o documento em formato PDF
5. As ordens de serviço são automaticamente salvas no armazenamento local do navegador
6. Para visualizar ordens salvas anteriormente, clique no botão "Ordens Salvas"

## Uso em Dispositivos Móveis

1. O sistema agora está otimizado para funcionar em smartphones e tablets
2. As assinaturas funcionam corretamente em telas sensíveis ao toque
3. A interface se adapta automaticamente ao tamanho da tela do dispositivo
4. Para melhor experiência em dispositivos móveis, recomendamos usar o navegador Chrome ou Safari

## Requisitos Técnicos

O sistema funciona em qualquer navegador moderno e não requer instalação. Para melhor experiência, recomenda-se:

- Navegadores: Chrome, Firefox, Edge ou Safari (versões atualizadas)
- Conexão com internet (para carregar as bibliotecas necessárias)
- Dispositivo com tela sensível ao toque para assinaturas (opcional)
- Armazenamento local habilitado no navegador (para salvar as ordens de serviço)

## Armazenamento Local

O sistema utiliza o armazenamento local (localStorage) do navegador para salvar as ordens de serviço preenchidas. Isso permite:

- Consultar ordens de serviço anteriores mesmo sem conexão com internet
- Visualizar histórico de ordens realizadas
- Excluir ordens antigas quando necessário

Importante: O armazenamento local é específico para cada dispositivo e navegador. As ordens salvas em um dispositivo não estarão disponíveis em outros dispositivos.

## Bibliotecas Utilizadas

- SignaturePad 4.0.0: Para captura de assinaturas digitais
- jsPDF 2.5.1: Para geração de documentos PDF
- html2canvas 1.4.1: Para converter o formulário HTML em imagem para o PDF

As bibliotecas agora são carregadas automaticamente a partir de CDNs, garantindo que o sistema funcione corretamente em qualquer dispositivo, incluindo smartphones e tablets.

## Acesso em Dispositivos Móveis

Para utilizar o sistema em celulares ou tablets, você tem as seguintes opções:

### Opção 1: Transferência Direta

1. Conecte seu dispositivo móvel ao computador via cabo USB
2. Copie todos os arquivos do sistema para uma pasta no seu dispositivo
3. Utilize um navegador no dispositivo móvel para abrir o arquivo `index.html`

### Opção 2: Compartilhamento via Rede Local

1. Certifique-se que o computador e o dispositivo móvel estão na mesma rede Wi-Fi
2. No computador, compartilhe a pasta que contém os arquivos do sistema
3. No dispositivo móvel, acesse o endereço de rede do computador através do navegador
4. Navegue até a pasta compartilhada e abra o arquivo `index.html`

### Opção 3: Hospedagem Web (Recomendado)

1. Hospede os arquivos em um servidor web (como GitHub Pages, Netlify, Vercel ou qualquer hospedagem de sua preferência)
2. Acesse o endereço web do sistema através do navegador do dispositivo móvel
3. Adicione a página aos favoritos ou crie um atalho na tela inicial para acesso rápido

## Suporte

Em caso de dúvidas ou problemas, entre em contato com o suporte técnico.