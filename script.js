document.addEventListener('DOMContentLoaded', function() {
    // Verificar se as bibliotecas necessárias estão carregadas
    if (typeof SignaturePad === 'undefined') {
        console.error('SignaturePad não está carregado. Adicionando script...');
        const signatureScript = document.createElement('script');
        signatureScript.src = 'https://cdn.jsdelivr.net/npm/signature_pad@4.0.0/dist/signature_pad.umd.min.js';
        document.head.appendChild(signatureScript);
    }
    
    if (typeof html2canvas === 'undefined') {
        console.error('html2canvas não está carregado. Adicionando script...');
        const html2canvasScript = document.createElement('script');
        html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        document.head.appendChild(html2canvasScript);
    }
    
    if (typeof window.jspdf === 'undefined') {
        console.error('jsPDF não está carregado. Adicionando script...');
        const jspdfScript = document.createElement('script');
        jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        document.head.appendChild(jspdfScript);
    }
    
    // Adicionar notificação de status para o usuário
    const statusNotification = document.createElement('div');
    statusNotification.id = 'statusNotification';
    statusNotification.style.display = 'none';
    statusNotification.style.position = 'fixed';
    statusNotification.style.bottom = '20px';
    statusNotification.style.right = '20px';
    statusNotification.style.padding = '15px 20px';
    statusNotification.style.backgroundColor = '#4CAF50';
    statusNotification.style.color = 'white';
    statusNotification.style.borderRadius = '5px';
    statusNotification.style.zIndex = '1000';
    statusNotification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    document.body.appendChild(statusNotification);
    
    // Função para mostrar notificações ao usuário
    function showNotification(message, isSuccess = true) {
        statusNotification.textContent = message;
        statusNotification.style.backgroundColor = isSuccess ? '#4CAF50' : '#f44336';
        statusNotification.style.display = 'block';
        
        // Esconder a notificação após 5 segundos
        setTimeout(() => {
            statusNotification.style.display = 'none';
        }, 5000);
    }
    
    // Inicializar os pads de assinatura após garantir que a biblioteca está carregada
    let techSignaturePad, clientSignaturePad;
    
    function initSignaturePads() {
        const techBox = document.getElementById('techSignatureBox');
        const clientBox = document.getElementById('clientSignatureBox');
        
        if (!techBox || !clientBox) {
            console.error('Elementos de assinatura não encontrados no DOM');
            setTimeout(initSignaturePads, 500);
            return;
        }
        
        if (typeof SignaturePad === 'undefined') {
            console.error('Biblioteca SignaturePad não carregada');
            // Tentar carregar a biblioteca novamente
            const signatureScript = document.createElement('script');
            signatureScript.src = 'https://cdn.jsdelivr.net/npm/signature_pad@4.0.0/dist/signature_pad.umd.min.js';
            signatureScript.onload = function() {
                console.log('SignaturePad carregado com sucesso');
                setTimeout(initSignaturePads, 500);
            };
            document.head.appendChild(signatureScript);
            return;
        }
        
        try {
            // Configurar os canvas para assinaturas
            // Altura adaptativa para dispositivos móveis
            const isMobile = window.innerWidth < 768;
            const fixedHeight = isMobile ? 180 : 150;
            
            // Definir largura com base no tamanho do contêiner
            const techWidth = techBox.offsetWidth || techBox.clientWidth || 300;
            const clientWidth = clientBox.offsetWidth || clientBox.clientWidth || 300;
            
            // Limpar canvas existentes se houver
            while (techBox.firstChild) techBox.removeChild(techBox.firstChild);
            while (clientBox.firstChild) clientBox.removeChild(clientBox.firstChild);
            
            // Criar novos canvas
            const techCanvas = document.createElement('canvas');
            const clientCanvas = document.createElement('canvas');
            
            // Adicionar canvas aos contêineres
            techBox.appendChild(techCanvas);
            clientBox.appendChild(clientCanvas);
            
            // Aplicar dimensões ao canvas
            techCanvas.width = techWidth * (window.devicePixelRatio || 1);
            techCanvas.height = fixedHeight * (window.devicePixelRatio || 1);
            clientCanvas.width = clientWidth * (window.devicePixelRatio || 1);
            clientCanvas.height = fixedHeight * (window.devicePixelRatio || 1);
            
            // Aplicar estilos CSS para garantir que o canvas seja visível
            techCanvas.style.width = '100%';
            techCanvas.style.height = fixedHeight + 'px';
            clientCanvas.style.width = '100%';
            clientCanvas.style.height = fixedHeight + 'px';
            
            // Ajustar escala para dispositivos de alta resolução
            const techCtx = techCanvas.getContext('2d');
            const clientCtx = clientCanvas.getContext('2d');
            techCtx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
            clientCtx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
            
            // Inicializar com opções otimizadas para dispositivos móveis
            techSignaturePad = new SignaturePad(techCanvas, {
                minWidth: isMobile ? 1.5 : 1,
                maxWidth: isMobile ? 4 : 3,
                penColor: 'black',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                throttle: 16, // Melhor desempenho em dispositivos móveis
                velocityFilterWeight: 0.7 // Melhor suavização para toque
            });
            
            clientSignaturePad = new SignaturePad(clientCanvas, {
                minWidth: isMobile ? 1.5 : 1,
                maxWidth: isMobile ? 4 : 3,
                penColor: 'black',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                throttle: 16, // Melhor desempenho em dispositivos móveis
                velocityFilterWeight: 0.7 // Melhor suavização para toque
            });
            
            // Adicionar texto de orientação nas áreas de assinatura
            addSignatureHints();
            
            // Adicionar evento de redimensionamento da janela com debounce
            if (!window.signatureResizeListenerAdded) {
                window.addEventListener('resize', debounce(resizeSignaturePads, 250));
                window.signatureResizeListenerAdded = true;
            }

            // Adicionar eventos de toque diretamente aos canvas para evitar conflitos
            [techCanvas, clientCanvas].forEach(canvas => {
                canvas.addEventListener('touchstart', (e) => {
                    // Permitir scroll se o toque não for para desenhar
                    if (e.touches.length === 1) {
                       // A lógica de desenho do SignaturePad cuidará disso
                    }
                }, { passive: true }); // Usar passive: true para melhor performance de scroll

                canvas.addEventListener('touchmove', (e) => {
                    // Prevenir scroll APENAS quando estiver desenhando
                    if (e.touches.length === 1 && ((e.target === techCanvas && techSignaturePad && techSignaturePad.isDrawing) || (e.target === clientCanvas && clientSignaturePad && clientSignaturePad.isDrawing))) {
                        e.preventDefault();
                    }
                }, { passive: false }); // passive: false é necessário para preventDefault
            });

            console.log('Pads de assinatura inicializados com sucesso');
            showNotification('Sistema pronto para uso. Áreas de assinatura ativadas.', true);
        } catch (error) {
            console.error('Erro ao inicializar pads de assinatura:', error);
            showNotification('Erro ao inicializar áreas de assinatura. Tente recarregar a página.', false);
            // Não tentar re-inicializar automaticamente em caso de erro grave, pode causar loop
            // setTimeout(initSignaturePads, 1000);
        }
    }

    // Função Debounce para otimizar chamadas de resize
    function debounce(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };

    function addSignatureHints() {
        const signatureBoxes = document.querySelectorAll('.signature-box');
        signatureBoxes.forEach(box => {
            // Remover dicas anteriores se existirem
            const existingHint = box.parentNode.querySelector('.signature-hint');
            if (existingHint) {
                box.parentNode.removeChild(existingHint);
            }
            
            // Adicionar nova dica
            const hint = document.createElement('div');
            hint.className = 'signature-hint';
            hint.textContent = 'Toque e arraste para assinar';
            hint.style.textAlign = 'center';
            hint.style.color = '#666';
            hint.style.fontSize = '12px';
            hint.style.marginTop = '5px';
            hint.style.fontStyle = 'italic';
            box.parentNode.insertBefore(hint, box.nextSibling);
        });
    }
    
    // Iniciar após um pequeno delay para garantir que os elementos estão carregados
    setTimeout(initSignaturePads, 500);

    // Carregar ordens de serviço salvas
    loadSavedOrders();

    // Botões para limpar as assinaturas
    document.getElementById('clearTechSignature').addEventListener('click', function() {
        if (techSignaturePad) techSignaturePad.clear();
    });

    document.getElementById('clearClientSignature').addEventListener('click', function() {
        if (clientSignaturePad) clientSignaturePad.clear();
    });

    // Função para gerar o PDF
    document.getElementById('generatePDF').addEventListener('click', function() {
        console.log('Iniciando geração de PDF...');
        
        // Verificar se as bibliotecas necessárias estão carregadas
        if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
            console.error('Bibliotecas necessárias não carregadas. Carregando...');
            showNotification('Carregando bibliotecas necessárias. Por favor, aguarde...', false);
            
            // Carregar html2canvas se necessário
            if (typeof html2canvas === 'undefined') {
                const html2canvasScript = document.createElement('script');
                html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                document.head.appendChild(html2canvasScript);
            }
            
            // Carregar jsPDF se necessário
            if (typeof window.jspdf === 'undefined') {
                const jspdfScript = document.createElement('script');
                jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                document.head.appendChild(jspdfScript);
            }
            
            // Tentar novamente após um tempo
            setTimeout(() => {
                showNotification('Bibliotecas carregadas. Tente gerar o PDF novamente.', true);
            }, 2000);
            return;
        }
        
        // Verificar se as assinaturas foram feitas
        if (!techSignaturePad || !clientSignaturePad) {
            console.error('Pads de assinatura não inicializados');
            showNotification('Erro: Áreas de assinatura não inicializadas. Recarregando...', false);
            // Tentar inicializar novamente
            setTimeout(initSignaturePads, 500);
            return;
        }
        
        // Verificar campos obrigatórios
        const requiredFields = [
            { name: 'client', label: 'Cliente' },
            { name: 'date', label: 'Data' },
            { name: 'orderNumber', label: 'Número do Chamado' }
        ];
        
        let missingFields = [];
        requiredFields.forEach(field => {
            const input = document.querySelector(`input[name="${field.name}"]`);
            if (!input || !input.value.trim()) {
                missingFields.push(field.label);
                input.style.border = '2px solid red';
                setTimeout(() => {
                    input.style.border = '';
                }, 3000);
            }
        });
        
        if (missingFields.length > 0) {
            showNotification(`Por favor, preencha os campos: ${missingFields.join(', ')}`, false);
            document.querySelector(`input[name="${requiredFields[0].name}"]`).focus();
            return;
        }
        
        // Verificar assinaturas
        if (techSignaturePad.isEmpty()) {
            console.log('Assinatura do assessor não encontrada');
            showNotification('Por favor, adicione a assinatura do ASSESSOR antes de gerar o PDF.', false);
            const techBox = document.getElementById('techSignatureBox');
            techBox.style.border = '2px solid red';
            techBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                techBox.style.border = '';
            }, 3000);
            return;
        }
        
        if (clientSignaturePad.isEmpty()) {
            console.log('Assinatura do cliente não encontrada');
            showNotification('Por favor, adicione a assinatura do CLIENTE antes de gerar o PDF.', false);
            const clientBox = document.getElementById('clientSignatureBox');
            clientBox.style.border = '2px solid red';
            clientBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                clientBox.style.border = '';
            }, 3000);
            return;
        }

        // Mostrar indicador de carregamento
        showNotification('Gerando PDF, por favor aguarde...', true);
        
        // Criar e mostrar indicador de carregamento
        let loadingIndicator = document.querySelector('.loading-indicator');
        if (!loadingIndicator) {
            loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-indicator';
            loadingIndicator.innerHTML = '<div class="spinner"></div><p>Gerando PDF, por favor aguarde...</p>';
            document.body.appendChild(loadingIndicator);
        } else {
            loadingIndicator.style.display = 'flex';
        }

        // Preparar para gerar o PDF
        try {
            console.log('Verificando disponibilidade do jsPDF...');
            // Verificar se jsPDF está disponível no objeto window
            if (!window.jspdf || !window.jspdf.jsPDF) {
                throw new Error('jsPDF não está disponível corretamente');
            }
            
            console.log('Iniciando captura do formulário...');
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            const form = document.getElementById('serviceOrderForm');

            // Ajustar escala para dispositivos móveis
            const isMobile = window.innerWidth < 768;
            const scale = isMobile ? 2 : 1.5; // Escala maior para dispositivos móveis
            
            // Preparar o formulário para captura
            const originalPadding = form.style.padding;
            form.style.padding = '10px'; // Reduzir padding para melhor captura
            
            const options = {
                scale: scale,
                useCORS: true,
                allowTaint: true,
                scrollX: 0,
                scrollY: 0,
                windowWidth: document.documentElement.offsetWidth,
                windowHeight: document.documentElement.scrollHeight, // Usar altura total da página
                logging: false,
                backgroundColor: '#ffffff',
                imageTimeout: 15000,
                ignoreElements: function(element) {
                    // Ignorar apenas elementos específicos que não devem aparecer no PDF
                    return element.classList.contains('form-actions') || 
                           element.classList.contains('clear-button');
                },
                onclone: function(clonedDoc) {
                    // Garantir que todas as seções sejam visíveis
                    const clonedForm = clonedDoc.getElementById('serviceOrderForm');
                    if (clonedForm) {
                        clonedForm.style.overflow = 'visible';
                        clonedForm.style.height = 'auto';
                        // Manter apenas os botões ocultos
                        const buttons = clonedForm.querySelectorAll('.form-actions, .clear-button');
                        buttons.forEach(button => button.style.display = 'none');
                    }
                    // Garantir que as assinaturas sejam renderizadas
                    const signatureBoxes = clonedDoc.querySelectorAll('.signature-box');
                    signatureBoxes.forEach(box => {
                        box.style.visibility = 'visible';
                        box.style.opacity = '1';
                    });
                }
            };

            // Usar html2canvas para capturar o formulário como uma imagem
            setTimeout(() => {
                console.log('Executando html2canvas...');
                html2canvas(form, options).then(canvas => {
                    try {
                        // Restaurar o padding original
                        form.style.padding = originalPadding;
                        
                        console.log('Canvas gerado com sucesso, criando PDF...');
                        // Adicionar a imagem do formulário ao PDF
                        const imgData = canvas.toDataURL('image/jpeg', 0.95);
                        const imgWidth = 210; // A4 width in mm
                        const pageHeight = 297; // A4 height in mm
                        const imgHeight = canvas.height * imgWidth / canvas.width;
                        let heightLeft = imgHeight;
                        let position = 0;

                        doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                        heightLeft -= pageHeight;

                        // Se o formulário for maior que uma página, adicionar mais páginas
                        while (heightLeft >= 0) {
                            position = heightLeft - imgHeight;
                            doc.addPage();
                            doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                            heightLeft -= pageHeight;
                        }

                        // Obter a data atual para o nome do arquivo
                        const today = new Date();
                        const date = today.toISOString().split('T')[0];
                        const orderNumber = document.querySelector('input[name="orderNumber"]').value || 'sem-numero';
                        const clientName = document.querySelector('input[name="client"]').value || 'cliente';
                        const filename = `OS_${orderNumber}_${clientName}_${date}.pdf`;
                        
                        console.log('Salvando PDF:', filename);
                        // Salvar o PDF
                        doc.save(filename);
                        
                        // Remover o indicador de carregamento
                        if (loadingIndicator) {
                            loadingIndicator.style.display = 'none';
                        }
                        
                        // Mostrar notificação de sucesso
                        showNotification('PDF gerado com sucesso!', true);
                        
                        // Salvar a ordem de serviço no armazenamento local
                        saveCurrentOrder(filename);
                        
                        console.log('PDF gerado com sucesso!');
                    } catch (error) {
                        console.error('Erro ao gerar PDF:', error);
                        showNotification('Erro ao gerar o PDF: ' + error.message, false);
                        if (loadingIndicator) {
                            loadingIndicator.style.display = 'none';
                        }
                    }
                }).catch(error => {
                    console.error('Erro no html2canvas:', error);
                    showNotification('Erro ao capturar o formulário: ' + error.message, false);
                    if (loadingIndicator) {
                        loadingIndicator.style.display = 'none';
                    }
                });
            }, 500);
        } catch (error) {
            console.error('Erro ao iniciar geração de PDF:', error);
            showNotification('Erro ao iniciar geração de PDF: ' + error.message, false);
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
        }
    });


    // Ajustar o tamanho dos pads de assinatura quando a janela for redimensionada
    window.addEventListener('resize', function() {
        resizeSignaturePads();
    });

    // Executar após um pequeno atraso para garantir que os elementos estejam carregados
    setTimeout(resizeSignaturePads, 500);

    function generatePDF() {
    // Garantir que todo o conteúdo seja renderizado antes de capturar
    document.querySelectorAll('.signature-field').forEach(field => {
        field.style.display = 'block';
        field.style.visibility = 'visible';
    });

    // Capturar todo o formulário incluindo as assinaturas
    const element = document.getElementById('mainForm');
    
    html2canvas(element, {
        scale: 2,
        logging: true,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.scrollWidth
        // windowHeight: element.scrollHeight // Removido para permitir que html2canvas determine a altura
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('formulario.pdf');
    });
}

