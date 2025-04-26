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
    
    if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
        console.error('jsPDF não está carregado. Adicionando script...');
        const jspdfScript = document.createElement('script');
        jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        document.head.appendChild(jspdfScript);
    }
    
    // Inicializar os pads de assinatura após garantir que a biblioteca está carregada
    let techSignaturePad, clientSignaturePad;
    
    function initSignaturePads() {
        const techBox = document.getElementById('techSignatureBox');
        const clientBox = document.getElementById('clientSignatureBox');
        
        if (techBox && clientBox && typeof SignaturePad !== 'undefined') {
            techSignaturePad = new SignaturePad(techBox);
            clientSignaturePad = new SignaturePad(clientBox);
            
            // Ajustar o tamanho inicial dos pads
            resizeSignaturePads();
            
            console.log('Pads de assinatura inicializados com sucesso');
        } else {
            console.log('Aguardando carregamento das bibliotecas...');
            setTimeout(initSignaturePads, 500);
        }
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
        // Verificar se as bibliotecas necessárias estão carregadas
        if (typeof html2canvas === 'undefined') {
            alert('Biblioteca html2canvas não está carregada. Por favor, tente novamente em alguns segundos.');
            return;
        }
        
        // Verificar se jsPDF está disponível em qualquer namespace
        if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
            alert('Biblioteca jsPDF não está carregada. Por favor, tente novamente em alguns segundos.');
            return;
        }
        
        // Verificar se as assinaturas foram feitas
        if (!techSignaturePad || !clientSignaturePad || techSignaturePad.isEmpty() || clientSignaturePad.isEmpty()) {
            alert('Por favor, certifique-se de que ambas as assinaturas foram realizadas.');
            return;
        }

        // Mostrar indicador de carregamento
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = '<div class="spinner"></div><p>Gerando PDF, por favor aguarde...</p>';
        document.body.appendChild(loadingIndicator);

        // Preparar para gerar o PDF
        try {
            // Verificar se jsPDF está disponível no namespace global ou no objeto window.jspdf
            let jsPDFClass;
            if (window.jspdf && window.jspdf.jsPDF) {
                jsPDFClass = window.jspdf.jsPDF;
            } else if (window.jsPDF) {
                jsPDFClass = window.jsPDF;
            } else {
                throw new Error('jsPDF não está disponível');
            }
            
            const doc = new jsPDFClass('p', 'mm', 'a4');
            const form = document.getElementById('serviceOrderForm');

            // Ajustar escala para dispositivos móveis
            const scale = 2;
            const options = {
                scale: scale,
                useCORS: true,
                allowTaint: true,
                scrollX: 0,
                scrollY: 0
            };

            // Usar html2canvas para capturar o formulário como uma imagem
            setTimeout(() => {
                html2canvas(form, options).then(canvas => {
                    try {
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
                        
                        // Salvar o PDF
                        doc.save(filename);
                        
                        // Salvar a ordem de serviço no localStorage
                        saveFormData(filename);
                        
                        // Remover indicador de carregamento
                        document.body.removeChild(loadingIndicator);
                        
                        // Mostrar mensagem de sucesso
                        alert('PDF gerado com sucesso! A ordem de serviço também foi salva localmente.');
                    } catch (error) {
                        console.error('Erro ao gerar PDF:', error);
                        document.body.removeChild(loadingIndicator);
                        alert('Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.');
                    }
                }).catch(error => {
                    console.error('Erro no html2canvas:', error);
                    document.body.removeChild(loadingIndicator);
                    alert('Ocorreu um erro ao capturar o formulário. Por favor, tente novamente.');
                });
            }, 500); // Pequeno delay para garantir que o indicador de carregamento seja exibido
        } catch (error) {
            console.error('Erro ao inicializar jsPDF:', error);
            alert('Ocorreu um erro ao inicializar o gerador de PDF. Verifique se todas as bibliotecas estão carregadas corretamente.');
        }
    });

    // Ajustar o tamanho dos pads de assinatura quando a janela for redimensionada
    window.addEventListener('resize', function() {
        resizeSignaturePads();
    });

    // Executar após um pequeno atraso para garantir que os elementos estejam carregados
    setTimeout(resizeSignaturePads, 500);

    function resizeSignaturePads() {
        // Redimensionar os pads de assinatura para se ajustarem aos seus contêineres
        const techBox = document.getElementById('techSignatureBox');
        const clientBox = document.getElementById('clientSignatureBox');
        
        if (!techBox || !clientBox || !techSignaturePad || !clientSignaturePad) {
            console.error('Elementos de assinatura não encontrados ou não inicializados');
            return;
        }
        
        // Salvar assinaturas temporariamente
        const techData = techSignaturePad.isEmpty() ? null : techSignaturePad.toDataURL();
        const clientData = clientSignaturePad.isEmpty() ? null : clientSignaturePad.toDataURL();
        
        // Limpar e reinicializar os pads com os novos tamanhos
        techSignaturePad.clear();
        clientSignaturePad.clear();
        
        // Definir largura e altura com base no tamanho do contêiner
        techSignaturePad.canvas.width = techBox.clientWidth;
        techSignaturePad.canvas.height = techBox.clientHeight;
        
        clientSignaturePad.canvas.width = clientBox.clientWidth;
        clientSignaturePad.canvas.height = clientBox.clientHeight;
        
        // Ajustar a escala do canvas para dispositivos de alta resolução
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        techSignaturePad.canvas.getContext("2d").scale(ratio, ratio);
        clientSignaturePad.canvas.getContext("2d").scale(ratio, ratio);
        
        // Restaurar assinaturas se existiam
        if (techData) {
            techSignaturePad.fromDataURL(techData);
        }
        
        if (clientData) {
            clientSignaturePad.fromDataURL(clientData);
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
            
            // Atualizar a lista de ordens salvas se o elemento existir
            updateSavedOrdersList();
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
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
            alert('Ordem não encontrada!');
            return;
        }
        
        // Aqui você pode implementar a lógica para exibir os detalhes da ordem
        // Por exemplo, preencher o formulário com os dados salvos
        alert(`Visualizando ordem ${order.orderNumber} - ${order.client}\nFuncionalidade em desenvolvimento.`);
    }
    
    // Função para excluir uma ordem salva
    function deleteSavedOrder(orderId) {
        if (!confirm('Tem certeza que deseja excluir esta ordem de serviço?')) return;
        
        let savedOrders = JSON.parse(localStorage.getItem('serviceOrders') || '[]');
        savedOrders = savedOrders.filter(o => o.id !== orderId);
        
        localStorage.setItem('serviceOrders', JSON.stringify(savedOrders));
        
        alert('Ordem de serviço excluída com sucesso!');
        updateSavedOrdersList();
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
    
    // Função para salvar a ordem de serviço no localStorage
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
});