function resizeSignaturePads() {
        // Redimensionar os pads de assinatura para se ajustarem aos seus contêineres
        const techBox = document.getElementById('techSignatureBox');
        const clientBox = document.getElementById('clientSignatureBox');
        
        if (!techBox || !clientBox) {
            console.error('Elementos de assinatura não encontrados');
            return;
        }
        
        if (!techSignaturePad || !clientSignaturePad) {
            console.error('SignaturePad não inicializado corretamente');
            // Tentar inicializar novamente
            setTimeout(initSignaturePads, 500);
            return;
        }
        
        try {
            // Salvar assinaturas temporariamente
            const techData = techSignaturePad.isEmpty() ? null : techSignaturePad.toDataURL();
            const clientData = clientSignaturePad.isEmpty() ? null : clientSignaturePad.toDataURL();
            
            // Limpar canvas existentes
            while (techBox.firstChild) techBox.removeChild(techBox.firstChild);
            while (clientBox.firstChild) clientBox.removeChild(clientBox.firstChild);
            
            // Criar novos canvas
            const techCanvas = document.createElement('canvas');
            const clientCanvas = document.createElement('canvas');
            
            // Adicionar canvas aos contêineres
            techBox.appendChild(techCanvas);
            clientBox.appendChild(clientCanvas);
            
            // Definir altura adaptativa para dispositivos móveis
            const isMobile = window.innerWidth < 768;
            const fixedHeight = isMobile ? 180 : 150;
            
            // Definir largura com base no tamanho do contêiner
            const techWidth = techBox.offsetWidth || techBox.clientWidth || 300;
            const clientWidth = clientBox.offsetWidth || clientBox.clientWidth || 300;
            
            // Aplicar dimensões ao canvas com ajuste para dispositivos de alta resolução
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            techCanvas.width = techWidth * ratio;
            techCanvas.height = fixedHeight * ratio;
            clientCanvas.width = clientWidth * ratio;
            clientCanvas.height = fixedHeight * ratio;
            
            // Aplicar estilos CSS para garantir que o canvas seja visível
            techCanvas.style.width = '100%';
            techCanvas.style.height = fixedHeight + 'px';
            clientCanvas.style.width = '100%';
            clientCanvas.style.height = fixedHeight + 'px';
            
            // Ajustar a escala do canvas para dispositivos de alta resolução
            const techCtx = techCanvas.getContext('2d');
            const clientCtx = clientCanvas.getContext('2d');
            
            // Limpar transformações anteriores e aplicar nova escala
            techCtx.setTransform(1, 0, 0, 1, 0, 0);
            clientCtx.setTransform(1, 0, 0, 1, 0, 0);
            techCtx.scale(ratio, ratio);
            clientCtx.scale(ratio, ratio);
            
            // Reinicializar os pads de assinatura
            techSignaturePad = new SignaturePad(techCanvas, {
                minWidth: isMobile ? 1.5 : 1,
                maxWidth: isMobile ? 4 : 3,
                penColor: 'black',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                throttle: 16,
                velocityFilterWeight: 0.7
            });
            
            clientSignaturePad = new SignaturePad(clientCanvas, {
                minWidth: isMobile ? 1.5 : 1,
                maxWidth: isMobile ? 4 : 3,
                penColor: 'black',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                throttle: 16,
                velocityFilterWeight: 0.7
            });
            
            // Restaurar assinaturas se existiam
            if (techData) {
                techSignaturePad.fromDataURL(techData);
            }
            
            if (clientData) {
                clientSignaturePad.fromDataURL(clientData);
            }
            
            // Atualizar dicas visuais
            addSignatureHints();
            
            // Adicionar eventos de toque aos novos canvas após redimensionamento
            [techCanvas, clientCanvas].forEach(canvas => {
                 canvas.addEventListener('touchstart', (e) => {
                    if (e.touches.length === 1) {
                       // A lógica de desenho do SignaturePad cuidará disso
                    }
                }, { passive: true });

                canvas.addEventListener('touchmove', (e) => {
                    // Prevenir scroll APENAS quando estiver desenhando
                    if (e.touches.length === 1 && ((e.target === techCanvas && techSignaturePad && techSignaturePad.isDrawing) || (e.target === clientCanvas && clientSignaturePad && clientSignaturePad.isDrawing))) {
                         e.preventDefault();
                    }
                }, { passive: false });
            });

            console.log('Pads de assinatura redimensionados com sucesso');
        } catch (error) {
            console.error('Erro ao redimensionar pads de assinatura:', error);
            showNotification('Erro ao configurar áreas de assinatura. Tente recarregar a página.', false);
            // Não tentar re-inicializar automaticamente em caso de erro grave
            // setTimeout(initSignaturePads, 1000);
        }
    }

    // Função para salvar dados do formulário no localStorage
    function saveFormData(filename) {
        try {
            // Coletar todos os dados do formulário
            const formData = {
                id: Date.now(), // ID único baseado no timestamp
                filename: filename,
                date: document.querySelector('input[name="date"]').value,
                orderNumber: document.querySelector('input[name="orderNumber"]').value,
                client: document.querySelector('input[name="client"]').value,
                equipment: document.querySelector('input[name="equipment"]').value,
                serialNumber: document.querySelector('input[name="serialNumber"]').value,
                techSignature: techSignaturePad ? techSignaturePad.toDataURL() : null,
                clientSignature: clientSignaturePad ? clientSignaturePad.toDataURL() : null,
                assessorName: document.getElementById('assessorName').value,
                clientName: document.getElementById('clientName').value,
                createdAt: new Date().toISOString()
            };
            
            // Obter ordens existentes ou inicializar array vazio
            let savedOrders = JSON.parse(localStorage.getItem('serviceOrders') || '[]');
            
            // Adicionar nova ordem
            savedOrders.push(formData);
            
            // Limitar a quantidade de ordens salvas para evitar exceder o limite do localStorage
            if (savedOrders.length > 50) {
                savedOrders = savedOrders.slice(-50); // Manter apenas as 50 mais recentes
            }
            
            // Salvar no localStorage
            localStorage.setItem('serviceOrders', JSON.stringify(savedOrders));
            
            console.log('Dados salvos com sucesso no armazenamento local');
            
            // Mostrar notificação de sucesso
            showNotification(`Ordem de serviço #${formData.orderNumber || 'S/N'} salva no histórico com sucesso!`, true);
            
            // Atualizar a lista de ordens salvas se o elemento existir
            updateSavedOrdersList();
            
            // Adicionar animação de destaque ao botão de ordens salvas
            const savedOrdersBtn = document.getElementById('showSavedOrders');
            if (savedOrdersBtn) {
                savedOrdersBtn.classList.add('highlight-button');
                setTimeout(() => {
                    savedOrdersBtn.classList.remove('highlight-button');
                }, 3000);
            }
            
            return true;
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            showNotification('Erro ao salvar a ordem no histórico. Verifique o console para mais detalhes.', false);
            return false;
        }
    }
    
    // Função para atualizar a lista de ordens salvas
    function updateSavedOrdersList() {
        const savedOrdersList = document.getElementById('savedOrdersList');
        if (!savedOrdersList) return;
        
        // Limpar lista atual
        savedOrdersList.innerHTML = '';
        
        // Obter ordens salvas
        const savedOrders = JSON.parse(localStorage.getItem('serviceOrders') || '[]');
        
        if (savedOrders.length === 0) {
            savedOrdersList.innerHTML = '<p>Nenhuma ordem de serviço salva.</p>';
            return;
        }
        
        // Criar lista de ordens salvas
        const ul = document.createElement('ul');
        ul.className = 'saved-orders-list';
        
        savedOrders.reverse().forEach(order => {
            const li = document.createElement('li');
            li.className = 'saved-order-item';
            
            const orderDate = order.date ? new Date(order.date).toLocaleDateString() : 'Data não informada';
            
            li.innerHTML = `
                <div class="order-info">
                    <strong>OS ${order.orderNumber || 'S/N'}</strong> - 
                    ${order.client || 'Cliente não informado'} - 
                    ${orderDate}
                </div>
                <div class="order-actions">
                    <button class="view-order" data-id="${order.id}">Visualizar</button>
                    <button class="delete-order" data-id="${order.id}">Excluir</button>
                </div>
            `;
            
            ul.appendChild(li);
        });
        
        savedOrdersList.appendChild(ul);
        
        // Adicionar event listeners para os botões
        document.querySelectorAll('.view-order').forEach(button => {
            button.addEventListener('click', function() {
                const orderId = parseInt(this.getAttribute('data-id'));
                viewSavedOrder(orderId);
            });
        });
        
        document.querySelectorAll('.delete-order').forEach(button => {
            button.addEventListener('click', function() {
                const orderId = parseInt(this.getAttribute('data-id'));
                deleteSavedOrder(orderId);
            });
        });
    }
    
    // Função para visualizar uma ordem salva
    function viewSavedOrder(orderId) {
        const savedOrders = JSON.parse(localStorage.getItem('serviceOrders') || '[]');
        const order = savedOrders.find(o => o.id === orderId);
        
        if (!order) {
            showNotification('Ordem não encontrada!', false);
            return;
        }
        
        // Mostrar notificação informativa
        showNotification(`Visualizando ordem #${order.orderNumber || 'S/N'} - ${order.client || 'Cliente não informado'}`, true);
        
        // Criar um modal para exibir os detalhes da ordem
        const modal = document.createElement('div');
        modal.className = 'order-details-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Detalhes da Ordem de Serviço #${order.orderNumber || 'S/N'}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <p><strong>Cliente:</strong> ${order.client || 'Não informado'}</p>
                    <p><strong>Data:</strong> ${order.date ? new Date(order.date).toLocaleDateString() : 'Não informada'}</p>
                    <p><strong>Equipamento:</strong> ${order.equipment || 'Não informado'}</p>
                    <p><strong>Número de Série:</strong> ${order.serialNumber || 'Não informado'}</p>
                    <p><strong>Arquivo PDF:</strong> ${order.filename || 'Não disponível'}</p>
                    <p><strong>Criado em:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                    
                    <div class="signatures-preview">
                        <div class="signature-preview">
                            <h4>Assinatura do Assessor</h4>
                            <img src="${order.techSignature || ''}" alt="Assinatura do Assessor" />
                        </div>
                        <div class="signature-preview">
                            <h4>Assinatura do Cliente</h4>
                            <img src="${order.clientSignature || ''}" alt="Assinatura do Cliente" />
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="close-modal-btn">Fechar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Adicionar estilos para o modal
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '2000';
        
        const modalContent = modal.querySelector('.modal-content');
        modalContent.style.backgroundColor = 'white';
        modalContent.style.borderRadius = '8px';
        modalContent.style.width = '90%';
        modalContent.style.maxWidth = '600px';
        modalContent.style.maxHeight = '90vh';
        modalContent.style.overflow = 'auto';
        modalContent.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
        
        const modalHeader = modal.querySelector('.modal-header');
        modalHeader.style.display = 'flex';
        modalHeader.style.justifyContent = 'space-between';
        modalHeader.style.alignItems = 'center';
        modalHeader.style.padding = '15px 20px';
        modalHeader.style.borderBottom = '1px solid #eee';
        
        const modalBody = modal.querySelector('.modal-body');
        modalBody.style.padding = '20px';
        
        const modalFooter = modal.querySelector('.modal-footer');
        modalFooter.style.padding = '15px 20px';
        modalFooter.style.borderTop = '1px solid #eee';
        modalFooter.style.textAlign = 'right';
        
        const closeButtons = modal.querySelectorAll('.close-modal, .close-modal-btn');
        closeButtons.forEach(button => {
            button.style.cursor = 'pointer';
            if (button.classList.contains('close-modal')) {
                button.style.background = 'none';
                button.style.border = 'none';
                button.style.fontSize = '24px';
            } else {
                button.style.padding = '8px 15px';
                button.style.backgroundColor = '#4CAF50';
                button.style.color = 'white';
                button.style.border = 'none';
                button.style.borderRadius = '4px';
            }
            
            button.addEventListener('click', function() {
                document.body.removeChild(modal);
            });
        });
        
        const signaturesPreview = modal.querySelector('.signatures-preview');
        signaturesPreview.style.display = 'flex';
        signaturesPreview.style.justifyContent = 'space-between';
        signaturesPreview.style.marginTop = '20px';
        
        const signaturePreviewDivs = modal.querySelectorAll('.signature-preview');
        signaturePreviewDivs.forEach(div => {
            div.style.flex = '1';
            div.style.margin = '0 10px';
            div.style.textAlign = 'center';
            
            const img = div.querySelector('img');
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.border = '1px solid #ddd';
            img.style.borderRadius = '4px';
            img.style.backgroundColor = '#f9f9f9';
        });
    }
    
    // Função para excluir uma ordem salva
    function deleteSavedOrder(orderId) {
        // Criar um modal de confirmação personalizado
        const confirmModal = document.createElement('div');
        confirmModal.className = 'confirm-modal';
        confirmModal.innerHTML = `
            <div class="confirm-content">
                <h3>Confirmação</h3>
                <p>Tem certeza que deseja excluir esta ordem de serviço?</p>
                <div class="confirm-buttons">
                    <button id="confirmYes" class="confirm-yes">Sim, excluir</button>
                    <button id="confirmNo" class="confirm-no">Cancelar</button>
                </div>
            </div>
        `;
        
        // Adicionar estilos para o modal
        confirmModal.style.position = 'fixed';
        confirmModal.style.top = '0';
        confirmModal.style.left = '0';
        confirmModal.style.width = '100%';
        confirmModal.style.height = '100%';
        confirmModal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        confirmModal.style.display = 'flex';
        confirmModal.style.justifyContent = 'center';
        confirmModal.style.alignItems = 'center';
        confirmModal.style.zIndex = '2000';
        
        const confirmContent = confirmModal.querySelector('.confirm-content');
        confirmContent.style.backgroundColor = 'white';
        confirmContent.style.borderRadius = '8px';
        confirmContent.style.padding = '20px';
        confirmContent.style.width = '90%';
        confirmContent.style.maxWidth = '400px';
        confirmContent.style.textAlign = 'center';
        confirmContent.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
        
        const confirmButtons = confirmModal.querySelector('.confirm-buttons');
        confirmButtons.style.display = 'flex';
        confirmButtons.style.justifyContent = 'center';
        confirmButtons.style.gap = '10px';
        confirmButtons.style.marginTop = '20px';
        
        const yesButton = confirmModal.querySelector('#confirmYes');
        yesButton.style.padding = '8px 15px';
        yesButton.style.backgroundColor = '#f44336';
        yesButton.style.color = 'white';
        yesButton.style.border = 'none';
        yesButton.style.borderRadius = '4px';
        yesButton.style.cursor = 'pointer';
        
        const noButton = confirmModal.querySelector('#confirmNo');
        noButton.style.padding = '8px 15px';
        noButton.style.backgroundColor = '#ccc';
        noButton.style.color = 'black';
        noButton.style.border = 'none';
        noButton.style.borderRadius = '4px';
        noButton.style.cursor = 'pointer';
        
        document.body.appendChild(confirmModal);
        
        // Adicionar event listeners para os botões
        yesButton.addEventListener('click', function() {
            // Excluir a ordem
            let savedOrders = JSON.parse(localStorage.getItem('serviceOrders') || '[]');
            const orderToDelete = savedOrders.find(o => o.id === orderId);
            savedOrders = savedOrders.filter(o => o.id !== orderId);
            
            localStorage.setItem('serviceOrders', JSON.stringify(savedOrders));
            
            // Remover o modal
            document.body.removeChild(confirmModal);
            
            // Mostrar notificação de sucesso
            showNotification(`Ordem de serviço #${orderToDelete?.orderNumber || 'S/N'} excluída com sucesso!`, true);
            
            // Atualizar a lista
            updateSavedOrdersList();
        });
        
        noButton.addEventListener('click', function() {
            // Apenas fechar o modal
            document.body.removeChild(confirmModal);
        });
    }
    
    // Adicionar botão para mostrar ordens salvas
    const actionsDiv = document.querySelector('.actions') || document.createElement('div');
    if (!document.querySelector('#showSavedOrders')) {
        const showSavedOrdersBtn = document.createElement('button');
        showSavedOrdersBtn.id = 'showSavedOrders';
        showSavedOrdersBtn.type = 'button';
        showSavedOrdersBtn.className = 'action-button';
        showSavedOrdersBtn.textContent = 'Ordens Salvas';
        showSavedOrdersBtn.addEventListener('click', toggleSavedOrdersPanel);
        
        actionsDiv.appendChild(showSavedOrdersBtn);
        
        if (!document.querySelector('.actions')) {
            actionsDiv.className = 'actions';
            const form = document.getElementById('serviceOrderForm');
            form.appendChild(actionsDiv);
        }
    }
    
    // Criar painel para exibir ordens salvas
    if (!document.getElementById('savedOrdersPanel')) {
        const panel = document.createElement('div');
        panel.id = 'savedOrdersPanel';
        panel.className = 'saved-orders-panel';
        panel.style.display = 'none';
        
        panel.innerHTML = `
            <div class="panel-header">
                <h3>Ordens de Serviço Salvas</h3>
                <button id="closeSavedOrdersPanel" class="close-button">&times;</button>
            </div>
            <div id="savedOrdersList" class="panel-content">
                <p>Carregando...</p>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        document.getElementById('closeSavedOrdersPanel').addEventListener('click', function() {
            document.getElementById('savedOrdersPanel').style.display = 'none';
        });
    }
    
    // Função para mostrar/ocultar o painel de ordens salvas
    function toggleSavedOrdersPanel() {
        const panel = document.getElementById('savedOrdersPanel');
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
            updateSavedOrdersList();
            
            // Remover destaque do botão quando o painel é aberto
            const savedOrdersBtn = document.getElementById('showSavedOrders');
            if (savedOrdersBtn) {
                savedOrdersBtn.classList.remove('highlight-button');
            }
            
            // Mostrar notificação informativa
            showNotification('Visualizando histórico de ordens de serviço', true);
        } else {
            panel.style.display = 'none';
        }
    }

    // Adicionar validação básica para o formulário
    document.getElementById('serviceOrderForm').addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Verificar campos obrigatórios
        const requiredFields = ['client', 'equipment'];
        let isValid = true;
        
        requiredFields.forEach(field => {
            const input = document.querySelector(`input[name="${field}"]`);
            if (!input.value.trim()) {
                input.style.borderColor = 'red';
                isValid = false;
            } else {
                input.style.borderColor = '#ccc';
            }
        });
        
        if (!isValid) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        
        // Se tudo estiver válido, gerar o PDF
        document.getElementById('generatePDF').click();
    });
    
    // Função para salvar a ordem de serviço atual no localStorage
    function saveCurrentOrder(filename) {
        try {
            // Coletar todos os dados do formulário
            const formData = {
                id: Date.now(), // ID único baseado no timestamp
                filename: filename || '',
                date: document.querySelector('input[name="date"]').value,
                orderNumber: document.querySelector('input[name="orderNumber"]').value,
                client: document.querySelector('input[name="client"]').value,
                equipment: document.querySelector('input[name="equipment"]').value,
                serialNumber: document.querySelector('input[name="serialNumber"]').value,
                techSignature: techSignaturePad ? techSignaturePad.toDataURL() : null,
                clientSignature: clientSignaturePad ? clientSignaturePad.toDataURL() : null,
                assessorName: document.getElementById('assessorName').value,
                clientName: document.getElementById('clientName').value,
                createdAt: new Date().toISOString()
            };
            
            // Obter ordens existentes ou inicializar array vazio
            let savedOrders = JSON.parse(localStorage.getItem('serviceOrders') || '[]');
            
            // Adicionar nova ordem
            savedOrders.push(formData);
            
            // Limitar a quantidade de ordens salvas para evitar exceder o limite do localStorage
            if (savedOrders.length > 50) {
                savedOrders = savedOrders.slice(-50); // Manter apenas as 50 mais recentes
            }
            
            // Salvar no localStorage
            localStorage.setItem('serviceOrders', JSON.stringify(savedOrders));
            
            console.log('Dados salvos com sucesso no armazenamento local');
            
            // Mostrar notificação de sucesso
            showNotification(`Ordem de serviço #${formData.orderNumber || 'S/N'} salva no histórico com sucesso!`, true);
            
            // Atualizar a lista de ordens salvas se o elemento existir
            updateSavedOrdersList();
            
            return true;
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            showNotification('Erro ao salvar a ordem no histórico. Verifique o console para mais detalhes.', false);
            return false;
        }
    }
    
    // Função para salvar a ordem de serviço no localStorage (versão antiga)
    function saveServiceOrder() {
        const form = document.getElementById('serviceOrderForm');
        const formData = new FormData(form);
        const orderData = {};
        
        // Converter FormData para objeto
        for (let [key, value] of formData.entries()) {
            orderData[key] = value;
        }
        
        // Adicionar assinaturas
        orderData.techSignature = techSignaturePad.toDataURL();
        orderData.clientSignature = clientSignaturePad.toDataURL();
        
        // Adicionar data e hora de criação
        orderData.createdAt = new Date().toISOString();
        
        // Gerar ID único para a ordem de serviço
        const orderId = `os_${Date.now()}`;
        
        // Obter ordens salvas anteriormente
        let savedOrders = JSON.parse(localStorage.getItem('serviceOrders')) || {};
        
        // Adicionar nova ordem
        savedOrders[orderId] = orderData;
        
        // Salvar no localStorage
        try {
            localStorage.setItem('serviceOrders', JSON.stringify(savedOrders));
            console.log('Ordem de serviço salva com sucesso:', orderId);
        } catch (error) {
            console.error('Erro ao salvar ordem de serviço:', error);
            alert('Não foi possível salvar a ordem de serviço localmente. O armazenamento pode estar cheio.');
        }
    }
    
    // Função para carregar ordens de serviço salvas
    function loadSavedOrders() {
        // Verificar se já existe o botão de histórico
        if (document.getElementById('viewHistory')) return;
        
        // Criar botão para visualizar histórico
        const historyButton = document.createElement('button');
        historyButton.id = 'viewHistory';
        historyButton.type = 'button';
        historyButton.className = 'action-button';
        historyButton.textContent = 'Ver Histórico';
        
        // Adicionar botão ao lado do botão de gerar PDF
        const generatePDFButton = document.getElementById('generatePDF');
        if (generatePDFButton && generatePDFButton.parentNode) {
            generatePDFButton.parentNode.insertBefore(historyButton, generatePDFButton);
        } else {
            // Caso não encontre o botão de gerar PDF, adiciona ao final do formulário
            document.getElementById('serviceOrderForm').appendChild(historyButton);
        }
        
        // Adicionar evento de clique para mostrar histórico
        historyButton.addEventListener('click', showOrderHistory);
    }
    
    // Função para mostrar o histórico de ordens de serviço
    function showOrderHistory() {
        // Obter ordens salvas
        const savedOrders = JSON.parse(localStorage.getItem('serviceOrders')) || {};
        const orderIds = Object.keys(savedOrders);
        
        if (orderIds.length === 0) {
            alert('Não há ordens de serviço salvas.');
            return;
        }
        
        // Criar modal para mostrar histórico
        const modal = document.createElement('div');
        modal.className = 'history-modal';
        
        // Criar conteúdo do modal
        const modalContent = document.createElement('div');
        modalContent.className = 'history-modal-content';
        
        // Título do modal
        const title = document.createElement('h2');
        title.textContent = 'Histórico de Ordens de Serviço';
        modalContent.appendChild(title);
        
        // Lista de ordens
        const orderList = document.createElement('ul');
        orderList.className = 'order-list';
        
        // Ordenar por data de criação (mais recente primeiro)
        orderIds.sort((a, b) => {
            const dateA = new Date(savedOrders[a].createdAt || 0);
            const dateB = new Date(savedOrders[b].createdAt || 0);
            return dateB - dateA;
        });
        
        // Adicionar cada ordem à lista
        orderIds.forEach(id => {
            const order = savedOrders[id];
            const listItem = document.createElement('li');
            
            // Formatar data
            const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Data desconhecida';
            
            // Informações da ordem
            listItem.innerHTML = `
                <div class="order-info">
                    <strong>Cliente:</strong> ${order.client || 'Não informado'}<br>
                    <strong>Equipamento:</strong> ${order.equipment || 'Não informado'}<br>
                    <strong>Data:</strong> ${order.date || 'Não informada'}<br>
                    <strong>Criado em:</strong> ${createdAt}
                </div>
                <div class="order-actions">
                    <button class="load-order" data-id="${id}">Carregar</button>
                    <button class="delete-order" data-id="${id}">Excluir</button>
                </div>
            `;
            
            orderList.appendChild(listItem);
        });
        
        modalContent.appendChild(orderList);
        
        // Botão para fechar o modal
        const closeButton = document.createElement('button');
        closeButton.className = 'close-modal';
        closeButton.textContent = 'Fechar';
        closeButton.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modalContent.appendChild(closeButton);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Adicionar eventos aos botões de carregar e excluir
        document.querySelectorAll('.load-order').forEach(button => {
            button.addEventListener('click', function() {
                const orderId = this.getAttribute('data-id');
                loadOrder(orderId);
                document.body.removeChild(modal);
            });
        });
        
        document.querySelectorAll('.delete-order').forEach(button => {
            button.addEventListener('click', function() {
                const orderId = this.getAttribute('data-id');
                if (confirm('Tem certeza que deseja excluir esta ordem de serviço?')) {
                    deleteOrder(orderId);
                    this.closest('li').remove();
                    
                    // Se não houver mais ordens, fechar o modal
                    if (orderList.children.length === 0) {
                        document.body.removeChild(modal);
                        alert('Não há mais ordens de serviço salvas.');
                    }
                }
            });
        });
    }
    
    // Função para carregar uma ordem de serviço
    function loadOrder(orderId) {
        const savedOrders = JSON.parse(localStorage.getItem('serviceOrders')) || {};
        const order = savedOrders[orderId];
        
        if (!order) {
            alert('Ordem de serviço não encontrada.');
            return;
        }
        
        // Preencher o formulário com os dados da ordem
        const form = document.getElementById('serviceOrderForm');
        
        // Preencher campos de texto
        for (const key in order) {
            if (key === 'techSignature' || key === 'clientSignature' || key === 'createdAt') continue;
            
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = order[key] === 'on';
                } else {
                    input.value = order[key];
                }
            }
        }
        
        // Carregar assinaturas
        if (order.techSignature) {
            techSignaturePad.fromDataURL(order.techSignature);
        }
        
        if (order.clientSignature) {
            clientSignaturePad.fromDataURL(order.clientSignature);
        }
        
        alert('Ordem de serviço carregada com sucesso!');
    }
    
    // Função para excluir uma ordem de serviço
    function deleteOrder(orderId) {
        const savedOrders = JSON.parse(localStorage.getItem('serviceOrders')) || {};
        
        if (savedOrders[orderId]) {
            delete savedOrders[orderId];
            localStorage.setItem('serviceOrders', JSON.stringify(savedOrders));
            console.log('Ordem de serviço excluída:', orderId);
        }
    }

    // Inicializar tudo quando o DOM estiver pronto
    console.log('Adicionando listener para DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM carregado, inicializando aplicação...');
        initSignaturePads(); // Inicializa os pads de assinatura
        loadFormData(); // Carregar dados salvos, se houver
        setupEventListeners(); // Configurar outros ouvintes de eventos
    });

}); // Fechamento do wrapper IIFE ou similar